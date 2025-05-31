import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

// Get all wardrobe items
export async function GET(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const items = await prisma.wardrobeItem.findMany({
      where: {
        userId: user.id
      }
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching wardrobe:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Add new wardrobe item
export async function POST(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name, type, category, weather, occasions, imageUrl } = body;

    if (!name || !type || !category) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const item = await prisma.wardrobeItem.create({
      data: {
        userId: user.id,
        name,
        type,
        category,
        weather: weather || [],
        occasions: occasions || [],
        imageUrl
      }
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error adding wardrobe item:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Update wardrobe item
export async function PUT(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { id, name, type, category, weather, occasions, imageUrl } = body;

    if (!id) {
      return new NextResponse('Missing item ID', { status: 400 });
    }

    const item = await prisma.wardrobeItem.update({
      where: {
        id,
        userId: user.id
      },
      data: {
        name,
        type,
        category,
        weather,
        occasions,
        imageUrl
      }
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating wardrobe item:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// Delete wardrobe item
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Missing item ID', { status: 400 });
    }

    await prisma.wardrobeItem.delete({
      where: {
        id,
        userId: user.id
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting wardrobe item:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 