import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const user = v.union(v.literal("cutie"), v.literal("tough_honey"));
const mediaType = v.union(v.literal("image"), v.literal("video"));

export const list = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_created_at")
      .order("asc")
      .collect();

    return messages.map((message) => ({
      ...message,
      id: message._id.toString(),
      content: message.content ?? null,
      media_url: message.media_url ?? null,
      media_type: message.media_type ?? null,
      created_at: new Date(message.created_at).toISOString(),
    }));
  },
});

export const send = mutation({
  args: {
    sender: user,
    content: v.optional(v.string()),
    media_url: v.optional(v.string()),
    media_type: v.optional(mediaType),
  },
  handler: async (ctx, args) => {
    if (!args.content?.trim() && !args.media_url) {
      throw new Error("A message must contain text or media");
    }

    return ctx.db.insert("messages", {
      ...args,
      content: args.content?.trim() || undefined,
      created_at: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});