import { NextResponse } from "next/server"
// import { getServerSession } from "next-auth" // Remove v4 import
import { prisma } from "@/lib/prisma"
// import { authOptions } from "@/lib/auth" // authOptions is not needed directly here in v5
import { auth } from "@/auth" // Import v5 auth function

interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function GET() {
  try {
    // Use the v5 auth() function to get the session
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Explicitly check if the user exists in the database
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!user) {
        // This case should ideally not happen if the Prisma adapter works correctly,
        // but we handle it to be safe and potentially log the issue.
        console.error("PROFILE_GET: User record not found for session ID", session.user.id);
        return new NextResponse("User profile data unavailable", { status: 404 });
    }

    let profile = await prisma.profile.findUnique({
      where: {
        userId: user.id, // Use the found user's ID
      },
    })

    // If profile does not exist, create one
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: user.id, // Use the found user's ID
          // Add any default profile data here if needed
          preferences: {}, // Example: add a default empty preferences object
        },
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("[PROFILE_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    // Use the v5 auth() function to get the session
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { gender, height, weight, bodyType } = body

    // Create or update profile
    const profile = await prisma.profile.upsert({
      where: {
        userId: session.user.id, // Access id directly from session.user
      },
      create: {
        userId: session.user.id, // Access id directly from session.user
        preferences: {
          gender,
          height: Number(height),
          weight: Number(weight),
        },
        bodyType,
      },
      update: {
        preferences: {
          gender,
          height: Number(height),
          weight: Number(weight),
        },
        bodyType,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error("[PROFILE_PUT]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 