import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { Resend } from "resend"

// Log the API key status (without exposing the actual key)
console.log("Resend API Key status:", process.env.RESEND_API_KEY ? "Present" : "Missing")

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    console.log("Processing forgot password request for email:", email)

    if (!email) {
      return new NextResponse("Email is required", { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    console.log("User found:", user ? "Yes" : "No")

    if (!user) {
      // Return success even if user doesn't exist for security
      return new NextResponse("If an account exists, you will receive a password reset email", { status: 200 })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    console.log("Generated reset token and expiry")

    // Save reset token to database
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    console.log("Saved reset token to database")

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    console.log("Reset URL generated:", resetUrl)
    
    try {
      if (!resend) {
        console.log("Resend client not initialized - skipping email send")
        return new NextResponse("If an account exists, you will receive a password reset email", { status: 200 })
      }

      console.log("Attempting to send email...")
      const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev", // Using Resend's test domain for now
        to: email, // Send to the actual user's email
        subject: "Reset Your Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested a password reset for your account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        `,
      })

      if (error) {
        console.error("Resend API error details:", error)
        throw new Error(`Failed to send email: ${error.message}`)
      }

      console.log("Email sent successfully. Response:", data)
    } catch (emailError: any) {
      console.error("Detailed email error:", emailError)
      throw new Error(`Failed to send reset email: ${emailError.message}`)
    }

    return new NextResponse("If an account exists, you will receive a password reset email", { status: 200 })
  } catch (error: any) {
    console.error("[FORGOT_PASSWORD] Detailed error:", error)
    return new NextResponse(`Internal error: ${error.message}`, { status: 500 })
  }
} 