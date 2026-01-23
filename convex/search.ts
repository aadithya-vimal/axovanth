import { v } from "convex/values";
import { query } from "./_generated/server";

export const searchGlobal = query({
  args: { 
    companyId: v.id("companies"),
    query: v.string() 
  },
  handler: async (ctx, args) => {
    if (!args.query) return [];

    const ticketResults = await ctx.db
      .query("tickets")
      .withSearchIndex("search_title", (q) => 
        q.search("title", args.query).eq("companyId", args.companyId)
      )
      .take(5);

    const assetResults = await ctx.db
      .query("assets")
      .withSearchIndex("search_fileName", (q) => 
        q.search("fileName", args.query).eq("companyId", args.companyId)
      )
      .take(5);

    const workspaceResults = await ctx.db
      .query("workspaces")
      .withSearchIndex("search_name", (q) => 
        q.search("name", args.query).eq("companyId", args.companyId)
      )
      .take(3);

    return [
      ...ticketResults.map(t => ({ type: "Ticket", id: t._id, title: t.title, sub: t.status, link: `/dashboard/${args.companyId}/ws/${t.workspaceId}?ticket=${t._id}` })),
      ...assetResults.map(a => ({ type: "Asset", id: a._id, title: a.fileName, sub: a.fileType, link: `/dashboard/${args.companyId}/ws/${a.workspaceId}?tab=assets` })),
      ...workspaceResults.map(w => ({ type: "Workspace", id: w._id, title: w.name, sub: "Environment", link: `/dashboard/${args.companyId}/ws/${w._id}` }))
    ];
  },
});