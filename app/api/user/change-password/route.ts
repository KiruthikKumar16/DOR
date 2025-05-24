import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = session.user as SessionUser

    if (!user.id) {
      return new NextResponse("User ID not found in session", { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    })

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, dbUser.password)

    if (!isPasswordValid) {
      return new NextResponse("Current password is incorrect", { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    })

    return new NextResponse("Password updated successfully", { status: 200 })
  } catch (error) {
    console.error("[CHANGE_PASSWORD]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 