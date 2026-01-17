import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to log events
async function logEvent(ctx: any, taskId: any, type: string, metadata: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return;
  const user = await ctx.db.query("users").withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject)).unique();
  if (!user) return;

  await ctx.db.insert("kanbanEvents", {
    taskId,
    actorId: user._id,
    type,
    metadata
  });
}

export const create = mutation({
  args: {
    companyId: v.id("companies"),
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(v.literal("backlog"), v.literal("todo"), v.literal("in_progress"), v.literal("done")),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const taskId = await ctx.db.insert("kanbanTasks", {
      companyId: args.companyId,
      workspaceId: args.workspaceId,
      creatorId: user._id,
      title: args.title,
      description: args.description,
      priority: args.priority,
      status: args.status,
      assigneeId: args.assigneeId,
      dueDate: args.dueDate,
    });

    await logEvent(ctx, taskId, "created", `Task created in ${args.status}`);
    return taskId;
  },
});

export const updateStatus = mutation({
  args: {
    taskId: v.id("kanbanTasks"),
    status: v.union(v.literal("backlog"), v.literal("todo"), v.literal("in_progress"), v.literal("done")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found"); // TS Fix

    if(task.status !== args.status) {
        await ctx.db.patch(args.taskId, { status: args.status });
        await logEvent(ctx, args.taskId, "status_change", `Moved from ${task.status} to ${args.status}`);
    }
  },
});

export const updateDetails = mutation({
  args: {
    taskId: v.id("kanbanTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found"); // TS Fix

    await ctx.db.patch(taskId, updates);

    // Smart Logging
    if (updates.priority && task.priority !== updates.priority) 
        await logEvent(ctx, taskId, "update", `Priority changed to ${updates.priority}`);
    if (updates.assigneeId && task.assigneeId !== updates.assigneeId) {
        const user = await ctx.db.get(updates.assigneeId);
        await logEvent(ctx, taskId, "update", `Assigned to ${user?.name || "Unknown"}`);
    }
    if (updates.title && task.title !== updates.title) 
        await logEvent(ctx, taskId, "update", "Title updated");
  },
});

export const addComment = mutation({
  args: { taskId: v.id("kanbanTasks"), content: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", identity.subject)).unique();
    if (!user) throw new Error("User not found");

    await ctx.db.insert("kanbanComments", {
      taskId: args.taskId,
      authorId: user._id,
      content: args.content,
    });
  }
});

export const deleteTask = mutation({
  args: { taskId: v.id("kanbanTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});

export const getAll = query({
  args: { 
    companyId: v.id("companies"),
    workspaceId: v.optional(v.id("workspaces")) 
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("kanbanTasks").withIndex("by_company", (q) => q.eq("companyId", args.companyId));
    
    // Filter by Workspace (Department) if provided
    let tasks = await q.collect();

    if (args.workspaceId) {
       tasks = tasks.filter(t => t.workspaceId === args.workspaceId);
    }

    return await Promise.all(
      tasks.map(async (t) => {
        const assignee = t.assigneeId ? await ctx.db.get(t.assigneeId) : null;
        return { ...t, assignee };
      })
    );
  },
});

export const getEvents = query({
  args: { taskId: v.id("kanbanTasks") },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("kanbanEvents").withIndex("by_task", q => q.eq("taskId", args.taskId)).order("desc").collect();
    return await Promise.all(events.map(async (e) => {
      const actor = await ctx.db.get(e.actorId);
      return { ...e, actor };
    }));
  }
});

export const getComments = query({
  args: { taskId: v.id("kanbanTasks") },
  handler: async (ctx, args) => {
    const comments = await ctx.db.query("kanbanComments").withIndex("by_task", q => q.eq("taskId", args.taskId)).collect();
    return await Promise.all(comments.map(async (c) => {
      const author = await ctx.db.get(c.authorId);
      return { ...c, author };
    }));
  }
});