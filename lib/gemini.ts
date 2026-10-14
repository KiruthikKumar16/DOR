import { GoogleGenerativeAI } from '@google/generative-ai';

// Prefer GEMINI_API_KEY but fall back to older GOOGLE_AI_KEY if present (keeps compatibility with existing Vercel envs)
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';

if (!API_KEY) {
  console.error('Gemini API key is not set. Set GEMINI_API_KEY (or GOOGLE_AI_KEY) in environment variables.');
}

/**
 * Gemini 3 Ecosystem Model Specifications:
 * 1. Reasoning/Agentic Backbone:
 *    - Model ID: gemini-3-flash-preview
 *    - Configuration: Enable "Thinking" capability (thinking_config: { include_thoughts: true })
 *    - Usage: Complex decision-making, travel planning, and multimodal analysis (PDF, Video, Audio)
 *    - max_output_tokens: 65,536
 *
 * 2. Visual Engine (Nano Banana 2 Lite):
 *    - Model ID: gemini-3.1-flash-lite-image
 *    - Usage: High-speed outfit image generation and local edits
 *    - Constraints: Target 1K resolution (1024x1024px) and sub-2 second latency
 */
export const REASONING_MODEL_ID =
  process.env.GEMINI_REASONING_MODEL ||
  process.env.GEMINI_TEXT_MODEL ||
  'gemini-3-flash-preview';

export const VISUAL_ENGINE_MODEL_ID =
  process.env.GEMINI_VISUAL_MODEL ||
  process.env.GEMINI_IMAGE_MODEL ||
  'gemini-3.1-flash-lite-image';

// Initialize the API client
export const genAI = new GoogleGenerativeAI(API_KEY);

// 1. Reasoning/Agentic Backbone Model Instance
export const reasoningModel = genAI.getGenerativeModel({
  model: REASONING_MODEL_ID,
  generationConfig: {
    maxOutputTokens: 65536,
    // Enable "Thinking" capability
    thinkingConfig: {
      includeThoughts: true,
    },
    thinking_config: {
      include_thoughts: true,
    },
  } as any,
});

// 2. Visual Engine (Nano Banana 2 Lite) Model Instance
export const visualEngineModel = genAI.getGenerativeModel({
  model: VISUAL_ENGINE_MODEL_ID,
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
  } as any,
});

export interface OutfitRecommendationResult {
  top: string;
  bottom: string;
  shoes: string;
  accessories: string[];
  outerwear: string;
  topColor: string;
  bottomColor: string;
  shoesColor: string;
  accessoriesColor: string;
  outerwearColor: string;
  culturalNotes: string;
  thoughts?: string;
}

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
}): Promise<OutfitRecommendationResult> {
  try {
    const prompt = `You are an expert AI fashion stylist and travel planning agent powered by Gemini 3.
Given the following travel and user context, reason carefully about appropriate attire, climate considerations, and local cultural norms, then provide an outfit recommendation in JSON format:

Weather: ${JSON.stringify(weather)}
Occasion: ${occasion}
Style/Vibe: ${vibe}
Body Type: ${bodyType}
Gender: ${gender}
Location: ${location}

CRITICAL RULES:
1. RESEARCH and consider current fashion trends, weather dynamics, common dressing styles, and cultural nuances of the specific LOCATION provided.
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

    console.log(`Sending prompt to Gemini 3 Reasoning Backbone (${REASONING_MODEL_ID})...`);

    const result = await reasoningModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 65536,
        thinkingConfig: {
          includeThoughts: true,
        },
        thinking_config: {
          include_thoughts: true,
        },
      } as any,
    });
    const response = await result.response;

    // Extract thoughts and content parts from Gemini 3 thinking response
    let thoughts = '';
    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    const thoughtParts = candidateParts.filter((part: any) => part.thought === true || part.thought);
    if (thoughtParts.length > 0) {
      thoughts = thoughtParts.map((p: any) => p.text || '').join('\n').trim();
    }

    // Extract text content excluding thoughts
    const nonThoughtParts = candidateParts.filter((part: any) => !part.thought);
    let text = nonThoughtParts.length > 0
      ? nonThoughtParts.map((p: any) => p.text || '').join('').trim()
      : response.text();

    // Check for XML thinking tags if present in text
    if (!thoughts) {
      const thoughtTagMatch = text.match(/<thought>([\s\S]*?)<\/thought>/i);
      if (thoughtTagMatch) {
        thoughts = thoughtTagMatch[1].trim();
        text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
      }
    }

    console.log('Gemini 3 reasoning completed. Thoughts length:', thoughts.length);

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
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

    // Return the outfit data with reasoning thoughts
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
      culturalNotes: outfitRecommendation.culturalNotes || '',
      thoughts: thoughts || outfitRecommendation.thoughts || undefined,
    };
  } catch (error) {
    console.error('Error getting outfit recommendation from Gemini 3:', error);
    throw error instanceof Error
      ? new Error(`Failed to get outfit recommendation: ${error.message}`)
      : new Error('Failed to get outfit recommendation');
  }
}

/**
 * Visual Engine: High-speed outfit image generation using Nano Banana 2 Lite (gemini-3.1-flash-lite-image)
 * Constraints: Target 1K resolution (1024x1024px) and sub-2 second latency
 */
export async function generateOutfitImage(
  outfitRecommendation: any,
  options?: { isEdit?: boolean; targetResolution?: string }
): Promise<string | null> {
  try {
    const promptForGemini = `Generate a realistic 1K resolution (1024x1024px) fashion portrait photograph of a person wearing the following outfit.
Target: 1024x1024 resolution, ultra-fast sub-2 second latency generation.
Focus on accurate visual details of the clothing items, fabric textures, clean lighting, and overall style. Keep the background simple and unobtrusive so clothing details are clear.

Outfit Description:
Top: ${outfitRecommendation.outfit?.top || outfitRecommendation.top} (${outfitRecommendation.outfit?.topColor || outfitRecommendation.topColor || ''})
Bottom: ${outfitRecommendation.outfit?.bottom || outfitRecommendation.bottom} (${outfitRecommendation.outfit?.bottomColor || outfitRecommendation.bottomColor || ''})
Shoes: ${outfitRecommendation.outfit?.shoes || outfitRecommendation.shoes} (${outfitRecommendation.outfit?.shoesColor || outfitRecommendation.shoesColor || ''})
Accessories: ${(outfitRecommendation.outfit?.accessories || outfitRecommendation.accessories || []).join(', ')} (${outfitRecommendation.outfit?.accessoriesColor || outfitRecommendation.accessoriesColor || ''})
${outfitRecommendation.outfit?.outerwear || outfitRecommendation.outerwear ? `Outerwear: ${outfitRecommendation.outfit?.outerwear || outfitRecommendation.outerwear} (${outfitRecommendation.outfit?.outerwearColor || outfitRecommendation.outerwearColor || ''})` : ''}

Style: ${outfitRecommendation.vibe || ''}
Occasion: ${outfitRecommendation.occasion || ''}
Weather: Temperature ${outfitRecommendation.weather?.temperature || ''}°C, ${outfitRecommendation.weather?.condition || ''}
${options?.isEdit ? 'Instruction: High-speed local edit preserving overall outfit coherence and character.' : ''}

Output Specifications:
- High quality 1K (1024x1024) realistic image render.`;

    const result = await visualEngineModel.generateContent({
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

    return "/placeholder.svg?height=1024&width=1024";
  } catch (error) {
    console.error('Error generating outfit image with Gemini 3.1 Flash Lite Image engine:', error);
    return "/placeholder.svg?height=1024&width=1024";
  }
}

/**
 * Visual Engine: Local edits using Nano Banana 2 Lite (gemini-3.1-flash-lite-image)
 * Supports rapid iterative edits at 1024x1024 resolution with sub-2 second latency
 */
export async function editOutfitImage({
  outfitRecommendation,
  editPrompt,
  baseImageData,
}: {
  outfitRecommendation: any;
  editPrompt?: string;
  baseImageData?: string;
}): Promise<string | null> {
  try {
    const prompt = `Perform a high-speed local edit on the outfit image at 1K resolution (1024x1024px).
Target latency: sub-2 seconds.
Modifications: ${editPrompt || 'Update outfit items as specified while preserving consistency.'}
Outfit details:
Top: ${outfitRecommendation.outfit?.top || outfitRecommendation.top}
Bottom: ${outfitRecommendation.outfit?.bottom || outfitRecommendation.bottom}
Shoes: ${outfitRecommendation.outfit?.shoes || outfitRecommendation.shoes}
Accessories: ${(outfitRecommendation.outfit?.accessories || outfitRecommendation.accessories || []).join(', ')}`;

    const parts: any[] = [{ text: prompt }];
    if (baseImageData) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: baseImageData.replace(/^data:image\/\w+;base64,/, '')
        }
      });
    }

    const result = await visualEngineModel.generateContent({
      contents: [{ role: "user", parts }],
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

    return generateOutfitImage(outfitRecommendation, { isEdit: true });
  } catch (error) {
    console.error('Error in editOutfitImage:', error);
    return generateOutfitImage(outfitRecommendation, { isEdit: true });
  }
}

/**
 * Reasoning Backbone: Multimodal analysis (PDF, Video, Audio, Images)
 * Powered by gemini-3-flash-preview with thinking capability and 65,536 max output tokens
 */
export async function analyzeMultimodalContent({
  prompt,
  mediaParts = [],
}: {
  prompt: string;
  mediaParts?: Array<{ mimeType: string; data: string }>;
}) {
  try {
    const parts: any[] = [{ text: prompt }];
    for (const media of mediaParts) {
      parts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: media.data.replace(/^data:[^;]+;base64,/, '')
        }
      });
    }

    const result = await reasoningModel.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: 65536,
        thinkingConfig: {
          includeThoughts: true,
        },
        thinking_config: {
          include_thoughts: true,
        },
      } as any,
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in analyzeMultimodalContent:', error);
    throw error;
  }
}
