import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getOutfitRecommendation, generateOutfitImage } from '@/lib/gemini';
import { getWeatherData } from '@/lib/weather';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL = 'gemini-1.5-flash';

interface UserPreferences {
  gender?: string;
  bodyType?: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { destination, date, occasion, vibe: outfitVibe } = await req.json();
    const weather = await getWeatherData(destination);

    // Get user profile data
    const userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        profile: {
          select: {
            gender: true,
            height: true,
            weight: true,
            bodyType: true,
            preferences: true
          }
        }
      }
    });

    if (!userProfile?.profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Use profile data or preferences, with fallbacks
    const preferences = userProfile.profile.preferences as UserPreferences | null;
    const gender = userProfile.profile.gender || preferences?.gender || 'neutral';
    const bodyType = userProfile.profile.bodyType || preferences?.bodyType || 'average';

    // Get the model
    const model = genAI.getGenerativeModel({ model: MODEL });

    const prompt = `You are a fashion expert specializing in global and regional fashion trends, cultural dressing norms, and traditional attire. Given the following information, recommend an outfit in JSON format:

    Weather: ${weather}
    Occasion: ${occasion}
    Style/Vibe: ${outfitVibe}
    Body Type: ${bodyType}
    Gender: ${gender}
    Location: ${destination}

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

    // Create the outfit data structure using the flat object
    const outfitData = {
      outfit: {
        top: outfitRecommendation.top,
        bottom: outfitRecommendation.bottom,
        shoes: outfitRecommendation.shoes,
        accessories: outfitRecommendation.accessories,
        outerwear: outfitRecommendation.outerwear || '',
        topColor: outfitRecommendation.topColor || '',
        bottomColor: outfitRecommendation.bottomColor || '',
        shoesColor: outfitRecommendation.shoesColor || '',
        accessoriesColor: outfitRecommendation.accessoriesColor || '',
        outerwearColor: outfitRecommendation.outerwearColor || ''
      },
      weather: weather,
      culturalNotes: outfitRecommendation.culturalNotes || '',
      imageUrl: null
    };

    // Generate outfit image using the parsed outfit data
    const imageUrl = await generateOutfitImage({
      outfit: outfitData.outfit,
      vibe: outfitVibe,
      occasion: occasion,
      weather: {
        condition: weather.description,
        temperature: weather.temperature
      }
    });

    // Return the data in the format the frontend expects
    return NextResponse.json({
      outfits: [outfitData.outfit],
      weather: weather,
      culturalNotes: outfitRecommendation.culturalNotes || '',
      imageUrl: imageUrl || "/placeholder.svg?height=400&width=300",
      destination,
      date,
      occasion,
      vibe: outfitVibe
    });

  } catch (error) {
    console.error('Error in recommendation:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 