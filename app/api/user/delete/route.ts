import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface SessionUser {
  id: string;
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | null;
    
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Start a transaction to delete related data and the user
    await prisma.$transaction([
      // Delete related data (e.g., outfits, ratings, etc.)
      // Add deletion for any other related models here
      prisma.outfit.deleteMany({
        where: {
          userId: user.id,
        },
      }),
      // You might need to delete other related records depending on your schema
      // e.g., prisma.wardrobeItem.deleteMany({ where: { userId: user.id } }),
      // e.g., prisma.outfitRating.deleteMany({ where: { userId: user.id } }),

      // Finally, delete the user
      prisma.user.delete({
        where: {
          id: user.id,
        },
      }),
    ]);

    // Note: NextAuth handles session invalidation automatically after user deletion

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error('Error deleting account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 