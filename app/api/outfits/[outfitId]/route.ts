import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

type RouteContext = {
  params: {
    outfitId: string;
  };
};

// Get outfit details
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { outfitId } = context.params;
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const outfit = await prisma.outfit.findFirst({
      where: {
        id: outfitId,
        OR: [
          { userId: user.id },
          { isPublic: true }
        ]
      },
      include: {
        items: true,
        ratings: {
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!outfit) {
      return new NextResponse('Outfit not found', { status: 404 });
    }

    return NextResponse.json(outfit);
  } catch (error) {
    console.error('Error fetching outfit:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Rate outfit
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const { outfitId } = context.params;
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return new NextResponse('Invalid rating', { status: 400 });
    }

    const outfitRating = await prisma.outfitRating.upsert({
      where: {
        userId_outfitId: {
          userId: user.id,
          outfitId: outfitId
        }
      },
      update: {
        rating,
        comment
      },
      create: {
        userId: user.id,
        outfitId: outfitId,
        rating,
        comment
      }
    });

    return NextResponse.json(outfitRating);
  } catch (error) {
    console.error('Error rating outfit:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Toggle outfit publicity and generate share URL
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { outfitId } = context.params;
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name, isPublic } = body;

    const outfit = await prisma.outfit.update({
      where: {
        id: outfitId,
        userId: user.id
      },
      data: {
        name,
        isPublic,
        shareUrl: isPublic ? nanoid(10) : null
      }
    });

    return NextResponse.json(outfit);
  } catch (error) {
    console.error('Error updating outfit:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Delete outfit
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { outfitId } = context.params;
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.outfit.delete({
      where: {
        id: outfitId,
        userId: user.id
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting outfit:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 