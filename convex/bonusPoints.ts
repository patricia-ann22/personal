import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const user = v.union(v.literal("cutie"), v.literal("tough_honey"));

const serializeEntry = (entry: {
  _id: string;
  giver: "cutie" | "tough_honey";
  receiver: "cutie" | "tough_honey";
  points: number;
  reason?: string;
  created_at: number;
}) => ({
  ...entry,
  id: entry._id.toString(),
  reason: entry.reason ?? null,
  created_at: new Date(entry.created_at).toISOString(),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("bonusPoints")
      .withIndex("by_created_at")
      .order("asc")
      .collect();

    return entries.map(serializeEntry);
  },
});

export const forPair = query({
  args: {
    currentUser: user,
    otherUser: user,
  },
  handler: async (ctx, { currentUser, otherUser }) => {
    if (currentUser === otherUser) {
      throw new Error("Bonus history requires two different users");
    }

    const entries = await ctx.db
      .query("bonusPoints")
      .withIndex("by_created_at")
      .order("asc")
      .collect();

    const pairEntries = entries.filter(
      (entry) =>
        (entry.giver === currentUser && entry.receiver === otherUser) ||
        (entry.giver === otherUser && entry.receiver === currentUser),
    );

    return {
      entries: pairEntries.slice(-20).map(serializeEntry),
      receivedTotal: pairEntries
        .filter((entry) => entry.receiver === currentUser)
        .reduce((total, entry) => total + entry.points, 0),
      awardedTotal: pairEntries
        .filter((entry) => entry.giver === currentUser)
        .reduce((total, entry) => total + entry.points, 0),
    };
  },
});

export const add = mutation({
  args: {
    giver: user,
    receiver: user,
    points: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.giver === args.receiver) {
      throw new Error("A user cannot award points to themselves");
    }
    if (!Number.isInteger(args.points) || args.points === 0 || Math.abs(args.points) > 50) {
      throw new Error("Points must be a non-zero integer between -50 and 50");
    }

    return ctx.db.insert("bonusPoints", {
      ...args,
      reason: args.reason?.trim() || undefined,
      created_at: Date.now(),
    });
  },
});