import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

// Initialize the API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use Gemini 2.5 Flash model for text generation (latest free stable)
const TEXT_MODEL = 'gemini-2.5-flash';
// Use Nano Banana for image generation (latest stable free model)
const IMAGE_MODEL = 'nano-banana';

export async function getOutfitRecommendation({
  weather,
  occasion,
  vibe,
  bodyType,
  gender,
  location
}: {
  weather: any;
  occasion: string;
  vibe: string;
  bodyType: string;
  gender: string;
  location: string;
}) {
  try {
    const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

    const prompt = `You are a fashion expert specializing in global and regional fashion trends, cultural dressing norms, and traditional attire. Given the following information, recommend an outfit in JSON format:

    Weather: ${JSON.stringify(weather)}
    Occasion: ${occasion}
    Style/Vibe: ${vibe}
    Body Type: ${bodyType}
    Gender: ${gender}
    Location: ${location}

    CRITICAL RULES:
    1. RESEARCH and consider the current fashion trends, common dressing styles, and cultural nuances of the specific LOCATION provided.
    2. For formal occasions (weddings, religious ceremonies), recommend traditional or formal attire that is appropriate and common for the specific LOCATION's culture.
    3. For casual occasions, suggest attire that is appropriate for the weather and common for casual wear in the specific LOCATION.
    4. Ensure the outfit recommendations align with the requested Style/Vibe while respecting local norms.
    5. ALWAYS include appropriate accessories and footwear that are suitable for the outfit, occasion, weather, and location.

    IMPORTANT: You must respond with ONLY a valid JSON object in this exact format:
    {
      "top": "3-4 word description of the top",
      "bottom": "3-4 word description of the bottom",
      "shoes": "3-4 word description of the shoes",
      "accessories": ["3-4 word accessory 1", "3-4 word accessory 2"],
      "outerwear": "3-4 word description of outerwear (if needed)",
      "topColor": "color of the top",
      "bottomColor": "color of the bottom",
      "shoesColor": "color of the shoes",
      "accessoriesColor": "color of the accessories",
      "outerwearColor": "color of the outerwear (if applicable)",
      "culturalNotes": "Brief cultural note about local dress customs and considerations for the LOCATION (max 30 words)"
    }

    Rules:
    1. Only return the JSON object, no other text.
    2. Make sure the JSON is valid and properly formatted.
    3. Provide concise, 3-4 word descriptions for each item.
    4. Consider the weather conditions and occasion.
    5. Include at least 2 accessories.
    6. Include outerwear if the weather suggests it's needed.
    7. Do not include any extra text or formatting outside the JSON object.
    8. The recommended outfit MUST be appropriate for the specific LOCATION and its cultural context.`;

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

    // Validate the required fields directly from the parsed object
    if (!outfitRecommendation.top || !outfitRecommendation.bottom || !outfitRecommendation.shoes) {
      console.error('Invalid outfit structure:', outfitRecommendation);
      throw new Error('Invalid outfit structure received from Gemini API');
    }

    // Ensure accessories is an array
    if (!Array.isArray(outfitRecommendation.accessories)) {
      outfitRecommendation.accessories = [];
    }

    // Return the outfit data in the right structure
    return {
      top: outfitRecommendation.top,
      bottom: outfitRecommendation.bottom,
      shoes: outfitRecommendation.shoes,
      accessories: outfitRecommendation.accessories,
      outerwear: outfitRecommendation.outerwear || '',
      topColor: outfitRecommendation.topColor || '',
      bottomColor: outfitRecommendation.bottomColor || '',
      shoesColor: outfitRecommendation.shoesColor || '',
      accessoriesColor: outfitRecommendation.accessoriesColor || '',
      outerwearColor: outfitRecommendation.outerwearColor || '',
      culturalNotes: outfitRecommendation.culturalNotes || ''
    };
  } catch (error) {
    console.error('Error getting outfit recommendation:', error);
    throw error instanceof Error 
      ? new Error(`Failed to get outfit recommendation: ${error.message}`)
      : new Error('Failed to get outfit recommendation');
  }
}

export async function generateOutfitImage(outfitRecommendation: any): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: IMAGE_MODEL });

    const promptForGemini = `Generate a realistic image of a person wearing the following outfit. Focus on the visual details of the clothing items and the overall style. Keep the background simple and neutral.

    Outfit Description:
    Top: ${outfitRecommendation.outfit.top} (${outfitRecommendation.outfit.topColor})
    Bottom: ${outfitRecommendation.outfit.bottom} (${outfitRecommendation.outfit.bottomColor})
    Shoes: ${outfitRecommendation.outfit.shoes} (${outfitRecommendation.outfit.shoesColor})
    Accessories: ${outfitRecommendation.outfit.accessories.join(", ")} (${outfitRecommendation.outfit.accessoriesColor})
    ${outfitRecommendation.outfit.outerwear && outfitRecommendation.outfit.outerwear !== "N/A" && outfitRecommendation.outfit.outerwear !== "Not applicable" ? `Outerwear: ${outfitRecommendation.outfit.outerwear} (${outfitRecommendation.outfit.outerwearColor})` : ''}

    Style: ${outfitRecommendation.vibe}
    Occasion: ${outfitRecommendation.occasion}
    Weather: Temperature ${outfitRecommendation.weather.temperature}°C, ${outfitRecommendation.weather.condition}

    Please generate a high-quality, realistic image of this outfit. The image should be clear, well-lit, and show the outfit details accurately.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptForGemini }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      } as any,
    });

    const response = result.response;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    );

    if (imagePart?.inlineData?.data) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    return "/placeholder.svg?height=400&width=300";
  } catch (error) {
    console.error('Error generating outfit image:', error);
    return "/placeholder.svg?height=400&width=300";
  }
} 
