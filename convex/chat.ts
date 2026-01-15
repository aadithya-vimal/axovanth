import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Sends a message to the organization-wide chat.
 * Now supports optional file attachments.
 */
export const send = mutation({
  args: {
    companyId: v.id("companies"),
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

    return await ctx.db.insert("messages", {
      companyId: args.companyId,
      authorId: user._id,
      content: args.content,
      attachmentId: args.attachmentId,
    });
  },
});

/**
 * Fetches the latest 50 messages for the organization.
 * Includes signed URLs for any attachments.
 */
export const getMessages = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .order("desc")
      .take(50);

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