import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getOutfitRecommendation, generateOutfitImage } from '@/lib/gemini';
import { getWeatherData } from '@/lib/weather';

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

    // Get outfit recommendation from our centralized function
    const outfitRecommendation = await getOutfitRecommendation({
      weather,
      occasion,
      vibe: outfitVibe,
      bodyType,
      gender,
      location: destination
    });

    // Generate outfit image
    const imageUrl = await generateOutfitImage({
      outfit: outfitRecommendation,
      vibe: outfitVibe,
      occasion: occasion,
      weather: {
        condition: weather.description,
        temperature: weather.temperature
      }
    });

    // Return the data in the format the frontend expects
    return NextResponse.json({
      outfits: [outfitRecommendation],
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