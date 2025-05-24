import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: {
        userId: (session.user as SessionUser).id,
      },
    })

    if (!profile) {
      return new NextResponse("Profile not found", { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("[PROFILE_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { gender, height, weight, bodyType } = body

    // Create or update profile
    const profile = await prisma.profile.upsert({
      where: {
        userId: (session.user as SessionUser).id,
      },
      create: {
        userId: (session.user as SessionUser).id,
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