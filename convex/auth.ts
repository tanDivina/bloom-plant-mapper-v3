import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple authentication system (in production, use proper auth like Convex Auth)
export const signInUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; userId?: string; error?: string }> => {
    try {
      // Check if user exists
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .unique();

      if (!user) {
        return {
          success: false,
          error: "No account found with this email address.",
        };
      }

      // In production, you would verify the password hash here
      // For demo purposes, we'll accept any password
      if (args.password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters long.",
        };
      }

      return {
        success: true,
        userId: user._id,
      };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        success: false,
        error: "Sign in failed. Please try again.",
      };
    }
  },
});

export const getCurrentUser = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) return null;
    
    return await ctx.db.get(args.userId);
  },
});

export const updateUserSubscription = mutation({
  args: {
    userId: v.id("users"),
    subscriptionPlan: v.union(
      v.literal("free"),
      v.literal("pro"), 
      v.literal("premium")
    ),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    subscriptionEndDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    await ctx.db.patch(userId, {
      subscriptionPlan: updates.subscriptionPlan,
      subscriptionStatus: updates.subscriptionStatus,
      subscriptionEndDate: updates.subscriptionEndDate,
    });
  },
});

export const checkUserLimits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const plan = user.subscriptionPlan || "free";
    
    // Get user's sightings count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todaySightings = await ctx.db
      .query("plantSightings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("_creationTime"), todayTimestamp))
      .collect();

    // Get user's tours count
    const tours = await ctx.db
      .query("tours")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const publicTours = tours.filter(t => t.isPublic);

    // Define limits based on plan
    const limits = {
      free: {
        dailyIdentifications: 5,
        privateTours: 1,
        publicTours: 0,
        advancedFeatures: false,
      },
      pro: {
        dailyIdentifications: -1, // unlimited
        privateTours: -1, // unlimited
        publicTours: 5,
        advancedFeatures: true,
      },
      premium: {
        dailyIdentifications: -1, // unlimited
        privateTours: -1, // unlimited
        publicTours: -1, // unlimited
        advancedFeatures: true,
      },
    };

    const userLimits = limits[plan as keyof typeof limits];

    return {
      plan,
      usage: {
        dailyIdentifications: todaySightings.length,
        privateTours: tours.length - publicTours.length,
        publicTours: publicTours.length,
      },
      limits: userLimits,
      canIdentifyPlant: userLimits.dailyIdentifications === -1 || 
                       todaySightings.length < userLimits.dailyIdentifications,
      canCreatePrivateTour: userLimits.privateTours === -1 || 
                           (tours.length - publicTours.length) < userLimits.privateTours,
      canCreatePublicTour: userLimits.publicTours === -1 || 
                          publicTours.length < userLimits.publicTours,
    };
  },
});