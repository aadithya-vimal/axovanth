import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getRoles = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db.query("roles").withIndex("by_company", q => q.eq("companyId", args.companyId)).collect();
  }
});

export const createRole = mutation({
  args: { companyId: v.id("companies"), name: v.string(), color: v.string(), description: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found"); 

    const member = await ctx.db.query("companyMembers").withIndex("by_company_and_user", q => q.eq("companyId", args.companyId).eq("userId", user._id)).unique();
    if (member?.role !== "admin") throw new Error("Only admins can create roles");

    await ctx.db.insert("roles", {
      companyId: args.companyId,
      name: args.name,
      color: args.color,
      description: args.description
    });
  }
});

// NEW: Update Role details
export const updateRole = mutation({
  args: { 
    roleId: v.id("roles"), 
    name: v.string(), 
    color: v.string(), 
    description: v.string() 
  },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");
    
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found");

    const member = await ctx.db.query("companyMembers").withIndex("by_company_and_user", q => q.eq("companyId", role.companyId).eq("userId", user._id)).unique();
    if (member?.role !== "admin") throw new Error("Only admins can edit roles");

    await ctx.db.patch(args.roleId, {
      name: args.name,
      color: args.color,
      description: args.description
    });
  }
});

export const deleteRole = mutation({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.roleId);
  }
});

export const requestRole = mutation({
  args: { companyId: v.id("companies"), roleId: v.id("roles") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found"); 

    const existing = await ctx.db.query("roleRequests").withIndex("by_company", q => q.eq("companyId", args.companyId))
      .filter(q => q.eq(q.field("userId"), user._id))
      .filter(q => q.eq(q.field("status"), "pending"))
      .first();
    
    if (existing) throw new Error("You already have a pending request.");

    await ctx.db.insert("roleRequests", {
      companyId: args.companyId,
      userId: user._id,
      roleId: args.roleId,
      status: "pending"
    });
  }
});

export const getRequests = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const reqs = await ctx.db.query("roleRequests").withIndex("by_company", q => q.eq("companyId", args.companyId)).collect();
    const pending = reqs.filter(r => r.status === "pending");
    
    return await Promise.all(pending.map(async (r) => {
      const user = await ctx.db.get(r.userId);
      const role = await ctx.db.get(r.roleId);
      return { ...r, user, role };
    }));
  }
});

export const resolveRequest = mutation({
  args: { requestId: v.id("roleRequests"), approved: v.boolean() },
  handler: async (ctx, args) => {
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Request not found");
    
    await ctx.db.patch(args.requestId, { status: args.approved ? "approved" : "rejected" });

    if (args.approved) {
      const member = await ctx.db.query("companyMembers").withIndex("by_company_and_user", q => q.eq("companyId", req.companyId).eq("userId", req.userId)).unique();
      if (member) {
        await ctx.db.patch(member._id, { roleId: req.roleId });
      }
    }
  }
});