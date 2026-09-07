import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const user = v.union(v.literal("cutie"), v.literal("tough_honey"));
const mediaType = v.union(v.literal("image"), v.literal("video"));

export const list = query({
  args: {},
  handler: async (ctx) => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_memory_date")
      .order("desc")
      .collect();

    return memories.map((memory) => ({
      ...memory,
      id: memory._id.toString(),
      description: memory.description ?? null,
      media_url: memory.media_url ?? null,
      media_type: memory.media_type ?? null,
      created_at: new Date(memory.created_at).toISOString(),
    }));
  },
});

export const add = mutation({
  args: {
    creator: user,
    title: v.string(),
    description: v.optional(v.string()),
    memory_date: v.string(),
    media_url: v.optional(v.string()),
    media_type: v.optional(mediaType),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title) throw new Error("A memory title is required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.memory_date)) {
      throw new Error("Memory date must use YYYY-MM-DD format");
    }

    return ctx.db.insert("memories", {
      ...args,
      title,
      description: args.description?.trim() || undefined,
      created_at: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("memories") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});