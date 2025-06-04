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

export async function GET(
  request: NextRequest,
  context: { params: { outfitId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = session.user as SessionUser;
    const outfit = await prisma.outfit.findUnique({
      where: {
        id: context.params.outfitId,
        userId: user.id
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

export async function POST(
  request: NextRequest,
  context: { params: { outfitId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = session.user as SessionUser;
    const body = await request.json();
    const { rating } = body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return new NextResponse('Invalid rating value', { status: 400 });
    }

    const outfitRating = await prisma.outfitRating.upsert({
      where: {
        userId_outfitId: {
          userId: user.id,
          outfitId: context.params.outfitId
        }
      },
      update: {
        rating
      },
      create: {
        userId: user.id,
        outfitId: context.params.outfitId,
        rating
      }
    });

    return NextResponse.json(outfitRating);
  } catch (error) {
    console.error('Error rating outfit:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { outfitId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = session.user as SessionUser;
    const outfit = await prisma.outfit.update({
      where: {
        id: context.params.outfitId,
        userId: user.id
      },
      data: {
        isPublic: true
      }
    });

    return NextResponse.json(outfit);
  } catch (error) {
    console.error('Error making outfit public:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { outfitId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = session.user as SessionUser;
    await prisma.outfit.delete({
      where: {
        id: context.params.outfitId,
        userId: user.id
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting outfit:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 