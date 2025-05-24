import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '@/lib/prisma';

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const body = await request.json();
    const { destination, date, occasion, vibe, weather, outfit, imageUrl, culturalNotes } = body;

    const savedOutfit = await prisma.outfit.create({
      data: {
        userId: user.id,
        destination,
        date: new Date(date),
        occasion,
        vibe,
        weather: weather,
        outfit: outfit,
        imageUrl,
        culturalNotes,
        isPublic: false
      }
    });

    return NextResponse.json(savedOutfit);
  } catch (error) {
    console.error('Error saving outfit:', error);
    return NextResponse.json(
      { error: 'Failed to save outfit' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const outfits = await prisma.outfit.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(outfits);
  } catch (error) {
    console.error('Error fetching outfits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outfits' },
      { status: 500 }
    );
  }
} 