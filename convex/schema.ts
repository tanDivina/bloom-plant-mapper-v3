import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    profileImage: v.optional(v.id("_storage")),
    // Authentication fields
    passwordHash: v.optional(v.string()), // In production, store hashed passwords
    // Subscription fields
    subscriptionPlan: v.optional(v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("premium")
    )),
    subscriptionStatus: v.optional(v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    )),
    subscriptionEndDate: v.optional(v.number()),
    // Usage tracking
    lastActiveDate: v.optional(v.number()),
  }).index("by_email", ["email"])
    .index("by_subscription", ["subscriptionPlan", "subscriptionStatus"]),

  plantSightings: defineTable({
    userId: v.id("users"),
    plantId: v.optional(v.id("plantProfiles")), // null if not identified yet
    userProvidedName: v.optional(v.string()),
    privateNotes: v.optional(v.string()),
    photoId: v.id("_storage"),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
    }),
    identificationStatus: v.union(
      v.literal("pending"),
      v.literal("identified"),
      v.literal("failed")
    ),
    // Enhanced identification data
    identificationMethod: v.optional(v.union(
      v.literal("plantnet"),
      v.literal("gemini"),
      v.literal("manual")
    )),
    confidenceScore: v.optional(v.number()),
    alternativeNames: v.optional(v.array(v.string())),
  }).index("by_user", ["userId"])
    .index("by_plant", ["plantId"])
    .index("by_status", ["identificationStatus"]),

  plantProfiles: defineTable({
    scientificName: v.string(),
    commonNames: v.array(v.string()),
    description: v.string(),
    careInstructions: v.optional(v.string()),
    ecologicalRole: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    family: v.optional(v.string()),
    habitat: v.optional(v.string()),
    // Enhanced AI-generated content
    aiEnhanced: v.optional(v.boolean()),
    detailedDescription: v.optional(v.string()),
    growthHabits: v.optional(v.string()),
    seasonalChanges: v.optional(v.string()),
    culturalSignificance: v.optional(v.string()),
    conservationStatus: v.optional(v.string()),
    nativeRegions: v.optional(v.array(v.string())),
    bloomingSeason: v.optional(v.string()),
    soilPreferences: v.optional(v.string()),
    lightRequirements: v.optional(v.string()),
    waterNeeds: v.optional(v.string()),
    // PlantNet API data
    plantnetData: v.optional(v.object({
      species: v.array(v.object({
        scientificNameWithoutAuthor: v.string(),
        scientificNameAuthorship: v.string(),
        genus: v.object({
          scientificNameWithoutAuthor: v.string(),
          scientificNameAuthorship: v.string(),
        }),
        family: v.object({
          scientificNameWithoutAuthor: v.string(),
          scientificNameAuthorship: v.string(),
        }),
        commonNames: v.optional(v.array(v.string())),
        score: v.number(),
      })),
      images: v.optional(v.array(v.object({
        organ: v.string(),
        author: v.string(),
        license: v.string(),
        date: v.object({
          timestamp: v.number(),
          string: v.string(),
        }),
        citation: v.string(),
        url: v.object({
          o: v.string(),
          m: v.string(),
          s: v.string(),
        }),
      }))),
      remainingIdentificationRequests: v.optional(v.number()),
    })),
  }).index("by_scientific_name", ["scientificName"])
    .index("by_ai_enhanced", ["aiEnhanced"]),

  tours: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    isPublic: v.boolean(),
    coverImageId: v.optional(v.id("_storage")),
    // Enhanced tour features
    difficulty: v.optional(v.union(
      v.literal("easy"),
      v.literal("moderate"),
      v.literal("challenging")
    )),
    estimatedDuration: v.optional(v.number()), // in minutes
    tags: v.optional(v.array(v.string())),
    totalStops: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_public", ["isPublic"])
    .index("by_difficulty", ["difficulty"]),

  tourStops: defineTable({
    tourId: v.id("tours"),
    sightingId: v.id("plantSightings"),
    order: v.number(),
    audioDescriptionEn: v.optional(v.string()),
    audioDescriptionEs: v.optional(v.string()),
    customNotes: v.optional(v.string()),
    // Enhanced stop features
    stopTitle: v.optional(v.string()),
    estimatedTimeAtStop: v.optional(v.number()), // in minutes
    interestingFacts: v.optional(v.array(v.string())),
  }).index("by_tour", ["tourId"])
    .index("by_tour_order", ["tourId", "order"]),

  // New table for API usage tracking
  apiUsage: defineTable({
    userId: v.optional(v.id("users")),
    apiType: v.union(
      v.literal("plantnet"),
      v.literal("gemini")
    ),
    requestCount: v.number(),
    lastResetDate: v.number(),
    dailyLimit: v.number(),
  }).index("by_user_and_api", ["userId", "apiType"])
    .index("by_api_type", ["apiType"]),
});