import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { HfInference } from '@huggingface/inference'; // Import Hugging Face Inference client
import axios from 'axios'; // For making HTTP requests for image data (if HfInference doesn't directly provide Blob/Buffer)

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

// Initialize the API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use Gemini 1.5 Flash model for both text and image generation
const MODEL = 'gemini-1.5-flash';

// --- Hugging Face Inference API Setup (for image generation) ---
const HF_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN;
const HF_IMAGE_MODEL_ID = process.env.HUGGING_FACE_IMAGE_MODEL_ID || 'runwayml/stable-diffusion-v1-5'; // Default or your chosen model

if (!HF_API_TOKEN) {
    console.warn('Warning: HUGGING_FACE_API_TOKEN environment variable not set. Image generation will not work.');
}

const hf = new HfInference(HF_API_TOKEN);

let isHuggingFaceInitialized: boolean = false;
let huggingFaceInitializationPromise: Promise<void> | null = null;

/**
 * Ensures Hugging Face Inference client is ready.
 * (No extensive initialization needed for HF Inference API, just ensures API key is present)
 */
async function initializeHuggingFace(): Promise<void> {
    if (isHuggingFaceInitialized) {
        return;
    }
    if (huggingFaceInitializationPromise) {
        await huggingFaceInitializationPromise;
        return;
    }

    huggingFaceInitializationPromise = new Promise<void>((resolve, reject) => {
        if (!HF_API_TOKEN) {
            console.error("Hugging Face API token not set. Image generation will not work.");
            isHuggingFaceInitialized = true; // Mark as initialized to prevent repeated warnings
            reject(new Error("Hugging Face API token not set."));
            return;
        }
        console.log(`--- Hugging Face Inference for model ${HF_IMAGE_MODEL_ID} Ready ---`);
        isHuggingFaceInitialized = true;
        resolve();
    });
    return huggingFaceInitializationPromise;
}

// Call initializations immediately when the module loads
// This makes sure they run once per server startup in Next.js API routes
initializeHuggingFace();

export async function getOutfitRecommendation(
  weather: string,
  occasion: string,
  vibe: string,
  bodyType: string,
  gender: string
) {
  try {
    // Get the model
    const model = genAI.getGenerativeModel({ model: MODEL });

    const prompt = `You are a fashion expert. Given the following information, recommend an outfit in JSON format:

    Weather: ${weather}
    Occasion: ${occasion}
    Style/Vibe: ${vibe}
    Body Type: ${bodyType}
    Gender: ${gender}

    IMPORTANT: You must respond with ONLY a valid JSON object in this exact format:
    {
      "top": "3-4 word description of the top",
      "bottom": "3-4 word description of the bottom",
      "shoes": "3-4 word description of the shoes",
      "accessories": ["3-4 word accessory 1", "3-4 word accessory 2"],
      "outerwear": "3-4 word description of outerwear (if needed)"
    }

    Rules:
    1. Only return the JSON object, no other text.
    2. Make sure the JSON is valid and properly formatted.
    3. Provide concise, 3-4 word descriptions for each item.
    4. Consider the weather conditions and occasion.
    5. Include at least 2 accessories.
    6. Include outerwear if the weather suggests it's needed.
    7. Do not include any extra text or formatting outside the JSON object.`;

    console.log('Sending prompt to Gemini:', prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Raw Gemini response:', text);

    // Try to extract JSON from the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const outfitRecommendation = JSON.parse(jsonMatch[0]);

    // Validate the required fields
    if (!outfitRecommendation.top || !outfitRecommendation.bottom || !outfitRecommendation.shoes) {
      console.error('Invalid outfit structure:', outfitRecommendation);
      throw new Error('Invalid outfit structure received from Gemini API');
    }

    // Ensure accessories is an array
    if (!Array.isArray(outfitRecommendation.accessories)) {
      outfitRecommendation.accessories = [];
    }

    // Create the outfit data structure
    const outfitData = {
      outfit: outfitRecommendation,
      weather: JSON.parse(weather),
      imageUrl: null
    };

    // Return the stringified outfit data
    return {
      outfit: JSON.stringify(outfitData),
      weather: JSON.parse(weather),
      imageUrl: null // We'll generate this separately
    };
  } catch (error) {
    console.error('Error getting outfit recommendation:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get outfit recommendation: ${error.message}`);
    }
    throw new Error('Failed to get outfit recommendation');
  }
}

/**
 * Generates an image based on a text description using Gemini's image generation capabilities.
 * Returns a data URL (base64 encoded image) or null if generation fails.
 */
export async function generateOutfitImage(outfitRecommendation: any): Promise<string | null> {
  try {
        // Get the model
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-preview-image-generation' });

        const promptForGemini = `Generate a realistic image of a person wearing the following outfit. Focus on the visual details of the clothing items and the overall style. Keep the background simple and neutral.

        Outfit Description:
        Top: ${outfitRecommendation.outfit.top} (${outfitRecommendation.outfit.topColor})
        Bottom: ${outfitRecommendation.outfit.bottom} (${outfitRecommendation.outfit.bottomColor})
        Shoes: ${outfitRecommendation.outfit.shoes} (${outfitRecommendation.outfit.shoesColor})
        Accessories: ${outfitRecommendation.outfit.accessories.join(", ")} (${outfitRecommendation.outfit.accessoriesColor})
        ${outfitRecommendation.outfit.outerwear ? `Outerwear: ${outfitRecommendation.outfit.outerwear} (${outfitRecommendation.outfit.outerwearColor})` : ''}

        Style: ${outfitRecommendation.vibe}
        Occasion: ${outfitRecommendation.occasion}
        Weather: Temperature ${outfitRecommendation.weather.temperature}°C, ${outfitRecommendation.weather.condition}

        Please generate a high-quality, realistic image of this outfit. The image should be clear, well-lit, and show the outfit details accurately.`;

        console.log('[DEBUG] Attempting image generation with Gemini with prompt:', promptForGemini);

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: promptForGemini }] }],
            generationConfig: { // Use generationConfig for response modalities
                responseModalities: ["TEXT", "IMAGE"], // Request both text and image output modalities
            } as any, // Use any to bypass potential strict type checking if Modality is not easily accessible
        });

        const response = result.response;

        // The response might contain both text and image parts
        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.mimeType?.startsWith('image/'));

        if (imagePart?.inlineData?.data) {
            const imageData = imagePart.inlineData.data;
            const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imageData}`;
            console.log('Successfully generated image using Gemini!');
            return dataUrl;
        } else {
            console.warn('Gemini image generation did not return image data. Returning placeholder.', response);
            return "/placeholder.svg?height=400&width=300";
        }

  } catch (error) {
        console.error('Error generating outfit image with Gemini:', error);
        return "/placeholder.svg?height=400&width=300";
  }
} 