import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createTour = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    isPublic: v.boolean(),
    coverImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const tourId = await ctx.db.insert("tours", args);
    return tourId;
  },
});

export const getUserTours = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tours = await ctx.db
      .query("tours")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Get stop counts for each tour
    const toursWithCounts = await Promise.all(
      tours.map(async (tour) => {
        const stops = await ctx.db
          .query("tourStops")
          .withIndex("by_tour", (q) => q.eq("tourId", tour._id))
          .collect();

        let coverImageUrl = null;
        if (tour.coverImageId) {
          coverImageUrl = await ctx.storage.getUrl(tour.coverImageId);
        }

        return {
          ...tour,
          stopCount: stops.length,
          coverImageUrl,
        };
      })
    );

    return toursWithCounts;
  },
});

export const getPublicTours = query({
  args: {},
  handler: async (ctx) => {
    const tours = await ctx.db
      .query("tours")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .collect();

    // Get stop counts and user info for each tour
    const toursWithDetails = await Promise.all(
      tours.map(async (tour) => {
        const stops = await ctx.db
          .query("tourStops")
          .withIndex("by_tour", (q) => q.eq("tourId", tour._id))
          .collect();

        const user = await ctx.db.get(tour.userId);

        let coverImageUrl = null;
        if (tour.coverImageId) {
          coverImageUrl = await ctx.storage.getUrl(tour.coverImageId);
        }

        return {
          ...tour,
          stopCount: stops.length,
          coverImageUrl,
          user: user ? { name: user.name } : null,
        };
      })
    );

    return toursWithDetails;
  },
});

export const getTour = query({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    const tour = await ctx.db.get(args.tourId);
    if (!tour) return null;

    // Get tour stops with sighting details
    const stops = await ctx.db
      .query("tourStops")
      .withIndex("by_tour_order", (q) => q.eq("tourId", args.tourId))
      .order("asc")
      .collect();

    const stopsWithDetails = await Promise.all(
      stops.map(async (stop) => {
        const sighting = await ctx.db.get(stop.sightingId);
        if (!sighting) return null;

        let plantProfile = null;
        if (sighting.plantId) {
          plantProfile = await ctx.db.get(sighting.plantId);
        }

        const photoUrl = await ctx.storage.getUrl(sighting.photoId);

        return {
          ...stop,
          sighting: {
            ...sighting,
            plantProfile,
            photoUrl,
          },
        };
      })
    );

    let coverImageUrl = null;
    if (tour.coverImageId) {
      coverImageUrl = await ctx.storage.getUrl(tour.coverImageId);
    }

    return {
      ...tour,
      coverImageUrl,
      stops: stopsWithDetails.filter(Boolean),
    };
  },
});

export const updateTour = mutation({
  args: {
    tourId: v.id("tours"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    coverImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { tourId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      return;
    }

    await ctx.db.patch(tourId, cleanUpdates);
  },
});

export const deleteTour = mutation({
  args: { tourId: v.id("tours") },
  handler: async (ctx, args) => {
    // First, delete all tour stops
    const stops = await ctx.db
      .query("tourStops")
      .withIndex("by_tour", (q) => q.eq("tourId", args.tourId))
      .collect();

    for (const stop of stops) {
      await ctx.db.delete(stop._id);
    }

    // Then delete the tour
    await ctx.db.delete(args.tourId);
  },
});

export const addTourStop = mutation({
  args: {
    tourId: v.id("tours"),
    sightingId: v.id("plantSightings"),
    audioDescriptionEn: v.optional(v.string()),
    audioDescriptionEs: v.optional(v.string()),
    customNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current stop count to determine order
    const existingStops = await ctx.db
      .query("tourStops")
      .withIndex("by_tour", (q) => q.eq("tourId", args.tourId))
      .collect();

    const order = existingStops.length;

    const stopId = await ctx.db.insert("tourStops", {
      ...args,
      order,
    });

    return stopId;
  },
});

export const removeTourStop = mutation({
  args: { stopId: v.id("tourStops") },
  handler: async (ctx, args) => {
    const stop = await ctx.db.get(args.stopId);
    if (!stop) return;

    // Delete the stop
    await ctx.db.delete(args.stopId);

    // Reorder remaining stops
    const remainingStops = await ctx.db
      .query("tourStops")
      .withIndex("by_tour", (q) => q.eq("tourId", stop.tourId))
      .collect();

    // Sort by current order and reassign
    remainingStops.sort((a, b) => a.order - b.order);
    
    for (let i = 0; i < remainingStops.length; i++) {
      if (remainingStops[i].order !== i) {
        await ctx.db.patch(remainingStops[i]._id, { order: i });
      }
    }
  },
});

export const updateTourStop = mutation({
  args: {
    stopId: v.id("tourStops"),
    audioDescriptionEn: v.optional(v.string()),
    audioDescriptionEs: v.optional(v.string()),
    customNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { stopId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      return;
    }

    await ctx.db.patch(stopId, cleanUpdates);
  },
});