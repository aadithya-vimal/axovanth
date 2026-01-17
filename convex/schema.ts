import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    clerkId: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  companies: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    adminId: v.id("users"),
    logoUrl: v.optional(v.string()),
    domain: v.optional(v.string()),
  }),

  roles: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    color: v.string(), 
    description: v.optional(v.string()),
  }).index("by_company", ["companyId"]),

  companyMembers: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("employee")), 
    roleId: v.optional(v.id("roles")), 
    designation: v.optional(v.string()), 
    status: v.union(v.literal("active"), v.literal("pending")),
  })
  .index("by_company_and_user", ["companyId", "userId"])
  .index("by_user", ["userId"]),

  roleRequests: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"),
    roleId: v.id("roles"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  }).index("by_company", ["companyId"]),

  workspaces: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    emoji: v.string(),
    workspaceHeadId: v.id("users"),
    isDefault: v.boolean(),
  }).index("by_company", ["companyId"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
    designation: v.optional(v.string()),
  })
  .index("by_workspace_and_user", ["workspaceId", "userId"])
  .index("by_user", ["userId"])
  .index("by_workspace", ["workspaceId"]),

  workspaceRequests: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  }).index("by_workspace", ["workspaceId"]),

  tickets: defineTable({
    companyId: v.id("companies"),
    workspaceId: v.id("workspaces"),
    creatorId: v.id("users"),
    assigneeId: v.optional(v.id("users")),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("transferred")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    type: v.optional(v.union(v.literal("bug"), v.literal("feature"), v.literal("task"))),
    dueDate: v.optional(v.number()),
  }).index("by_company", ["companyId"]).index("by_workspace", ["workspaceId"]),

  ticketEvents: defineTable({
    ticketId: v.id("tickets"),
    actorId: v.id("users"),
    type: v.string(),
    metadata: v.optional(v.string()),
  }).index("by_ticket", ["ticketId"]),

  ticketComments: defineTable({
    ticketId: v.id("tickets"),
    authorId: v.id("users"),
    content: v.string(),
  }).index("by_ticket", ["ticketId"]),

  kanbanTasks: defineTable({
    companyId: v.id("companies"),
    workspaceId: v.id("workspaces"),
    creatorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()), 
    status: v.union(v.literal("backlog"), v.literal("todo"), v.literal("in_progress"), v.literal("done")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()), 
  })
  .index("by_company", ["companyId"])
  .index("by_workspace", ["workspaceId"]),

  kanbanEvents: defineTable({
    taskId: v.id("kanbanTasks"),
    actorId: v.id("users"),
    type: v.string(), 
    metadata: v.optional(v.string()), 
  }).index("by_task", ["taskId"]),

  kanbanComments: defineTable({
    taskId: v.id("kanbanTasks"),
    authorId: v.id("users"),
    content: v.string(),
  }).index("by_task", ["taskId"]),

  assets: defineTable({
    companyId: v.id("companies"), 
    workspaceId: v.optional(v.id("workspaces")), 
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    uploaderId: v.id("users"),
  })
  .index("by_workspace", ["workspaceId"])
  .index("by_company", ["companyId"]),

  // NEW: Audit Log for Assets (Tracks Uploads & Deletions)
  assetEvents: defineTable({
    companyId: v.id("companies"),
    actorId: v.id("users"),
    type: v.union(v.literal("upload"), v.literal("delete")),
    description: v.string(), // e.g. "Uploaded contract.pdf", "Deleted image.png"
    metadata: v.optional(v.string()),
  }).index("by_company", ["companyId"]),

  messages: defineTable({
    companyId: v.id("companies"),
    workspaceId: v.optional(v.id("workspaces")), 
    authorId: v.id("users"),
    content: v.string(),
    attachmentId: v.optional(v.id("_storage")),
  })
  .index("by_company", ["companyId"])
  .index("by_workspace", ["workspaceId"]), 
});