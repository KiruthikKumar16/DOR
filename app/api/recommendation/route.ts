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

    const prompt = `You are a fashion expert specializing in global fashion and cultural dress codes, with deep knowledge of Indian traditional wear. Given the following information, recommend an outfit in JSON format:

    Weather: Temperature ${weather.temperature}°C, ${weather.description}, Humidity ${weather.humidity}%, Wind Speed ${weather.windSpeed} m/s
    Occasion: ${occasion}
    Style/Vibe: ${outfitVibe}
    Body Type: ${bodyType}
    Gender: ${gender}
    Destination: ${destination}
    Random Seed: ${Math.random()} // Use this to generate different outfits

    IMPORTANT: You must respond with ONLY a valid JSON object in this exact format:
    {
      "outfit": {
        "top": "3-4 word description of the top",
        "topColor": "color of the top",
        "bottom": "3-4 word description of the bottom",
        "bottomColor": "color of the bottom",
        "shoes": "3-4 word description of the shoes",
        "shoesColor": "color of the shoes",
        "accessories": ["3-4 word accessory 1", "3-4 word accessory 2"],
        "accessoriesColor": "dominant color of accessories",
        "outerwear": "3-4 word description of outerwear (if needed)",
        "outerwearColor": "color of outerwear (if needed)"
      },
      "culturalNotes": "Brief cultural note about local dress customs and considerations for ${destination} (max 25 words)"
    }

    Rules:
    1. Only return the JSON object, no other text.
    2. Make sure the JSON is valid and properly formatted.
    3. Provide concise, 3-4 word descriptions for each item.
    4. Consider the weather conditions and occasion.
    5. Include at least 2 accessories.
    6. Include outerwear if the weather suggests it's needed.
    7. Include specific cultural notes about dress customs for the destination.
    8. Do not include any extra text or formatting outside the JSON object.
    9. Ensure the outfit is appropriate for the specified gender and body type.
    10. For Indian locations:
        - Consider local cultural preferences and traditions
        - Recommend appropriate traditional attire based on the occasion and location
        - Include culturally appropriate accessories
    11. For different vibes:
        - Create unique outfits that match the requested vibe while respecting cultural norms
        - Consider the occasion, weather, and location when interpreting the vibe
        - Ensure each recommendation is distinct and appropriate for the context
    12. For sarees and traditional wear:
        - Specify complete outfits with all necessary components
        - Consider the weather and occasion when choosing materials and styles
        - Include appropriate accessories that complement the outfit
    13. IMPORTANT: Each recommendation must be unique and different from previous ones. Use the random seed to generate variations in:
        - Color combinations
        - Fabric choices
        - Accessory selections
        - Style details
        - Pattern choices
    14. For each new recommendation:
        - Try different color palettes
        - Vary the fabric types
        - Change the accessory combinations
        - Modify the style details
        - Use different patterns or textures
    15. Include specific color suggestions for each clothing item and accessories.
    16. Ensure color choices are appropriate for the occasion, weather, vibe, and destination.
`;

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
    if (!outfitRecommendation.outfit?.top || !outfitRecommendation.outfit?.bottom || !outfitRecommendation.outfit?.shoes) {
      console.error('Invalid outfit structure:', outfitRecommendation);
      throw new Error('Invalid outfit structure received from Gemini API');
    }

    // Ensure accessories is an array
    if (!Array.isArray(outfitRecommendation.outfit.accessories)) {
      outfitRecommendation.outfit.accessories = [];
    }

    // Create the outfit data structure
    const outfitData = {
      outfit: outfitRecommendation.outfit,
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