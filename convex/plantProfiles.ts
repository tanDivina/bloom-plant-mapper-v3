import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createPlantProfile = mutation({
  args: {
    scientificName: v.string(),
    commonNames: v.array(v.string()),
    description: v.string(),
    careInstructions: v.optional(v.string()),
    ecologicalRole: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    family: v.optional(v.string()),
    habitat: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if plant profile already exists
    const existing = await ctx.db
      .query("plantProfiles")
      .withIndex("by_scientific_name", (q) => q.eq("scientificName", args.scientificName))
      .unique();

    if (existing) {
      return existing._id;
    }

    const plantId = await ctx.db.insert("plantProfiles", args);
    return plantId;
  },
});

export const getPlantProfile = query({
  args: { plantId: v.id("plantProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.plantId);
  },
});

export const searchPlants = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const plants = await ctx.db.query("plantProfiles").collect();
    
    const searchLower = args.searchTerm.toLowerCase();
    
    return plants.filter(plant => 
      plant.scientificName.toLowerCase().includes(searchLower) ||
      plant.commonNames.some(name => name.toLowerCase().includes(searchLower)) ||
      (plant.family && plant.family.toLowerCase().includes(searchLower))
    );
  },
});

export const getAllPlants = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("plantProfiles").collect();
  },
});

export const updatePlantProfile = mutation({
  args: {
    plantId: v.id("plantProfiles"),
    description: v.optional(v.string()),
    careInstructions: v.optional(v.string()),
    ecologicalRole: v.optional(v.string()),
    habitat: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { plantId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      return;
    }

    await ctx.db.patch(plantId, cleanUpdates);
  },
});