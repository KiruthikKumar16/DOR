import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { getWeatherData } from '@/lib/weather';
import { getOutfitRecommendation, generateOutfitImage } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { location, occasion } = body;

    if (!location || !occasion) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Get user profile for style and body type
    const userProfile = await prisma.profile.findUnique({
      where: {
        userId: user.id
      }
    });

    if (!userProfile) {
      return new NextResponse('User profile not found', { status: 404 });
    }

    // Get weather data
    const weatherData = await getWeatherData(location);
    const weatherCondition = `${weatherData.condition} (${weatherData.temperature}°C)`;

    // Get outfit recommendation from Gemini
    const recommendation = await getOutfitRecommendation(
      weatherCondition,
      occasion,
      userProfile.style || 'casual',
      userProfile.bodyType || 'average'
    );

    // Generate outfit image
    const outfitImage = await generateOutfitImage(recommendation);

    // Save the recommendation
    const savedOutfit = await prisma.outfit.create({
      data: {
        userId: user.id,
        name: `${occasion} outfit for ${location}`,
        occasion,
        weather: weatherCondition,
        imageUrl: outfitImage,
      }
    });

    return NextResponse.json({
      outfit: savedOutfit,
      recommendation,
      weather: weatherData
    });
  } catch (error) {
    console.error('Error in recommendation:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 