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

    const companyMember = await ctx.db.query("companyMembers")
      .withIndex("by_company_and_user", q => q.eq("companyId", args.companyId).eq("userId", user._id))
      .unique();

    if (companyMember?.role === "admin") {
      const allWorkspaces = await ctx.db.query("workspaces")
        .withIndex("by_company", q => q.eq("companyId", args.companyId))
        .collect();
      return allWorkspaces.map(ws => ws._id);
    }

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

    const ws = await ctx.db.get(args.workspaceId);
    if (ws) {
        const companyMember = await ctx.db.query("companyMembers")
            .withIndex("by_company_and_user", q => q.eq("companyId", ws.companyId).eq("userId", user._id))
            .unique();
        if (companyMember?.role === "admin") throw new Error("Admins already have access.");
    }

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
    let emoji = "Box"; 

    const map = [
      { keys: ["tech", "dev", "code", "stack", "engineer", "sys", "compute"], icon: "Terminal" },
      { keys: ["market", "growth", "seo", "ad", "brand", "content", "social"], icon: "TrendingUp" },
      { keys: ["sales", "rev", "money", "finance", "bill", "account", "tax"], icon: "BadgeDollarSign" },
      { keys: ["design", "art", "ui", "ux", "creative", "studio"], icon: "Palette" },
      { keys: ["legal", "law", "policy", "compliance", "audit"], icon: "Scale" },
      { keys: ["hr", "human", "people", "recruit", "talent", "culture"], icon: "Users" },
      { keys: ["ops", "operation", "logist", "supply", "admin"], icon: "Settings2" },
      { keys: ["support", "help", "customer", "service", "care"], icon: "LifeBuoy" },
      { keys: ["product", "roadmap", "feature", "spec"], icon: "Rocket" },
      { keys: ["data", "analytic", "science", "bi", "insight"], icon: "Database" },
      { keys: ["exec", "ceo", "board", "strategy"], icon: "Briefcase" },
      { keys: ["qa", "test", "quality", "bug"], icon: "Bug" },
      { keys: ["security", "sec", "cyber", "guard"], icon: "ShieldCheck" },
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

// NEW: Rename Workspace
export const updateName = mutation({
  args: { workspaceId: v.id("workspaces"), name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found");

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const companyMember = await ctx.db.query("companyMembers")
      .withIndex("by_company_and_user", q => q.eq("companyId", workspace.companyId).eq("userId", user._id))
      .unique();

    if (companyMember?.role !== "admin") throw new Error("Only Organization Admins can rename Workspaces.");

    await ctx.db.patch(args.workspaceId, { name: args.name });
  },
});

export const updateHead = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found");

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const companyMember = await ctx.db.query("companyMembers")
      .withIndex("by_company_and_user", q => q.eq("companyId", workspace.companyId).eq("userId", user._id))
      .unique();

    if (companyMember?.role !== "admin") throw new Error("Only Organization Admins can reassign Workspace Heads.");

    const targetMember = await ctx.db.query("workspaceMembers")
      .withIndex("by_workspace_and_user", q => q.eq("workspaceId", args.workspaceId).eq("userId", args.userId))
      .unique();

    if (!targetMember) {
        await ctx.db.insert("workspaceMembers", {
            workspaceId: args.workspaceId,
            userId: args.userId,
            role: "admin"
        });
    } else if (targetMember.role !== "admin") {
        await ctx.db.patch(targetMember._id, { role: "admin" });
    }

    await ctx.db.patch(args.workspaceId, { workspaceHeadId: args.userId });
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

export const deleteWorkspace = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const companyMember = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_and_user", (q) => q.eq("companyId", workspace.companyId).eq("userId", user._id))
      .unique();

    if (companyMember?.role !== "admin") {
      throw new Error("Insufficient privileges to delete environment.");
    }

    await ctx.db.delete(args.workspaceId);
    
    const members = await ctx.db.query("workspaceMembers").withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId)).collect();
    for (const m of members) await ctx.db.delete(m._id);

    const requests = await ctx.db.query("workspaceRequests").withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId)).collect();
    for (const r of requests) await ctx.db.delete(r._id);

    const tickets = await ctx.db.query("tickets").withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId)).collect();
    for (const t of tickets) await ctx.db.delete(t._id);

    const messages = await ctx.db.query("messages").withIndex("by_workspace", q => q.eq("workspaceId", args.workspaceId)).collect();
    for (const m of messages) await ctx.db.delete(m._id);
  }
});