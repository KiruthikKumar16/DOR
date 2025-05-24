import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

interface RecommendationRequest {
  location: {
    city?: string;
    lat?: number;
    lon?: number;
  };
  occasion: string;
  style?: string;
  additionalPreferences?: {
    gender?: string;
    age?: number;
    weight?: number;
    height?: number;
    bodyType?: string;
    favoriteColors?: string[];
    favoriteBrands?: string[];
    seasonalPreferences?: string[];
  };
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json() as RecommendationRequest;
    const { location, occasion, style, additionalPreferences } = body;

    // Fetch weather data
    let weatherData;
    try {
      const weatherUrl = new URL('/api/weather', request.url);
      if (location.city) {
        weatherUrl.searchParams.set('city', location.city);
      } else if (location.lat && location.lon) {
        weatherUrl.searchParams.set('lat', location.lat.toString());
        weatherUrl.searchParams.set('lon', location.lon.toString());
      }
      const weatherResponse = await fetch(weatherUrl);
      weatherData = await weatherResponse.json();
    } catch (error) {
      console.error('Error fetching weather:', error);
      return new NextResponse('Failed to fetch weather data', { status: 500 });
    }

    // Get user's wardrobe items
    const wardrobeItems = await prisma.wardrobeItem.findMany({
      where: {
        userId: user.id,
      },
    });

    // Get user's profile for preferences
    const profile = await prisma.profile.findUnique({
      where: {
        userId: user.id,
      },
    });

    // Prepare prompt for Gemini
    const prompt = `Given the following information, suggest a personalized outfit:

    Location and Weather:
    - City: ${weatherData.city}
    - Temperature: ${weatherData.temperature}°C
    - Weather Condition: ${weatherData.description}
    - Humidity: ${weatherData.humidity}%
    - Wind Speed: ${weatherData.windSpeed} m/s

    Personal Information:
    - Gender: ${additionalPreferences?.gender || profile?.preferences?.gender || 'not specified'}
    - Age: ${additionalPreferences?.age || 'not specified'}
    - Height: ${additionalPreferences?.height || profile?.preferences?.measurements?.height || 'not specified'} cm
    - Weight: ${additionalPreferences?.weight || profile?.preferences?.measurements?.weight || 'not specified'} kg
    - Body Type: ${additionalPreferences?.bodyType || profile?.bodyType || 'not specified'}
    - Style Preference: ${style || profile?.style || 'casual'}
    - Favorite Colors: ${additionalPreferences?.favoriteColors?.join(', ') || profile?.preferences?.favoriteColors?.join(', ') || 'not specified'}
    - Favorite Brands: ${additionalPreferences?.favoriteBrands?.join(', ') || profile?.preferences?.favoriteBrands?.join(', ') || 'not specified'}
    - Seasonal Preferences: ${additionalPreferences?.seasonalPreferences?.join(', ') || profile?.preferences?.seasonalPreferences?.join(', ') || 'not specified'}

    Occasion: ${occasion}
    
    Available clothing items:
    ${wardrobeItems.map((item: { name: string; type: string; category: string; color?: string | null; brand?: string | null }) => 
      `- ${item.name} (${item.type}, ${item.category}, ${item.color || 'no color specified'}, ${item.brand || 'no brand specified'})`
    ).join('\n')}
    
    Please suggest a complete outfit using the available items, considering all the above factors. 
    The recommendation should be practical, comfortable, and appropriate for the weather and occasion.
    Format the response as a JSON object with the following structure:
    {
      "outfit": {
        "name": "string",
        "description": "string",
        "items": ["item1", "item2", ...],
        "reasoning": "string",
        "weatherAppropriateness": "string",
        "styleNotes": "string",
        "comfortLevel": "string",
        "occasionSuitability": "string"
      }
    }`;

    // Generate recommendation using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const recommendation = JSON.parse(text);

    // Create a new outfit in the database
    const outfit = await prisma.outfit.create({
      data: {
        userId: user.id,
        name: recommendation.outfit.name,
        occasion,
        weather: weatherData.description,
        items: {
          connect: wardrobeItems
            .filter((item: { name: string; id: string }) => recommendation.outfit.items.includes(item.name))
            .map((item: { id: string }) => ({ id: item.id }))
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json({
      outfit,
      recommendation: recommendation.outfit,
      weather: weatherData
    });
  } catch (error) {
    console.error('Error generating recommendation:', error);
    return new NextResponse('Failed to generate outfit recommendation', { status: 500 });
  }
} 