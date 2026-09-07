import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const user = v.union(v.literal("cutie"), v.literal("tough_honey"));
const mediaType = v.union(v.literal("image"), v.literal("video"));

export default defineSchema({
  messages: defineTable({
    sender: user,
    content: v.optional(v.string()),
    media_url: v.optional(v.string()),
    media_type: v.optional(mediaType),
    created_at: v.number(),
  }).index("by_created_at", ["created_at"]),

  bonusPoints: defineTable({
    giver: user,
    receiver: user,
    points: v.number(),
    reason: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_receiver", ["receiver"])
    .index("by_created_at", ["created_at"]),

  memories: defineTable({
    creator: user,
    title: v.string(),
    description: v.optional(v.string()),
    memory_date: v.string(),
    media_url: v.optional(v.string()),
    media_type: v.optional(mediaType),
    created_at: v.number(),
  }).index("by_memory_date", ["memory_date"]),
});