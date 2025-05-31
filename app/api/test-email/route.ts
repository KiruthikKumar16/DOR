import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    console.log("Testing email sending...")
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