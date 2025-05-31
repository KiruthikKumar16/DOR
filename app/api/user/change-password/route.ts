import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { User } from "@prisma/client"

interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function PUT(req: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    }) as User | null

    if (!user || !user.hashedPassword) {
      return new NextResponse("User not found or password not set", { status: 404 })
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.hashedPassword
    )

    if (!passwordMatch) {
      return new NextResponse("Invalid current password", { status: 401 })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { hashedPassword: hashedNewPassword },
    })

    return new NextResponse("Password updated successfully", { status: 200 })
  } catch (error) {
    console.error("Error changing password:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 