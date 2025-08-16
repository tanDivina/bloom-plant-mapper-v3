"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Manual plant identification with Gemini typo correction
export const identifyPlantByName = action({
  args: {
    sightingId: v.id("plantSightings"),
    plantName: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    plantId?: Id<"plantProfiles">;
    plantProfile?: any;
    suggestions?: string[];
    error?: string;
  }> => {
    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;

      // First, check if plant already exists in our database
      const existingPlants = await ctx.runQuery(api.plantProfiles.searchPlants, {
        searchTerm: args.plantName,
      });

      if (existingPlants.length > 0) {
        // Found exact or close match in database
        const bestMatch = existingPlants[0];
        
        await ctx.runMutation(api.plantSightings.updateSighting, {
          sightingId: args.sightingId,
          plantId: bestMatch._id,
          userProvidedName: args.plantName,
          identificationStatus: "identified",
        });

        return {
          success: true,
          plantId: bestMatch._id,
          plantProfile: bestMatch,
        };
      }

      // If Gemini not configured, create a minimal plant profile and mark identified
      if (!geminiApiKey) {
        const minimalProfile = {
          scientificName: args.plantName,
          commonNames: [args.plantName],
          description: `User-provided identification for "${args.plantName}".`,
        };
        const plantId: Id<"plantProfiles"> = await ctx.runMutation(
          api.plantProfiles.createPlantProfile,
          minimalProfile
        );
        await ctx.runMutation(api.plantSightings.updateSighting, {
          sightingId: args.sightingId,
          plantId,
          userProvidedName: args.plantName,
          identificationStatus: "identified",
        });
        return { success: true, plantId, plantProfile: minimalProfile };
      }

      // Use Gemini to validate plant name and get comprehensive information
      const geminiPrompt = `You are a botanical expert. A user entered the plant name: "${args.plantName}"

Please analyze this plant name and respond with a JSON object containing:
1. "isValidPlant": boolean - is this a real plant name?
2. "correctedName": string - the correct scientific or common name if there are typos
3. "suggestions": array of strings - alternative names if the input is unclear
4. "scientificName": string - the scientific name
5. "commonNames": array of strings - common names
6. "description": string - comprehensive description (2-3 sentences)
7. "careInstructions": string - specific care instructions
8. "ecologicalRole": string - ecological role and benefits
9. "habitat": string - natural habitat
10. "family": string - plant family

If the plant name seems incorrect or unclear, provide helpful suggestions. If it's valid, provide complete botanical information.

Respond ONLY with valid JSON.`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: geminiPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              topK: 1,
              topP: 1,
              maxOutputTokens: 1500,
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error("No response from Gemini API");
      }

      const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      const aiContent = JSON.parse(cleanedText);

      // If plant name needs correction, return suggestions
      if (!aiContent.isValidPlant || aiContent.suggestions?.length > 0) {
        return {
          success: false,
          suggestions: aiContent.suggestions || [aiContent.correctedName].filter(Boolean),
          error: `Did you mean one of these plants?`,
        };
      }

      // Create comprehensive plant profile using Gemini data
      const plantProfile = {
        scientificName: aiContent.scientificName,
        commonNames: aiContent.commonNames || [aiContent.correctedName || args.plantName],
        description: aiContent.description,
        careInstructions: aiContent.careInstructions,
        ecologicalRole: aiContent.ecologicalRole,
        family: aiContent.family,
        habitat: aiContent.habitat,
      };

      // Create plant profile in database
      const plantId: Id<"plantProfiles"> = await ctx.runMutation(
        api.plantProfiles.createPlantProfile, 
        plantProfile
      );

      // Update sighting with the identification
      await ctx.runMutation(api.plantSightings.updateSighting, {
        sightingId: args.sightingId,
        plantId,
        userProvidedName: args.plantName,
        identificationStatus: "identified",
      });

      return {
        success: true,
        plantId,
        plantProfile,
      };

    } catch (error) {
      console.error("Manual plant identification failed:", error);
      
      await ctx.runMutation(api.plantSightings.updateSighting, {
        sightingId: args.sightingId,
        userProvidedName: args.plantName,
        identificationStatus: "failed",
      });

      return {
        success: false,
        error: "Failed to identify plant. Please check the spelling or try a different name.",
      };
    }
  },
});

// Photo-based plant identification using PlantNet API (priority) with Gemini fallback
export const identifyPlantByPhoto = action({
  args: {
    sightingId: v.id("plantSightings"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    plantId?: Id<"plantProfiles">;
    plantProfile?: any;
    method?: "plantnet" | "gemini";
    error?: string;
  }> => {
    try {
      const plantNetApiKey = process.env.PLANTNET_API_KEY;
      const geminiApiKey = process.env.GEMINI_API_KEY;

      const imageUrl = await ctx.storage.getUrl(args.storageId);
      if (!imageUrl) {
        await ctx.runMutation(api.plantSightings.updateSighting, {
          sightingId: args.sightingId,
          identificationStatus: "failed",
        });
        return { success: false, error: "Could not access uploaded image." };
      }
      // Try PlantNet first (priority method)
      if (plantNetApiKey) {
        try {
          const plantNetResult = await identifyWithPlantNet(imageUrl, plantNetApiKey);
          
          if (plantNetResult.success) {
            // Enhance PlantNet data with Gemini for comprehensive profile
            const enhancedProfile = await enhanceWithGemini(plantNetResult.plantProfile, geminiApiKey || "");
            
            const plantId: Id<"plantProfiles"> = await ctx.runMutation(
              api.plantProfiles.createPlantProfile, 
              enhancedProfile
            );

            await ctx.runMutation(api.plantSightings.updateSighting, {
              sightingId: args.sightingId,
              plantId,
              identificationStatus: "identified",
            });

            return {
              success: true,
              plantId,
              plantProfile: enhancedProfile,
              method: "plantnet",
            };
          }
        } catch (plantNetError) {
          console.log("PlantNet failed, trying Gemini fallback:", plantNetError);
        }
      }

      // Fallback to Gemini if PlantNet fails or hits rate limit
      if (geminiApiKey) {
        try {
          const geminiResult = await identifyWithGemini(imageUrl, geminiApiKey);
          
          if (geminiResult.success && geminiResult.plantProfile) {
            const plantId: Id<"plantProfiles"> = await ctx.runMutation(
              api.plantProfiles.createPlantProfile, 
              geminiResult.plantProfile
            );

            await ctx.runMutation(api.plantSightings.updateSighting, {
              sightingId: args.sightingId,
              plantId,
              identificationStatus: "identified",
            });

            return {
              success: true,
              plantId,
              plantProfile: geminiResult.plantProfile,
              method: "gemini",
            };
          }
        } catch (geminiError) {
          console.log("Gemini identification also failed:", geminiError);
        }
      }

      // Both methods failed
      await ctx.runMutation(api.plantSightings.updateSighting, {
        sightingId: args.sightingId,
        identificationStatus: "failed",
      });

      return {
        success: false,
        error: "Could not identify plant automatically. Please try manual identification or take a clearer photo.",
      };

    } catch (error) {
      console.error("Plant identification failed:", error);
      
      await ctx.runMutation(api.plantSightings.updateSighting, {
        sightingId: args.sightingId,
        identificationStatus: "failed",
      });

      return {
        success: false,
        error: "Plant identification service temporarily unavailable.",
      };
    }
  },
});

// Helper function for PlantNet identification
async function identifyWithPlantNet(imageUrl: string, apiKey: string) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Failed to fetch image");
  }
  
  const imageBlob = await imageResponse.blob();
  
  const formData = new FormData();
  formData.append('images', imageBlob, 'plant.jpg');
  formData.append('modifiers', '["crops", "auto"]');
  formData.append('plant-details', '["common_names", "url"]');
  
  const plantNetResponse = await fetch(
    `https://my-api.plantnet.org/v1/identify/weurope?api-key=${apiKey}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!plantNetResponse.ok) {
    if (plantNetResponse.status === 429) {
      throw new Error("PlantNet rate limit exceeded");
    }
    throw new Error(`PlantNet API error: ${plantNetResponse.status}`);
  }

  const plantNetData = await plantNetResponse.json();
  
  if (!plantNetData.results || plantNetData.results.length === 0) {
    return { success: false };
  }

  const bestMatch = plantNetData.results[0];
  const species = bestMatch.species;
  
  return {
    success: true,
    plantProfile: {
      scientificName: species.scientificNameWithoutAuthor,
      commonNames: species.commonNames?.map((name: any) => name.name) || [species.scientificNameWithoutAuthor],
      family: species.family?.scientificNameWithoutAuthor || "",
      imageUrl: bestMatch.images?.[0]?.url?.m,
      description: `${species.scientificNameWithoutAuthor} identified with ${Math.round(bestMatch.score * 100)}% confidence using PlantNet.`,
    }
  };
}

// Helper function for Gemini identification
async function identifyWithGemini(imageUrl: string, apiKey?: string): Promise<{
  success: boolean;
  plantProfile?: any;
}> {
  // Note: Gemini Vision API would be used here for image analysis
  // For now, we'll create a basic fallback response
  return {
    success: false, // Disable for now since we need Gemini Vision API
  };
}

// Helper function to enhance PlantNet data with Gemini
async function enhanceWithGemini(basicProfile: any, apiKey?: string) {
  if (!apiKey) return basicProfile;

  try {
    const geminiPrompt = `You are a botanical expert. Provide comprehensive information about the plant "${basicProfile.scientificName}" (common names: ${basicProfile.commonNames?.join(', ') || 'unknown'}).

Please provide detailed information in JSON format with these keys:
- "description": comprehensive description (2-3 sentences)
- "careInstructions": specific care instructions for gardeners
- "ecologicalRole": ecological role and environmental benefits
- "habitat": natural habitat and growing conditions

Keep each section informative but concise. Respond ONLY with valid JSON.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: geminiPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (generatedText) {
        const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
        const aiContent = JSON.parse(cleanedText);
        
        return {
          ...basicProfile,
          description: aiContent.description || basicProfile.description,
          careInstructions: aiContent.careInstructions,
          ecologicalRole: aiContent.ecologicalRole,
          habitat: aiContent.habitat,
        };
      }
    }
  } catch (error) {
    console.log("Gemini enhancement failed, using basic profile:", error);
  }

  return basicProfile;
}

// Enhanced plant profile generation (for existing plants)
export const enhancePlantProfile = action({
  args: {
    plantId: v.id("plantProfiles"),
  },
  handler: async (ctx, args) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return { success: false, error: "Gemini API not configured" };
    }

    try {
      const plant = await ctx.runQuery(api.plantProfiles.getPlantProfile, {
        plantId: args.plantId,
      });

      if (!plant) {
        return { success: false, error: "Plant not found" };
      }

      const enhancedProfile = await enhanceWithGemini(plant, geminiApiKey);
      
      await ctx.runMutation(api.plantProfiles.updatePlantProfile, {
        plantId: args.plantId,
        description: enhancedProfile.description,
        careInstructions: enhancedProfile.careInstructions,
        ecologicalRole: enhancedProfile.ecologicalRole,
        habitat: enhancedProfile.habitat,
      });

      return { success: true, enhancedContent: enhancedProfile };
    } catch (error) {
      console.error("Enhance plant profile error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to enhance plant profile" 
      };
    }
  },
});