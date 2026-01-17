import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized access");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      adminId: user._id,
      logoUrl: args.logoUrl,
      description: "A revolutionary workspace."
    });

    await ctx.db.insert("companyMembers", {
      companyId,
      userId: user._id,
      role: "admin",
      status: "active",
    });

    const workspaceId = await ctx.db.insert("workspaces", {
      companyId,
      name: "General",
      emoji: "🏢",
      workspaceHeadId: user._id,
      isDefault: true,
    });
    
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId: user._id,
      role: "admin",
    });

    return { companyId, workspaceId };
  },
});

export const updateDetails = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found");

    // Check for Admin Role
    const member = await ctx.db.query("companyMembers")
      .withIndex("by_company_and_user", q => q.eq("companyId", args.companyId).eq("userId", user._id))
      .unique();

    if (member?.role !== "admin") throw new Error("Insufficient privileges: Only admins can edit company details");

    await ctx.db.patch(args.companyId, {
      name: args.name,
      description: args.description,
      logoUrl: args.logoUrl
    });
  }
});

export const transferOwnership = mutation({
  args: {
    companyId: v.id("companies"),
    newOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found");

    // Allow any Admin to transfer ownership
    const member = await ctx.db.query("companyMembers")
      .withIndex("by_company_and_user", q => q.eq("companyId", args.companyId).eq("userId", user._id))
      .unique();

    if (member?.role !== "admin") throw new Error("Insufficient privileges: Only admins can transfer ownership");

    await ctx.db.patch(args.companyId, { adminId: args.newOwnerId });
    
    // Ensure new owner is an admin
    const targetMember = await ctx.db.query("companyMembers").withIndex("by_company_and_user", q => q.eq("companyId", args.companyId).eq("userId", args.newOwnerId)).unique();
    if (targetMember) await ctx.db.patch(targetMember._id, { role: "admin" });
  }
});

export const deleteCompany = mutation({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found");

    // Check for Admin Role
    const member = await ctx.db.query("companyMembers")
      .withIndex("by_company_and_user", q => q.eq("companyId", args.companyId).eq("userId", user._id))
      .unique();

    if (member?.role !== "admin") throw new Error("Insufficient privileges: Only admins can delete the company");

    await ctx.db.delete(args.companyId);
  }
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("companies").collect();
  },
});

export const getMyMemberships = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) return [];
    return await ctx.db.query("companyMembers").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const getById = query({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getMemberRecord = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) return null;
    return await ctx.db.query("companyMembers").withIndex("by_company_and_user", (q) => q.eq("companyId", args.companyId).eq("userId", user._id)).unique();
  },
});

export const getMembers = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const members = await ctx.db.query("companyMembers").withIndex("by_company_and_user", (q) => q.eq("companyId", args.companyId)).collect();
    return await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        let roleName = member.designation;
        let customRole = null;
        if (member.roleId) {
          customRole = await ctx.db.get(member.roleId);
          if (customRole) roleName = customRole.name;
        }
        return { ...member, user, roleName, customRole };
      })
    );
  },
});

export const updateMemberProfile = mutation({
  args: {
    memberId: v.id("companyMembers"),
    role: v.union(v.literal("admin"), v.literal("employee")),
    roleId: v.optional(v.id("roles")),
    designation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const requesterUser = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    const memberToUpdate = await ctx.db.get(args.memberId);
    if (!memberToUpdate || !requesterUser) throw new Error("Record not found");
    
    // Check permissions
    const isSelf = memberToUpdate.userId === requesterUser._id;
    const requesterMember = await ctx.db.query("companyMembers").withIndex("by_company_and_user", (q) => q.eq("companyId", memberToUpdate.companyId).eq("userId", requesterUser._id)).unique();
    const isAdmin = requesterMember?.role === "admin";

    if (!isAdmin && !isSelf) throw new Error("Security Violation: Insufficient privileges.");
    
    if (args.role !== memberToUpdate.role) {
        if (!isAdmin) throw new Error("Security Violation: Only admins can change system roles.");
        
        const company = await ctx.db.get(memberToUpdate.companyId);
        if (company?.adminId === memberToUpdate.userId && args.role !== "admin") {
             throw new Error("Security Violation: Cannot demote the Organization Owner.");
        }
        if (memberToUpdate.userId === requesterUser._id && args.role !== "admin") {
             throw new Error("Safety Lock: You cannot demote yourself. Ask another admin to do this.");
        }
    }

    await ctx.db.patch(args.memberId, { 
      role: args.role,
      roleId: args.roleId,
      designation: args.designation 
    });
  },
});

export const updateMemberRole = mutation({
  args: {
    memberId: v.id("companyMembers"),
    role: v.union(v.literal("admin"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const requesterUser = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    const memberToUpdate = await ctx.db.get(args.memberId);
    if (!memberToUpdate || !requesterUser) throw new Error("Record not found");
    
    const requesterMember = await ctx.db.query("companyMembers").withIndex("by_company_and_user", (q) => q.eq("companyId", memberToUpdate.companyId).eq("userId", requesterUser._id)).unique();
    const company = await ctx.db.get(memberToUpdate.companyId);

    if (requesterMember?.role !== "admin") throw new Error("Security Violation: Insufficient privileges.");
    if (company?.adminId === memberToUpdate.userId && args.role !== "admin") throw new Error("Security Violation: Cannot demote the Organization Owner.");
    if (memberToUpdate.userId === requesterUser._id && args.role !== "admin") throw new Error("Safety Lock: You cannot demote yourself.");

    await ctx.db.patch(args.memberId, { role: args.role });
  },
});

export const updateMemberStatus = mutation({
  args: {
    memberId: v.id("companyMembers"),
    status: v.union(v.literal("active"), v.literal("pending")),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");
    await ctx.db.patch(args.memberId, { status: args.status });
    if (args.status === "active") {
      const generalWs = await ctx.db.query("workspaces")
        .withIndex("by_company", q => q.eq("companyId", member.companyId))
        .filter(q => q.eq(q.field("isDefault"), true))
        .unique();
      if (generalWs) {
        const existing = await ctx.db.query("workspaceMembers").withIndex("by_workspace_and_user", q => q.eq("workspaceId", generalWs._id).eq("userId", member.userId)).unique();
        if (!existing) {
          await ctx.db.insert("workspaceMembers", { workspaceId: generalWs._id, userId: member.userId, role: "member" });
        }
      }
    }
  },
});

export const updateMemberDesignation = mutation({
  args: {
    memberId: v.id("companyMembers"),
    designation: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memberId, { designation: args.designation });
  },
});

// BUG FIX: Removing a member now removes them from all workspaces in that company
export const removeMember = mutation({
  args: { memberId: v.id("companyMembers") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) return;

    // 1. Delete from Company
    await ctx.db.delete(args.memberId);

    // 2. Cascade Delete from Workspaces belonging to this company
    const wsMemberships = await ctx.db.query("workspaceMembers")
      .withIndex("by_user", q => q.eq("userId", member.userId))
      .collect();

    for (const wsMem of wsMemberships) {
      const workspace = await ctx.db.get(wsMem.workspaceId);
      if (workspace && workspace.companyId === member.companyId) {
        await ctx.db.delete(wsMem._id);
      }
    }
  },
});

export const requestAccess = mutation({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User record not found");
    const existingMembership = await ctx.db.query("companyMembers").withIndex("by_company_and_user", (q) => q.eq("companyId", args.companyId).eq("userId", user._id)).unique();
    if (existingMembership) throw new Error("Membership already exists or is pending.");
    await ctx.db.insert("companyMembers", {
      companyId: args.companyId,
      userId: user._id,
      role: "employee",
      status: "pending",
    });
    return "requested";
  },
});