import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, gender, height, weight, bodyType } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new NextResponse('User already exists', { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and profile in a transaction
    const user = await prisma.$transaction(async (tx: PrismaClient) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        }
      });

      // Create profile
      await tx.profile.create({
        data: {
          userId: newUser.id,
          bodyType,
          preferences: {
            measurements: {
              height: height ? parseInt(height) : null,
              weight: weight ? parseInt(weight) : null,
            },
            gender,
          }
        }
      });

      return newUser;
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error in signup:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 