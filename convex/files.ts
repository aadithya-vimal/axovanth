import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Helper to log asset events
async function logAssetEvent(ctx: any, companyId: any, type: "upload" | "delete" | "update", description: string) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const user = await ctx.db.query("users").withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject)).unique();
    if (!user) return;
  
    await ctx.db.insert("assetEvents", {
      companyId,
      actorId: user._id,
      type,
      description
    });
}

export const sendFile = mutation({
  args: {
    storageId: v.id("_storage"),
    companyId: v.id("companies"), 
    workspaceId: v.optional(v.id("workspaces")),
    fileName: v.string(),
    fileType: v.string(),
    isRestricted: v.optional(v.boolean()), 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.insert("assets", {
      companyId: args.companyId,
      workspaceId: args.workspaceId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      uploaderId: user._id,
      isRestricted: args.isRestricted || false, 
    });

    // LOG UPLOAD
    await logAssetEvent(ctx, args.companyId, "upload", `Uploaded ${args.fileName}`);
  },
});

export const deleteFile = mutation({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    // SECURITY CHECK: Verify if the user is an Admin of the company owning the asset
    const member = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_and_user", (q) => q.eq("companyId", asset.companyId).eq("userId", user._id))
      .unique();

    if (member?.role !== "admin") {
      throw new Error("Security Violation: Only Administrators can modify the Asset Vault.");
    }
    
    await ctx.db.delete(args.assetId);

    // LOG DELETION
    await logAssetEvent(ctx, asset.companyId, "delete", `Deleted ${asset.fileName}`);
  }
});

export const toggleAssetVisibility = mutation({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    // Security: Check if user is Company Admin OR Workspace Head of that asset
    const companyMember = await ctx.db
      .query("companyMembers")
      .withIndex("by_company_and_user", q => q.eq("companyId", asset.companyId).eq("userId", user._id))
      .unique();

    let hasRights = companyMember?.role === "admin";

    if (!hasRights && asset.workspaceId) {
      const workspace = await ctx.db.get(asset.workspaceId);
      if (workspace && workspace.workspaceHeadId === user._id) {
        hasRights = true;
      }
    }

    if (!hasRights) throw new Error("Insufficient privileges to change asset visibility.");

    const newState = !asset.isRestricted;
    await ctx.db.patch(args.assetId, { 
      isRestricted: newState 
    });

    await logAssetEvent(
        ctx, 
        asset.companyId, 
        "update", 
        `Changed visibility of ${asset.fileName} to ${newState ? "Department Only" : "Shared"}`
    );
  }
});


// Global Company Asset Fetcher - FILTERED
export const getByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    // Filter out Restricted (Department Only) assets from the global view
    const visibleAssets = assets.filter(a => !a.isRestricted);

    return Promise.all(
      visibleAssets.map(async (asset) => {
        const uploader = await ctx.db.get(asset.uploaderId);
        return {
          ...asset,
          url: await ctx.storage.getUrl(asset.storageId),
          uploaderName: uploader?.name,
          uploadedAt: asset._creationTime
        };
      })
    );
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

// Fetch Asset History
export const getAssetEvents = query({
    args: { companyId: v.id("companies") },
    handler: async (ctx, args) => {
        const events = await ctx.db.query("assetEvents").withIndex("by_company", q => q.eq("companyId", args.companyId)).order("desc").collect();
        return Promise.all(
            events.map(async (e) => {
                const actor = await ctx.db.get(e.actorId);
                return { ...e, actorName: actor?.name, actorRole: "Admin" }; 
            })
        );
    }
});