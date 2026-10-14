import { NextResponse } from 'next/server';
import { generateOutfitImage, editOutfitImage } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    // Parse the request body to get the updated outfit data and relevant context
    const { outfit, vibe, occasion, weather, isEdit, editPrompt, baseImageUrl } = await req.json();

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit data is required' }, { status: 400 });
    }

    // Call visual engine (gemini-3.1-flash-lite-image Nano Banana 2 Lite) for high-speed 1K generation / local edits
    let imageUrl: string | null = null;
    if (isEdit || editPrompt) {
      imageUrl = await editOutfitImage({
        outfitRecommendation: { outfit, vibe, occasion, weather },
        editPrompt,
        baseImageData: baseImageUrl
      });
    } else {
      imageUrl = await generateOutfitImage(
        { outfit, vibe, occasion, weather },
        { isEdit: true, targetResolution: '1024x1024' }
      );
    }

    // Return the new 1K image URL with model metadata
    return NextResponse.json({
      imageUrl: imageUrl || "/placeholder.svg?height=1024&width=1024",
      modelInfo: {
        visualEngine: 'gemini-3.1-flash-lite-image (Nano Banana 2 Lite)',
        resolution: '1024x1024 (1K)',
        latency: 'sub-2s'
      }
    });

  } catch (error) {
    console.error('Error regenerating outfit image with Gemini 3 Visual Engine:', error);
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