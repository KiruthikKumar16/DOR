import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

// Initialize the API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use Gemini 2.5 Flash model for text generation (latest free stable)
const TEXT_MODEL = 'gemini-2.5-flash';
// Use Gemini 2.5 Flash for image generation
const IMAGE_MODEL = 'gemini-2.5-flash';

export async function getOutfitRecommendation(
  weather: string,
  occasion: string,
  vibe: string,
  bodyType: string,
  gender: string
) {
  try {
    const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to extract JSON from the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const outfitRecommendation = JSON.parse(jsonMatch[0]);

    // Validate the required fields
    if (!outfitRecommendation.top || !outfitRecommendation.bottom || !outfitRecommendation.shoes) {
      throw new Error('Invalid outfit structure received from Gemini API');
    }

    // Ensure accessories is an array
    if (!Array.isArray(outfitRecommendation.accessories)) {
      outfitRecommendation.accessories = [];
    }

    return {
      outfit: JSON.stringify({
        outfit: outfitRecommendation,
        weather: JSON.parse(weather),
        imageUrl: null
      }),
      weather: JSON.parse(weather),
      imageUrl: null
    };
  } catch (error) {
    console.error('Error getting outfit recommendation:', error);
    throw error instanceof Error 
      ? new Error(`Failed to get outfit recommendation: ${error.message}`)
      : new Error('Failed to get outfit recommendation');
  }
}

export async function generateOutfitImage(outfitRecommendation: any): Promise<string | null> {
  // Use placeholder image since Gemini 2.5 doesn't support image generation
  return "/placeholder.svg?height=400&width=300";
} 
