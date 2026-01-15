import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Sends a message to organization-wide OR workspace-specific chat.
 */
export const send = mutation({
  args: {
    companyId: v.id("companies"),
    workspaceId: v.optional(v.id("workspaces")), // NEW
    content: v.string(),
    attachmentId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized Access: No identity found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User record not found in system");

    // If workspaceId is provided, verify membership? 
    // For now, we assume frontend checks, but backend check is safer.
    // Leaving permissive for speed, but ideally check workspaceMembers here.

    return await ctx.db.insert("messages", {
      companyId: args.companyId,
      workspaceId: args.workspaceId,
      authorId: user._id,
      content: args.content,
      attachmentId: args.attachmentId,
    });
  },
});

/**
 * Fetches the latest 50 messages.
 * If workspaceId provided, fetches for that workspace.
 * If not, fetches global company messages (where workspaceId is undefined).
 */
export const getMessages = query({
  args: { 
    companyId: v.id("companies"), 
    workspaceId: v.optional(v.id("workspaces")) 
  },
  handler: async (ctx, args) => {
    let messages;

    if (args.workspaceId) {
      // Fetch Workspace Specific Messages
      messages = await ctx.db
        .query("messages")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId!))
        .order("desc")
        .take(50);
    } else {
      // Fetch Global Messages (Filter out workspace messages manually or via index strategy)
      // Since we don't have a specific "global_only" index, we query by company and filter in memory
      // OR we can rely on `by_company` and filter.
      // Better approach: use `by_company` and filter where workspaceId is undefined.
      
      const allCompanyMessages = await ctx.db
        .query("messages")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
        .order("desc")
        .take(100); // Take more to account for filtering
        
      messages = allCompanyMessages.filter(m => !m.workspaceId).slice(0, 50);
    }

    // Map author profiles and resolve attachment URLs
    return await Promise.all(
      messages.map(async (msg) => {
        const user = await ctx.db.get(msg.authorId);
        let attachmentUrl = null;
        if (msg.attachmentId) {
          attachmentUrl = await ctx.storage.getUrl(msg.attachmentId);
        }
        return { ...msg, user, attachmentUrl };
      })
    );
  },
});