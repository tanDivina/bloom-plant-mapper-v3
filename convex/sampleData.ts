import { mutation } from "./_generated/server";
import { v } from "convex/values";

// This mutation creates sample data for development/demo purposes
export const createSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // Idempotency: check for existing demo user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@plantmapper.com"))
      .unique();

    if (existingUser) {
      return {
        message: "Sample data already exists",
        userId: existingUser._id,
      };
    }

    // Create a sample user
    const userId = await ctx.db.insert("users", {
      email: "demo@plantmapper.com",
      name: "Plant Explorer",
    });

    // Create sample plant profiles
    const oakId = await ctx.db.insert("plantProfiles", {
      scientificName: "Quercus alba",
      commonNames: ["White Oak", "American White Oak"],
      description: "A large deciduous tree native to eastern and central North America. Known for its distinctive lobed leaves and valuable timber.",
      careInstructions: "Prefers full sun and well-drained soil. Drought tolerant once established. Requires minimal pruning.",
      ecologicalRole: "Provides food and habitat for over 500 species of butterflies and moths. Acorns are important food source for wildlife.",
      family: "Fagaceae",
      habitat: "Mixed hardwood forests, parks, and large landscapes",
      imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400"
    });

    const mapleId = await ctx.db.insert("plantProfiles", {
      scientificName: "Acer rubrum",
      commonNames: ["Red Maple", "Swamp Maple", "Soft Maple"],
      description: "A deciduous tree native to eastern North America. Famous for its brilliant red fall foliage and adaptability to various soil conditions.",
      careInstructions: "Adaptable to various soil types. Prefers moist, well-drained soil. Tolerates both sun and partial shade.",
      ecologicalRole: "Early nectar source for bees and other pollinators. Seeds provide food for birds and small mammals.",
      family: "Sapindaceae",
      habitat: "Wetlands, forests, and urban landscapes",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
    });

    const roseId = await ctx.db.insert("plantProfiles", {
      scientificName: "Rosa rubiginosa",
      commonNames: ["Sweet Briar", "Eglantine Rose"],
      description: "A species of wild rose native to Europe and western Asia. Known for its fragrant foliage and bright red hips.",
      careInstructions: "Prefers full sun and well-drained soil. Drought tolerant. Benefits from annual pruning after flowering.",
      ecologicalRole: "Provides nectar for pollinators and hips for birds. Dense growth offers nesting sites for small birds.",
      family: "Rosaceae",
      habitat: "Hedgerows, woodland edges, and disturbed areas",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400"
    });

    // Create sample plant sightings (we'll use placeholder storage IDs)
    const sighting1 = await ctx.db.insert("plantSightings", {
      userId,
      plantId: oakId,
      userProvidedName: "Big Oak Tree",
      privateNotes: "Found this beautiful oak in the park. Perfect for shade on hot days!",
      photoId: "placeholder_storage_id_1" as any,
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: "Golden Gate Park, San Francisco, CA",
      },
      identificationStatus: "identified",
    });

    const sighting2 = await ctx.db.insert("plantSightings", {
      userId,
      plantId: mapleId,
      privateNotes: "Amazing fall colors on this maple tree. Must visit again in autumn!",
      photoId: "placeholder_storage_id_2" as any,
      location: {
        latitude: 37.7849,
        longitude: -122.4094,
        address: "Presidio, San Francisco, CA",
      },
      identificationStatus: "identified",
    });

    const sighting3 = await ctx.db.insert("plantSightings", {
      userId,
      plantId: roseId,
      userProvidedName: "Wild Rose Bush",
      privateNotes: "Sweet fragrance and beautiful pink flowers. Bees love this one!",
      photoId: "placeholder_storage_id_3" as any,
      location: {
        latitude: 37.7649,
        longitude: -122.4294,
        address: "Lands End, San Francisco, CA",
      },
      identificationStatus: "identified",
    });

    // Create a sample tour
    const tourId = await ctx.db.insert("tours", {
      userId,
      name: "San Francisco Native Plants",
      description: "Discover the beautiful native plants that thrive in San Francisco's unique climate. This tour showcases trees and shrubs that have adapted to our foggy, coastal environment.",
      isPublic: true,
    });

    // Add tour stops
    await ctx.db.insert("tourStops", {
      tourId,
      sightingId: sighting1,
      order: 0,
      audioDescriptionEn: "Welcome to our first stop! This magnificent White Oak is over 100 years old and provides crucial habitat for local wildlife.",
      customNotes: "Great spot for photos and bird watching.",
    });

    await ctx.db.insert("tourStops", {
      tourId,
      sightingId: sighting2,
      order: 1,
      audioDescriptionEn: "Our second stop features this beautiful Red Maple, known for its stunning fall colors that paint the landscape in brilliant reds and oranges.",
      customNotes: "Best visited in October for peak fall colors.",
    });

    await ctx.db.insert("tourStops", {
      tourId,
      sightingId: sighting3,
      order: 2,
      audioDescriptionEn: "Our final stop showcases this lovely Sweet Briar rose, a hardy plant that thrives in coastal conditions and provides food for local pollinators.",
      customNotes: "Fragrant flowers bloom from May to July.",
    });

    return {
      message: "Sample data created successfully!",
      userId,
      plantProfiles: [oakId, mapleId, roseId],
      sightings: [sighting1, sighting2, sighting3],
      tourId,
    };
  },
});