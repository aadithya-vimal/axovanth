import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workspaces")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();
  },
});

export const getMyMemberships = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
    if (!user) return [];

    const memberships = await ctx.db.query("workspaceMembers").withIndex("by_user", q => q.eq("userId", user._id)).collect();
    const myWorkspaceIds = [];
    for (const m of memberships) {
      const ws = await ctx.db.get(m.workspaceId);
      if (ws && ws.companyId === args.companyId) {
        myWorkspaceIds.push(m.workspaceId);
      }
    }
    return myWorkspaceIds;
  }
});

export const requestAccess = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db.query("workspaceRequests")
      .withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId))
      .filter(q => q.eq(q.field("userId"), user._id))
      .first();
    
    if (existing) throw new Error("Request already pending or processed");

    await ctx.db.insert("workspaceRequests", {
      workspaceId: args.workspaceId,
      userId: user._id,
      status: "pending"
    });
  }
});

export const getRequests = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const workspaces = await ctx.db.query("workspaces").withIndex("by_company", q => q.eq("companyId", args.companyId)).collect();
    const workspaceIds = workspaces.map(w => w._id);
    
    let allRequests = [];
    for (const wid of workspaceIds) {
      const reqs = await ctx.db.query("workspaceRequests").withIndex("by_workspace", q => q.eq("workspaceId", wid)).collect();
      const pending = reqs.filter(r => r.status === "pending");
      for (const r of pending) {
        const user = await ctx.db.get(r.userId);
        const ws = workspaces.find(w => w._id === r.workspaceId);
        allRequests.push({ ...r, user, workspaceName: ws?.name });
      }
    }
    return allRequests;
  }
});

export const resolveAccessRequest = mutation({
  args: { requestId: v.id("workspaceRequests"), approved: v.boolean() },
  handler: async (ctx, args) => {
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Request not found");
    
    await ctx.db.patch(args.requestId, { status: args.approved ? "approved" : "rejected" });

    if (args.approved) {
      await ctx.db.insert("workspaceMembers", {
        workspaceId: req.workspaceId,
        userId: req.userId,
        role: "member"
      });
    }
  }
});

export const getMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return { ...member, user };
      })
    );
  },
});

export const getMyself = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) return null;

    const wsMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", user._id))
      .unique();

    const companyMember = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_and_user", (q) => q.eq("companyId", workspace.companyId).eq("userId", user._id))
      .unique();
    
    return {
      workspaceRole: wsMember?.role || null,
      companyRole: companyMember?.role || null,
      isOverallAdmin: companyMember?.role === "admin"
    };
  },
});

export const getMyAdminStats = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { isOverallAdmin: false, adminWorkspaceIds: [] };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return { isOverallAdmin: false, adminWorkspaceIds: [] };

    const companyMember = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_and_user", (q) => q.eq("companyId", args.companyId).eq("userId", user._id))
      .unique();

    const workspaceMemberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const adminWorkspaceIds = workspaceMemberships
      .filter(m => m.role === "admin")
      .map(m => m.workspaceId);

    return {
      isOverallAdmin: companyMember?.role === "admin",
      adminWorkspaceIds: adminWorkspaceIds,
      userId: user._id
    };
  },
});

export const create = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const companyMember = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_and_user", (q) => q.eq("companyId", args.companyId).eq("userId", user._id))
      .unique();

    if (companyMember?.role !== "admin") {
      throw new Error("Only Company Admins can provision new environments.");
    }

    const n = args.name.toLowerCase();
    let emoji = "📂"; // Default

    // INTELLIGENT EMOJI MAPPING
    const map = [
      { keys: ["tech", "dev", "code", "stack", "engineer", "infra", "sys", "compute"], icon: "💻" },
      { keys: ["market", "growth", "seo", "ad", "brand", "content", "social"], icon: "📈" },
      { keys: ["sales", "rev", "money", "finance", "bill", "account", "tax"], icon: "💰" },
      { keys: ["design", "art", "ui", "ux", "creative", "studio"], icon: "🎨" },
      { keys: ["legal", "law", "policy", "compliance", "audit"], icon: "⚖️" },
      { keys: ["hr", "human", "people", "recruit", "talent", "culture"], icon: "👥" },
      { keys: ["ops", "operation", "logist", "supply", "admin"], icon: "⚙️" },
      { keys: ["support", "help", "customer", "service", "care"], icon: "🎧" },
      { keys: ["product", "roadmap", "feature", "spec"], icon: "🚀" },
      { keys: ["data", "analytic", "science", "bi", "insight"], icon: "📊" },
      { keys: ["exec", "ceo", "board", "strategy"], icon: "👔" },
      { keys: ["qa", "test", "quality"], icon: "🧪" },
      { keys: ["security", "sec", "cyber", "guard"], icon: "🛡️" },
    ];

    for (const entry of map) {
      if (entry.keys.some(k => n.includes(k))) {
        emoji = entry.icon;
        break;
      }
    }

    const workspaceId = await ctx.db.insert("workspaces", {
      companyId: args.companyId,
      name: args.name,
      emoji: emoji,
      workspaceHeadId: user._id,
      isDefault: false,
    });

    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId: user._id,
      role: "admin",
    });

    return workspaceId;
  },
});

export const addMember = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", args.userId))
      .unique();

    if (existing) throw new Error("User is already a member of this workspace.");

    await ctx.db.insert("workspaceMembers", {
      workspaceId: args.workspaceId,
      userId: args.userId,
      role: args.role,
    });
  },
});

export const updateRole = mutation({
  args: {
    memberId: v.id("workspaceMembers"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memberId, { role: args.role });
  },
});

export const updateDesignation = mutation({
  args: {
    memberId: v.id("workspaceMembers"),
    designation: v.string(),
  },
  handler: async (ctx, args) => {
     await ctx.db.patch(args.memberId, { designation: args.designation });
  },
});

export const removeMember = mutation({
  args: { memberId: v.id("workspaceMembers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.memberId);
  },
});