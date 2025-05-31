import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

// Get user profile
export async function GET(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: {
        userId: user.id
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Update user profile
export async function PUT(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      style,
      bodyType,
      measurements,
      preferences,
      favoriteColors,
      favoriteBrands,
      sizePreferences,
      seasonalPreferences
    } = body;

    // Update user name if provided
    if (name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name }
      });
    }

    // Update profile
    const profile = await prisma.profile.update({
      where: {
        userId: user.id
      },
      data: {
        style,
        bodyType,
        preferences: {
          ...preferences,
          measurements,
          favoriteColors,
          favoriteBrands,
          sizePreferences,
          seasonalPreferences
        }
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Update profile picture
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return new NextResponse('Missing image URL', { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: imageUrl }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 