import { NextResponse } from 'next/server';
import { generateOutfitImage } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    // Parse the request body to get the updated outfit data and relevant context
    const { outfit, vibe, occasion, weather } = await req.json();

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit data is required' }, { status: 400 });
    }

    // Call the image generation function with the updated data
    const imageUrl = await generateOutfitImage({
      outfit: outfit,
      vibe: vibe,
      occasion: occasion,
      weather: weather // Assuming weather structure is suitable for generateOutfitImage
    });

    // Return the new image URL
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Error regenerating outfit image:', error);
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