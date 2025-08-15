import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createSighting = mutation({
  args: {
    userId: v.id("users"),
    userProvidedName: v.optional(v.string()),
    privateNotes: v.optional(v.string()),
    photoId: v.id("_storage"),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const sightingId = await ctx.db.insert("plantSightings", {
      ...args,
      identificationStatus: "pending",
    });

    return sightingId;
  },
});

export const getUserSightings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sightings = await ctx.db
      .query("plantSightings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Get plant profiles for identified sightings
    const sightingsWithPlants = await Promise.all(
      sightings.map(async (sighting) => {
        let plantProfile = null;
        if (sighting.plantId) {
          plantProfile = await ctx.db.get(sighting.plantId);
        }

        // Get photo URL
        const photoUrl = await ctx.storage.getUrl(sighting.photoId);

        return {
          ...sighting,
          plantProfile,
          photoUrl,
        };
      })
    );

    return sightingsWithPlants;
  },
});

export const getSighting = query({
  args: { sightingId: v.id("plantSightings") },
  handler: async (ctx, args) => {
    const sighting = await ctx.db.get(args.sightingId);
    if (!sighting) return null;

    let plantProfile = null;
    if (sighting.plantId) {
      plantProfile = await ctx.db.get(sighting.plantId);
    }

    const photoUrl = await ctx.storage.getUrl(sighting.photoId);

    return {
      ...sighting,
      plantProfile,
      photoUrl,
    };
  },
});

export const updateSighting = mutation({
  args: {
    sightingId: v.id("plantSightings"),
    userProvidedName: v.optional(v.string()),
    privateNotes: v.optional(v.string()),
    plantId: v.optional(v.id("plantProfiles")),
    identificationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("identified"),
      v.literal("failed")
    )),
  },
  handler: async (ctx, args) => {
    const { sightingId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      return;
    }

    await ctx.db.patch(sightingId, cleanUpdates);
  },
});

export const deleteSighting = mutation({
  args: { sightingId: v.id("plantSightings") },
  handler: async (ctx, args) => {
    // First, remove from any tour stops
    const tourStops = await ctx.db
      .query("tourStops")
      .filter((q) => q.eq(q.field("sightingId"), args.sightingId))
      .collect();

    for (const stop of tourStops) {
      await ctx.db.delete(stop._id);
    }

    // Then delete the sighting
    await ctx.db.delete(args.sightingId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
export const getPhotoUrl = query({
  args: { photoId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.photoId);
  },
});