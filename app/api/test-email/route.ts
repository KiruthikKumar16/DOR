import { NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function GET() {
  try {
    console.log("Testing email sending...")
    
    if (!resend) {
      console.log("Resend client not initialized - skipping test email")
      return new NextResponse("Email service not configured", { status: 503 })
    }

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "delivered@resend.dev", // Resend's test email address
      subject: "Test Email",
      html: "<p>This is a test email to verify Resend is working.</p>",
    })

    if (error) {
      console.error("Resend test error:", error)
      return new NextResponse(`Error: ${error.message}`, { status: 500 })
    }

    console.log("Test email sent successfully:", data)
    return new NextResponse("Test email sent successfully", { status: 200 })
  } catch (error: any) {
    console.error("Test email error:", error)
    return new NextResponse(`Error: ${error.message}`, { status: 500 })
  }
} 