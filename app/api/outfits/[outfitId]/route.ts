import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

// Get outfit details
export async function GET(
  request: Request,
  { params }: { params: { outfitId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const outfit = await prisma.outfit.findUnique({
      where: {
        id: params.outfitId,
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
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Rate outfit
export async function POST(
  request: Request,
  { params }: { params: { outfitId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
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
          outfitId: params.outfitId
        }
      },
      update: {
        rating,
        comment
      },
      create: {
        userId: user.id,
        outfitId: params.outfitId,
        rating,
        comment
      }
    });

    return NextResponse.json(outfitRating);
  } catch (error) {
    console.error('Error rating outfit:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Toggle outfit publicity and generate share URL
export async function PATCH(
  request: Request,
  { params }: { params: { outfitId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { isPublic } = body;

    const outfit = await prisma.outfit.update({
      where: {
        id: params.outfitId,
        userId: user.id
      },
      data: {
        isPublic,
        shareUrl: isPublic ? nanoid(10) : null
      }
    });

    return NextResponse.json(outfit);
  } catch (error) {
    console.error('Error updating outfit:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Delete outfit
export async function DELETE(
  request: Request,
  { params }: { params: { outfitId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.outfit.delete({
      where: {
        id: params.outfitId,
        userId: user.id
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting outfit:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 