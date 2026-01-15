import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Security Helper
async function validateAccess(ctx: any, companyId: any, workspaceId?: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized Access");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new Error("User Record Corrupted");

  const companyMember = await ctx.db
    .query("companyMembers")
    .withIndex("by_company_and_user", (q: any) => q.eq("companyId", companyId).eq("userId", user._id))
    .unique();

  const isOverallAdmin = companyMember?.role === "admin";
  let isWorkspaceAdmin = false;
  
  if (workspaceId) {
    const wsMember = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_and_user", (q: any) => q.eq("workspaceId", workspaceId).eq("userId", user._id))
      .unique();
    isWorkspaceAdmin = wsMember?.role === "admin";
    const workspace = await ctx.db.get(workspaceId);
    if (workspace?.workspaceHeadId === user._id) isWorkspaceAdmin = true;
  }

  return { user, isOverallAdmin, isWorkspaceAdmin, hasAdminRights: isOverallAdmin || isWorkspaceAdmin };
}

export const create = mutation({
  args: {
    companyId: v.id("companies"),
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    type: v.optional(v.union(v.literal("bug"), v.literal("feature"), v.literal("task"))),
  },
  handler: async (ctx, args) => {
    const { user } = await validateAccess(ctx, args.companyId);
    const ticketId = await ctx.db.insert("tickets", {
      ...args,
      creatorId: user._id,
      status: "open",
      type: args.type || "task",
    });

    await ctx.db.insert("ticketEvents", {
      ticketId,
      actorId: user._id,
      type: "created",
      metadata: "Flow initialized",
    });
    return ticketId;
  },
});

export const updatePriority = mutation({
  args: { ticketId: v.id("tickets"), priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")) },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Invalid Ticket");
    const { hasAdminRights, user } = await validateAccess(ctx, ticket.companyId, ticket.workspaceId);
    
    if (!hasAdminRights) throw new Error("Security Violation: Only Admins can modify priority.");
    
    await ctx.db.patch(args.ticketId, { priority: args.priority });

    await ctx.db.insert("ticketEvents", {
      ticketId: args.ticketId,
      actorId: user._id,
      type: "priority_update",
      metadata: `Priority changed to ${args.priority}`,
    });
  },
});

export const assign = mutation({
  args: { ticketId: v.id("tickets"), assigneeId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Invalid Ticket");
    const { hasAdminRights, user } = await validateAccess(ctx, ticket.companyId, ticket.workspaceId);

    if (!hasAdminRights) throw new Error("Security Violation: Only Admins can assign tickets.");
    
    await ctx.db.patch(args.ticketId, { assigneeId: args.assigneeId });

    let meta = "Ticket unassigned";
    if (args.assigneeId) {
      const assignee = await ctx.db.get(args.assigneeId);
      meta = `Assigned to ${assignee?.name}`;
    }

    await ctx.db.insert("ticketEvents", {
      ticketId: args.ticketId,
      actorId: user._id,
      type: "assignment_update",
      metadata: meta,
    });
  },
});

export const setDueDate = mutation({
  args: { ticketId: v.id("tickets"), dueDate: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Invalid Ticket");
    const { hasAdminRights, user } = await validateAccess(ctx, ticket.companyId, ticket.workspaceId);

    if (!hasAdminRights) throw new Error("Security Violation: Only Admins can set deadlines.");
    
    await ctx.db.patch(args.ticketId, { dueDate: args.dueDate });

    const meta = args.dueDate ? `Due date set to ${new Date(args.dueDate).toLocaleDateString()}` : "Due date removed";

    await ctx.db.insert("ticketEvents", {
      ticketId: args.ticketId,
      actorId: user._id,
      type: "schedule_update",
      metadata: meta,
    });
  },
});

export const transfer = mutation({
  args: {
    ticketId: v.id("tickets"),
    targetWorkspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Flow ID Invalid");
    const { hasAdminRights, user } = await validateAccess(ctx, ticket.companyId, ticket.workspaceId);
    
    if (!hasAdminRights) throw new Error("Security Violation: Only Admins can transfer tickets.");

    const oldWs = await ctx.db.get(ticket.workspaceId);
    const newWs = await ctx.db.get(args.targetWorkspaceId);

    await ctx.db.patch(args.ticketId, { 
      workspaceId: args.targetWorkspaceId,
      status: "transferred" 
    });

    await ctx.db.insert("ticketEvents", {
      ticketId: args.ticketId,
      actorId: user._id,
      type: "transferred",
      metadata: `Transferred from ${oldWs?.name} to ${newWs?.name}`,
    });
  },
});

export const resolve = mutation({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Flow ID Invalid");
    const { hasAdminRights, user } = await validateAccess(ctx, ticket.companyId, ticket.workspaceId);
    if (!hasAdminRights) throw new Error("Security Violation");

    await ctx.db.patch(args.ticketId, { status: "resolved" });

    await ctx.db.insert("ticketEvents", {
      ticketId: args.ticketId,
      actorId: user._id,
      type: "status_change",
      metadata: "Flow resolved successfully",
    });
  },
});

export const reopen = mutation({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Flow ID Invalid");
    const { hasAdminRights, user } = await validateAccess(ctx, ticket.companyId, ticket.workspaceId);
    if (!hasAdminRights) throw new Error("Security Violation");

    await ctx.db.patch(args.ticketId, { status: "open" });

    await ctx.db.insert("ticketEvents", {
      ticketId: args.ticketId,
      actorId: user._id,
      type: "status_change",
      metadata: "Flow reopened for further action",
    });
  },
});

export const addComment = mutation({
  args: { ticketId: v.id("tickets"), content: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Flow ID Invalid");
    const { user } = await validateAccess(ctx, ticket.companyId);

    await ctx.db.insert("ticketComments", {
      ticketId: args.ticketId,
      authorId: user._id,
      content: args.content,
    });
  },
});

export const getComments = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return []; 

    const comments = await ctx.db.query("ticketComments").withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId)).collect();
    
    return await Promise.all(comments.map(async (c) => {
      const author = await ctx.db.get(c.authorId);
      const member = await ctx.db.query("companyMembers")
        .withIndex("by_company_and_user", q => q.eq("companyId", ticket.companyId).eq("userId", c.authorId))
        .unique();
        
      return { ...c, author, customRole: member?.designation };
    }));
  },
});

// NEW: Fetches the audit log for a ticket
export const getEvents = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("ticketEvents").withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId)).order("desc").collect();
    
    return await Promise.all(events.map(async (e) => {
      const actor = await ctx.db.get(e.actorId);
      return { ...e, actor };
    }));
  },
});

export const getByWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const tickets = await ctx.db.query("tickets").withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId)).collect();
    return await Promise.all(tickets.map(async (t) => {
      const assignee = t.assigneeId ? await ctx.db.get(t.assigneeId) : null;
      return { ...t, assignee };
    }));
  },
});

// NEW: Fetches ALL tickets for the company (for the global Operational Workflow)
export const getAll = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const tickets = await ctx.db.query("tickets").withIndex("by_company", (q) => q.eq("companyId", args.companyId)).collect();
    return await Promise.all(tickets.map(async (t) => {
      const assignee = t.assigneeId ? await ctx.db.get(t.assigneeId) : null;
      const workspace = await ctx.db.get(t.workspaceId);
      return { ...t, assignee, workspace };
    }));
  },
});