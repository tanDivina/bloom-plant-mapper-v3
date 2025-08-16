import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.optional(v.string()), // For demo purposes, in production hash this
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user with default free plan
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      passwordHash: args.password, // In production, hash the password
      subscriptionPlan: "free",
      subscriptionStatus: "active",
      lastActiveDate: Date.now(),
    });

    return userId;
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    profileImage: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      return;
    }

    await ctx.db.patch(userId, cleanUpdates);
  },
});

export const getOrCreateDemoUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if demo user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@plantmapper.com"))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Create demo user
    const userId = await ctx.db.insert("users", {
      email: "demo@plantmapper.com",
      name: "Plant Explorer",
    });

    return userId;
  },
});