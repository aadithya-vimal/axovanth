import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const sendFile = mutation({
  args: {
    storageId: v.id("_storage"),
    workspaceId: v.id("workspaces"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    await ctx.db.insert("assets", {
      workspaceId: args.workspaceId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      uploaderId: user!._id,
    });
  },
});

export const getByWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    return Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        url: await ctx.storage.getUrl(asset.storageId),
      }))
    );
  },
});