"use server"

import { headers } from "next/headers"
import { db } from "@/lib/database"

let Resend: any = null
let resend: any = null

try {
  if (process.env.RESEND_API_KEY) {
    const ResendModule = await import("resend")
    Resend = ResendModule.Resend
    resend = new Resend(process.env.RESEND_API_KEY)
  }
} catch (error) {
  console.log("[v0] Resend not available:", error)
}

export async function sendBookingConfirmationEmail(bookingId: string, customerEmail: string) {
  console.log("[v0] sendBookingConfirmationEmail called for booking:", bookingId)

  if (!process.env.RESEND_API_KEY || !resend) {
    console.log("[v0] Resend API Key missing. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    // Fetch booking details
    const booking = await db.getBookingById(bookingId)
    if (!booking) {
      console.error("[v0] Booking not found:", bookingId)
      return { success: false, error: "Booking not found" }
    }

    // Fetch car details
    const car = await db.getCar(booking.carId)
    if (!car) {
      console.error("[v0] Car not found:", booking.carId)
      return { success: false, error: "Car not found" }
    }

    const origin = (await headers()).get("origin") || "https://sedulousgroup.net"
    const logoUrl = `${origin}/images/dna-group-logo.png`

    // Format dates
    const pickupDate = new Date(booking.pickupDate).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const dropoffDate = new Date(booking.dropoffDate).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const { error: emailError } = await resend.emails.send({
      from: "Sedulous Group <bookings@sedulousgroup.net>",
      to: customerEmail,
      subject: `Booking Confirmation - ${car.name} - Reference #${bookingId.substring(0, 8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1f1f1f; }
            .logo { text-align: center; margin-bottom: 40px; }
            .logo img { height: 40px; width: auto; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #ef4444; font-size: 28px; margin: 0 0 10px 0; font-weight: 700; }
            .header p { color: #a1a1aa; font-size: 16px; margin: 0; }
            .booking-ref { background: linear-gradient(135deg, #1a0000 0%, #0a0a0a 100%); border: 2px solid #1f1f1f; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
            .booking-ref .label { color: #a1a1aa; font-size: 14px; margin-bottom: 8px; }
            .booking-ref .value { color: #ef4444; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
            .card { background-color: #111111; border: 1px solid #1f1f1f; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .card h2 { color: #ffffff; font-size: 20px; margin: 0 0 20px 0; font-weight: 600; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #1f1f1f; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #a1a1aa; font-size: 14px; }
            .detail-value { color: #ffffff; font-size: 14px; font-weight: 600; text-align: right; }
            .status-badge { display: inline-block; background-color: #fbbf24; color: #000000; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin: 20px 0; }
            .info-box { background-color: #1a1a1a; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .info-box p { color: #d4d4d8; margin: 8px 0; line-height: 1.6; font-size: 14px; }
            .contact { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #1f1f1f; }
            .contact p { color: #a1a1aa; margin: 8px 0; font-size: 14px; }
            .contact .phone { color: #ef4444; font-size: 20px; font-weight: 700; margin: 15px 0; }
            .footer { margin-top: 40px; border-top: 1px solid #1f1f1f; padding-top: 30px; text-align: center; color: #52525b; font-size: 13px; line-height: 1.6; }
            .highlight { color: #ef4444; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logoUrl}" alt="Sedulous Group Ltd" />
            </div>
            
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p>Thank you for choosing Sedulous Group</p>
            </div>

            <div class="booking-ref">
              <div class="label">Your Booking Reference</div>
              <div class="value">#${bookingId.substring(0, 8).toUpperCase()}</div>
            </div>

            <div class="status-badge">⏳ Pending Review</div>

            <div class="card">
              <h2>Vehicle Details</h2>
              <div class="detail-row">
                <span class="detail-label">Vehicle</span>
                <span class="detail-value">${car.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Category</span>
                <span class="detail-value">${car.category}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Booking Type</span>
                <span class="detail-value">${booking.bookingType}</span>
              </div>
            </div>

            <div class="card">
              <h2>Rental Period</h2>
              <div class="detail-row">
                <span class="detail-label">Pick-up Date</span>
                <span class="detail-value">${pickupDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pick-up Time</span>
                <span class="detail-value">${booking.pickupTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Drop-off Date</span>
                <span class="detail-value">${dropoffDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Drop-off Time</span>
                <span class="detail-value">${booking.dropoffTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pick-up Location</span>
                <span class="detail-value">${booking.pickupLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Drop-off Location</span>
                <span class="detail-value">${booking.dropoffLocation}</span>
              </div>
            </div>

            <div class="card">
              <h2>Customer Information</h2>
              <div class="detail-row">
                <span class="detail-label">Name</span>
                <span class="detail-value">${booking.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Phone</span>
                <span class="detail-value">${booking.customerPhone}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value">${customerEmail}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Driving Licence</span>
                <span class="detail-value">${booking.drivingLicenseNumber}</span>
              </div>
            </div>

            <div class="total-row">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="label">Total Amount</span>
                <span class="value">£${booking.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div class="info-box">
              <p><strong style="color: #ef4444;">What happens next?</strong></p>
              <p>✓ Your booking request has been received and is under review</p>
              <p>✓ Our team will verify your documents within the next few hours</p>
              <p>✓ You will receive a confirmation once your booking is approved</p>
              <p>✓ Please have your driving licence ready for vehicle collection</p>
            </div>

            <div class="contact">
              <p>Need assistance? Contact us:</p>
              <div class="phone">📞 +44 20 1234 5678</div>
              <p style="color: #71717a; font-size: 12px;">Monday - Sunday: 9:00 AM - 6:00 PM</p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Sedulous Group Ltd. All rights reserved.</p>
              <p style="margin: 0; color: #3f3f46;">Premium Car Rental & Hire Services</p>
              <p style="margin: 10px 0 0 0; color: #3f3f46;">London, United Kingdom</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error("[v0] Error sending booking confirmation email:", emailError)
      return { success: false, error: "Failed to send email" }
    }

    console.log("[v0] Booking confirmation email sent successfully to:", customerEmail)
    return { success: true }
  } catch (err) {
    console.error("[v0] Exception sending booking confirmation email:", err)
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function sendBookingApprovalEmail(bookingId: string) {
  console.log("[v0] sendBookingApprovalEmail called for booking:", bookingId)

  if (!process.env.RESEND_API_KEY || !resend) {
    console.log("[v0] Resend API Key missing. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    // Fetch booking details
    const booking = await db.getBookingById(bookingId)
    if (!booking) {
      console.error("[v0] Booking not found:", bookingId)
      return { success: false, error: "Booking not found" }
    }

    if (!booking.customerEmail) {
      console.error("[v0] Customer email not found for booking:", bookingId)
      return { success: false, error: "Customer email not found" }
    }

    // Fetch car details
    const car = await db.getCar(booking.carId)
    if (!car) {
      console.error("[v0] Car not found:", booking.carId)
      return { success: false, error: "Car not found" }
    }

    const origin = (await headers()).get("origin") || "https://sedulousgroup.net"
    const logoUrl = `${origin}/images/dna-group-logo.png`

    // Format dates
    const pickupDate = new Date(booking.pickupDate).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const dropoffDate = new Date(booking.dropoffDate).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const { error: emailError } = await resend.emails.send({
      from: "Sedulous Group <bookings@sedulousgroup.net>",
      to: booking.customerEmail,
      subject: `🎉 Booking Approved - ${car.name} - Reference #${bookingId.substring(0, 8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1f1f1f; }
            .logo { text-align: center; margin-bottom: 40px; }
            .logo img { height: 40px; width: auto; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #22c55e; font-size: 32px; margin: 0 0 10px 0; font-weight: 700; }
            .header p { color: #a1a1aa; font-size: 16px; margin: 0; }
            .success-icon { text-align: center; margin: 30px 0; font-size: 64px; }
            .booking-ref { background: linear-gradient(135deg, #001a00 0%, #0a0a0a 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
            .booking-ref .label { color: #a1a1aa; font-size: 14px; margin-bottom: 8px; }
            .booking-ref .value { color: #22c55e; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
            .card { background-color: #111111; border: 1px solid #1f1f1f; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .card h2 { color: #ffffff; font-size: 20px; margin: 0 0 20px 0; font-weight: 600; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #1f1f1f; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #a1a1aa; font-size: 14px; }
            .detail-value { color: #ffffff; font-size: 14px; font-weight: 600; text-align: right; }
            .status-badge { display: inline-block; background-color: #22c55e; color: #000000; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: 700; margin: 20px 0; }
            .alert-box { background: linear-gradient(135deg, #001a00 0%, #0a0a0a 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 25px; margin: 25px 0; }
            .alert-box h3 { color: #22c55e; margin: 0 0 15px 0; font-size: 18px; }
            .alert-box p { color: #d4d4d8; margin: 10px 0; line-height: 1.6; font-size: 14px; }
            .alert-box ul { color: #d4d4d8; margin: 15px 0; padding-left: 20px; }
            .alert-box li { margin: 8px 0; line-height: 1.6; }
            .contact { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #1f1f1f; }
            .contact p { color: #a1a1aa; margin: 8px 0; font-size: 14px; }
            .contact .phone { color: #22c55e; font-size: 20px; font-weight: 700; margin: 15px 0; }
            .footer { margin-top: 40px; border-top: 1px solid #1f1f1f; padding-top: 30px; text-align: center; color: #52525b; font-size: 13px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logoUrl}" alt="Sedulous Group Ltd" />
            </div>
            
            <div class="success-icon">✅</div>
            
            <div class="header">
              <h1>Booking Approved!</h1>
              <p>Your ${car.name} is ready for collection</p>
            </div>

            <div class="status-badge">✓ CONFIRMED</div>

            <div class="booking-ref">
              <div class="label">Booking Reference</div>
              <div class="value">#${bookingId.substring(0, 8).toUpperCase()}</div>
            </div>

            <div class="alert-box">
              <h3>🎉 Great News - Your Booking is Confirmed!</h3>
              <p>We've reviewed your documents and approved your booking request. Your ${car.name} is reserved and ready for you.</p>
            </div>

            <div class="card">
              <h2>Collection Details</h2>
              <div class="detail-row">
                <span class="detail-label">Pick-up Date</span>
                <span class="detail-value">${pickupDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pick-up Time</span>
                <span class="detail-value">${booking.pickupTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pick-up Location</span>
                <span class="detail-value">${booking.pickupLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Return Date</span>
                <span class="detail-value">${dropoffDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Return Time</span>
                <span class="detail-value">${booking.dropoffTime}</span>
              </div>
            </div>

            <div class="card">
              <h2>Vehicle Information</h2>
              <div class="detail-row">
                <span class="detail-label">Vehicle</span>
                <span class="detail-value">${car.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Category</span>
                <span class="detail-value">${car.category}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Amount</span>
                <span class="detail-value" style="color: #22c55e; font-size: 18px;">£${booking.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div class="alert-box">
              <h3>📋 What to Bring for Collection</h3>
              <ul>
                <li>Valid driving licence (the one you submitted)</li>
                <li>Proof of address (recent utility bill or bank statement)</li>
                <li>Payment for the rental (if not already paid)</li>
                <li>This confirmation email (printed or on your phone)</li>
              </ul>
            </div>

            <div class="card">
              <h2>Important Reminders</h2>
              <p style="color: #d4d4d8; line-height: 1.6; margin: 0;">
                • Please arrive 15 minutes before your scheduled pick-up time<br/>
                • Vehicle inspection will be conducted at collection and return<br/>
                • Fuel policy: Return with the same fuel level as collection<br/>
                • Late returns may incur additional charges
              </p>
            </div>

            <div class="contact">
              <p>Questions or need to make changes?</p>
              <div class="phone">📞 +44 20 1234 5678</div>
              <p style="color: #71717a; font-size: 12px;">Monday - Sunday: 9:00 AM - 6:00 PM</p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Sedulous Group Ltd. All rights reserved.</p>
              <p style="margin: 0; color: #3f3f46;">Premium Car Rental & Hire Services</p>
              <p style="margin: 10px 0 0 0; color: #3f3f46;">London, United Kingdom</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error("[v0] Error sending booking approval email:", emailError)
      return { success: false, error: "Failed to send email" }
    }

    console.log("[v0] Booking approval email sent successfully to:", booking.customerEmail)
    return { success: true }
  } catch (err) {
    console.error("[v0] Exception sending booking approval email:", err)
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function sendBookingRejectionEmail(bookingId: string) {
  console.log("[v0] sendBookingRejectionEmail called for booking:", bookingId)

  if (!process.env.RESEND_API_KEY || !resend) {
    console.log("[v0] Resend API Key missing. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    // Fetch booking details
    const booking = await db.getBookingById(bookingId)
    if (!booking) {
      console.error("[v0] Booking not found:", bookingId)
      return { success: false, error: "Booking not found" }
    }

    if (!booking.customerEmail) {
      console.error("[v0] Customer email not found for booking:", bookingId)
      return { success: false, error: "Customer email not found" }
    }

    // Fetch car details
    const car = await db.getCar(booking.carId)
    if (!car) {
      console.error("[v0] Car not found:", booking.carId)
      return { success: false, error: "Car not found" }
    }

    const origin = (await headers()).get("origin") || "https://sedulousgroup.net"
    const logoUrl = `${origin}/images/dna-group-logo.png`

    // Format dates
    const pickupDate = new Date(booking.pickupDate).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const { error: emailError } = await resend.emails.send({
      from: "Sedulous Group <bookings@sedulousgroup.net>",
      to: booking.customerEmail,
      subject: `Booking Update - ${car.name} - Reference #${bookingId.substring(0, 8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1f1f1f; }
            .logo { text-align: center; margin-bottom: 40px; }
            .logo img { height: 40px; width: auto; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #ef4444; font-size: 28px; margin: 0 0 10px 0; font-weight: 700; }
            .header p { color: #a1a1aa; font-size: 16px; margin: 0; }
            .icon { text-align: center; margin: 30px 0; font-size: 64px; }
            .booking-ref { background: linear-gradient(135deg, #1a0000 0%, #0a0a0a 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
            .booking-ref .label { color: #a1a1aa; font-size: 14px; margin-bottom: 8px; }
            .booking-ref .value { color: #ef4444; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
            .card { background-color: #111111; border: 1px solid #1f1f1f; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .card h2 { color: #ffffff; font-size: 20px; margin: 0 0 20px 0; font-weight: 600; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #1f1f1f; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #a1a1aa; font-size: 14px; }
            .detail-value { color: #ffffff; font-size: 14px; font-weight: 600; text-align: right; }
            .status-badge { display: inline-block; background-color: #ef4444; color: #ffffff; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: 700; margin: 20px 0; }
            .alert-box { background: linear-gradient(135deg, #1a0000 0%, #0a0a0a 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 25px 0; }
            .alert-box h3 { color: #ef4444; margin: 0 0 15px 0; font-size: 18px; }
            .alert-box p { color: #d4d4d8; margin: 10px 0; line-height: 1.6; font-size: 14px; }
            .alert-box ul { color: #d4d4d8; margin: 15px 0; padding-left: 20px; }
            .alert-box li { margin: 8px 0; line-height: 1.6; }
            .contact { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #1f1f1f; }
            .contact p { color: #a1a1aa; margin: 8px 0; font-size: 14px; }
            .contact .phone { color: #ef4444; font-size: 20px; font-weight: 700; margin: 15px 0; }
            .footer { margin-top: 40px; border-top: 1px solid #1f1f1f; padding-top: 30px; text-align: center; color: #52525b; font-size: 13px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logoUrl}" alt="Sedulous Group Ltd" />
            </div>
            
            <div class="icon">❌</div>
            
            <div class="header">
              <h1>Booking Cancelled</h1>
              <p>Your booking request could not be processed</p>
            </div>

            <div class="status-badge">✗ CANCELLED</div>

            <div class="booking-ref">
              <div class="label">Booking Reference</div>
              <div class="value">#${bookingId.substring(0, 8).toUpperCase()}</div>
            </div>

            <div class="alert-box">
              <h3>We're Sorry</h3>
              <p>Unfortunately, we are unable to process your booking request for the ${car.name} at this time.</p>
              <p style="margin-top: 15px;">This may be due to:</p>
              <ul>
                <li>Vehicle unavailability for the selected dates</li>
                <li>Issues with the submitted documents</li>
                <li>Incomplete or incorrect information</li>
                <li>Other operational constraints</li>
              </ul>
            </div>

            <div class="card">
              <h2>Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Vehicle</span>
                <span class="detail-value">${car.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Requested Date</span>
                <span class="detail-value">${pickupDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer</span>
                <span class="detail-value">${booking.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount</span>
                <span class="detail-value">£${booking.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div class="alert-box">
              <h3>📞 Need Help?</h3>
              <p>If you believe this is an error or would like to discuss alternative options, please don't hesitate to contact us.</p>
              <p style="margin-top: 15px;">Our team is here to help you find the perfect vehicle for your needs.</p>
            </div>

            <div class="contact">
              <p>Contact our support team:</p>
              <div class="phone">📞 +44 20 1234 5678</div>
              <p style="color: #71717a; font-size: 12px;">Monday - Sunday: 9:00 AM - 6:00 PM</p>
              <p style="margin-top: 15px; color: #a1a1aa;">Email: support@sedulousgroup.net</p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Sedulous Group Ltd. All rights reserved.</p>
              <p style="margin: 0; color: #3f3f46;">Premium Car Rental & Hire Services</p>
              <p style="margin: 10px 0 0 0; color: #3f3f46;">London, United Kingdom</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error("[v0] Error sending booking rejection email:", emailError)
      return { success: false, error: "Failed to send email" }
    }

    console.log("[v0] Booking rejection email sent successfully to:", booking.customerEmail)
    return { success: true }
  } catch (err) {
    console.error("[v0] Exception sending booking rejection email:", err)
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function sendAgreementEmail(agreementId: string, customerEmail: string) {
  console.log("[v0] sendAgreementEmail called for agreement:", agreementId)

  if (!process.env.RESEND_API_KEY || !resend) {
    console.log("[v0] Resend API Key missing. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const agreement = await db.getAgreementById(agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found" }
    }

    const booking = await db.getBookingById(agreement.bookingId)
    if (!booking) {
      return { success: false, error: "Booking not found" }
    }

    const car = await db.getCar(booking.carId)
    if (!car) {
      return { success: false, error: "Car not found" }
    }

    const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://sedulousgroup.net"
    const logoUrl = `${origin}/images/dna-group-logo.png`
    const signUrl = `${origin}/agreement/sign/${agreementId}`

    const { error: emailError } = await resend.emails.send({
      from: "Sedulous Group <agreements@sedulousgroup.net>",
      to: customerEmail,
      subject: `📄 Rental Agreement Ready for Signature - ${agreement.agreementNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1f1f1f; }
            .logo { text-align: center; margin-bottom: 40px; }
            .logo img { height: 40px; width: auto; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #3b82f6; font-size: 28px; margin: 0 0 10px 0; font-weight: 700; }
            .header p { color: #a1a1aa; font-size: 16px; margin: 0; }
            .card { background-color: #111111; border: 1px solid #1f1f1f; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .card h2 { color: #ffffff; font-size: 20px; margin: 0 0 20px 0; font-weight: 600; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #1f1f1f; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #a1a1aa; font-size: 14px; }
            .detail-value { color: #ffffff; font-size: 14px; font-weight: 600; text-align: right; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 30px auto; text-align: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
            .cta-button:hover { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
            .info-box { background-color: #1a1a1a; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .info-box p { color: #d4d4d8; margin: 8px 0; line-height: 1.6; font-size: 14px; }
            .footer { margin-top: 40px; border-top: 1px solid #1f1f1f; padding-top: 30px; text-align: center; color: #52525b; font-size: 13px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logoUrl}" alt="Sedulous Group Ltd" />
            </div>
            
            <div class="header">
              <h1>📄 Rental Agreement Ready</h1>
              <p>Please review and sign your rental agreement</p>
            </div>

            <div class="card">
              <h2>Agreement Details</h2>
              <div class="detail-row">
                <span class="detail-label">Agreement Number</span>
                <span class="detail-value">${agreement.agreementNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle</span>
                <span class="detail-value">${car.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Booking Reference</span>
                <span class="detail-value">#${booking.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer</span>
                <span class="detail-value">${booking.customerName}</span>
              </div>
            </div>

            <div class="info-box">
              <p><strong style="color: #3b82f6;">Action Required</strong></p>
              <p>Your rental agreement is ready for your digital signature. Please click the button below to review the terms and conditions and provide your signature.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${signUrl}" class="cta-button">
                ✍️ Sign Agreement Now
              </a>
            </div>

            <div class="info-box">
              <p><strong style="color: #3b82f6;">What Happens Next?</strong></p>
              <p>✓ Review the agreement terms carefully<br/>
              ✓ Provide your digital signature<br/>
              ✓ Receive a signed copy via email<br/>
              ✓ Collect your vehicle on the scheduled date</p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Sedulous Group Ltd. All rights reserved.</p>
              <p style="margin: 0; color: #3f3f46;">Premium Car Rental & Hire Services</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error("[v0] Error sending agreement email:", emailError)
      return { success: false, error: "Failed to send email" }
    }

    console.log("[v0] Agreement email sent successfully to:", customerEmail)
    return { success: true }
  } catch (err) {
    console.error("[v0] Exception sending agreement email:", err)
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function sendPCNTicketEmail(ticketId: string) {
  console.log("[v0] sendPCNTicketEmail called for ticket:", ticketId)

  if (!process.env.RESEND_API_KEY || !resend) {
    console.log("[v0] Resend API Key missing. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    // Fetch PCN ticket details
    const tickets = await db.getPCNsByAgreementId("") // We'll need to get this differently
    const ticket = tickets.find((t) => t.id === ticketId)

    if (!ticket) {
      return { success: false, error: "Ticket not found" }
    }

    const agreement = await db.getAgreementById(ticket.agreementId)
    if (!agreement) {
      return { success: false, error: "Agreement not found" }
    }

    const booking = await db.getBookingById(agreement.bookingId)
    if (!booking || !booking.customerEmail) {
      return { success: false, error: "Booking or customer email not found" }
    }

    const car = await db.getCar(booking.carId)
    if (!car) {
      return { success: false, error: "Car not found" }
    }

    const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://sedulousgroup.net"
    const logoUrl = `${origin}/images/dna-group-logo.png`

    const ticketTypeLabel =
      ticket.ticketType === "parking"
        ? "Parking Ticket"
        : ticket.ticketType === "speeding"
          ? "Speeding Ticket"
          : ticket.ticketType === "congestion"
            ? "Congestion Charge"
            : "Traffic Ticket"

    const { error: emailError } = await resend.emails.send({
      from: "Sedulous Group <tickets@sedulousgroup.net>",
      to: booking.customerEmail,
      subject: `${ticketTypeLabel} Notification - ${ticket.ticketNumber || "N/A"} - ${agreement.agreementNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1f1f1f; }
            .logo { text-align: center; margin-bottom: 40px; }
            .logo img { height: 40px; width: auto; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #ef4444; font-size: 28px; margin: 0 0 10px 0; font-weight: 700; }
            .header p { color: #a1a1aa; font-size: 16px; margin: 0; }
            .icon { text-align: center; margin: 30px 0; font-size: 64px; }
            .card { background-color: #111111; border: 1px solid #1f1f1f; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .card h2 { color: #ffffff; font-size: 20px; margin: 0 0 20px 0; font-weight: 600; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #1f1f1f; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #a1a1aa; font-size: 14px; }
            .detail-value { color: #ffffff; font-size: 14px; font-weight: 600; text-align: right; }
            .alert-box { background: linear-gradient(135deg, #1a0000 0%, #0a0a0a 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 25px 0; }
            .alert-box h3 { color: #ef4444; margin: 0 0 15px 0; font-size: 18px; }
            .alert-box p { color: #d4d4d8; margin: 10px 0; line-height: 1.6; font-size: 14px; }
            .amount { text-align: center; padding: 30px; background: linear-gradient(135deg, #1a0000 0%, #0a0a0a 100%); border-radius: 12px; margin: 25px 0; }
            .amount .label { color: #a1a1aa; font-size: 14px; margin-bottom: 10px; }
            .amount .value { color: #ef4444; font-size: 48px; font-weight: bold; }
            .button { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 20px auto; text-align: center; }
            .footer { margin-top: 40px; border-top: 1px solid #1f1f1f; padding-top: 30px; text-align: center; color: #52525b; font-size: 13px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logoUrl}" alt="Sedulous Group Ltd" />
            </div>
            
            <div class="icon">⚠️</div>
            
            <div class="header">
              <h1>${ticketTypeLabel} Notification</h1>
              <p>Action Required - Please Review</p>
            </div>

            <div class="alert-box">
              <h3>Important Notice</h3>
              <p>A ${ticketTypeLabel.toLowerCase()} has been issued during your rental period. As per the terms of your rental agreement, you are responsible for any fines or penalties incurred during your rental.</p>
            </div>

            <div class="card">
              <h2>Ticket Details</h2>
              <div class="detail-row">
                <span class="detail-label">Ticket Type</span>
                <span class="detail-value">${ticketTypeLabel}</span>
              </div>
              ${
                ticket.ticketNumber
                  ? `
              <div class="detail-row">
                <span class="detail-label">Ticket Number</span>
                <span class="detail-value">${ticket.ticketNumber}</span>
              </div>
              `
                  : ""
              }
              <div class="detail-row">
                <span class="detail-label">Issue Date</span>
                <span class="detail-value">${new Date(ticket.issueDate).toLocaleDateString("en-GB")}</span>
              </div>
              ${
                ticket.dueDate
                  ? `
              <div class="detail-row">
                <span class="detail-label">Due Date</span>
                <span class="detail-value">${new Date(ticket.dueDate).toLocaleDateString("en-GB")}</span>
              </div>
              `
                  : ""
              }
            </div>

            <div class="amount">
              <div class="label">Amount Due</div>
              <div class="value">£${ticket.amount.toFixed(2)}</div>
            </div>

            <div class="card">
              <h2>Rental Information</h2>
              <div class="detail-row">
                <span class="detail-label">Agreement Number</span>
                <span class="detail-value">${agreement.agreementNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle</span>
                <span class="detail-value">${car.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer</span>
                <span class="detail-value">${booking.customerName}</span>
              </div>
            </div>

            ${
              ticket.notes
                ? `
            <div class="alert-box">
              <h3>Additional Notes</h3>
              <p>${ticket.notes}</p>
            </div>
            `
                : ""
            }

            <div class="card">
              <h2>What You Need to Do</h2>
              <p style="color: #d4d4d8; line-height: 1.6; margin: 0;">
                1. Review the attached ticket document<br/>
                2. Pay the fine by the due date to avoid additional penalties<br/>
                3. Submit proof of payment to us once paid<br/>
                4. Contact us if you wish to dispute this ticket
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${ticket.ticketDocumentUrl}" class="button">
                View Ticket Document
              </a>
            </div>

            <div class="alert-box">
              <h3>Need Help?</h3>
              <p>If you have any questions about this ticket or need assistance with payment, please don't hesitate to contact us.</p>
              <p style="margin-top: 15px;"><strong>Phone:</strong> +44 20 1234 5678<br/><strong>Email:</strong> support@sedulousgroup.net</p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Sedulous Group Ltd. All rights reserved.</p>
              <p style="margin: 0; color: #3f3f46;">Premium Car Rental & Hire Services</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error("[v0] Error sending PCN ticket email:", emailError)
      return { success: false, error: "Failed to send email" }
    }

    console.log("[v0] PCN ticket email sent successfully to:", booking.customerEmail)
    return { success: true }
  } catch (err) {
    console.error("[v0] Exception sending PCN ticket email:", err)
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function sendBookingProgressEmail(bookingId: string, stepCompleted: string) {
  console.log("[v0] sendBookingProgressEmail called for booking:", bookingId, "step:", stepCompleted)

  if (!process.env.RESEND_API_KEY || !resend) {
    console.log("[v0] Resend API Key missing. Email not sent.")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const booking = await db.getBookingById(bookingId)
    if (!booking) {
      console.error("[v0] Booking not found:", bookingId)
      return { success: false, error: "Booking not found" }
    }

    if (!booking.customerEmail) {
      console.error("[v0] Customer email not found for booking:", bookingId)
      return { success: false, error: "Customer email not found" }
    }

    const car = await db.getCar(booking.carId)
    if (!car) {
      console.error("[v0] Car not found:", booking.carId)
      return { success: false, error: "Car not found" }
    }

    const origin = (await headers()).get("origin") || "https://sedulousgroup.net"
    const logoUrl = `${origin}/images/dna-group-logo.png`
    const dashboardUrl = `${origin}/my-bookings/${bookingId}`

    let stepTitle = ""
    let stepDescription = ""
    let stepIcon = ""

    switch (stepCompleted) {
      case "agreement":
        stepTitle = "Rental Agreement Generated"
        stepDescription = "Your rental agreement has been prepared and is ready for your review and signature."
        stepIcon = "📄"
        break
      case "photos":
        stepTitle = "Vehicle Photos Uploaded"
        stepDescription = "We've uploaded photos of your vehicle showing its condition before rental."
        stepIcon = "📸"
        break
      case "inspection":
        stepTitle = "Vehicle Inspection Completed"
        stepDescription =
          "We've completed the vehicle inspection and recorded all details including mileage and fuel level."
        stepIcon = "✅"
        break
      case "ready":
        stepTitle = "Ready for Signature"
        stepDescription =
          "All steps are complete! Please review and sign your rental agreement to finalize your booking."
        stepIcon = "✍️"
        break
      default:
        stepTitle = "Booking Update"
        stepDescription = "We've updated your booking details."
        stepIcon = "🔔"
    }

    const { error: emailError } = await resend.emails.send({
      from: "Sedulous Group <bookings@sedulousgroup.net>",
      to: booking.customerEmail,
      subject: `${stepIcon} ${stepTitle} - Booking #${bookingId.substring(0, 8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1f1f1f; }
            .logo { text-align: center; margin-bottom: 40px; }
            .logo img { height: 40px; width: auto; }
            .header { text-align: center; margin-bottom: 40px; }
            .header .icon { font-size: 64px; margin-bottom: 20px; }
            .header h1 { color: #ef4444; font-size: 28px; margin: 0 0 10px 0; font-weight: 700; }
            .header p { color: #a1a1aa; font-size: 16px; margin: 0; line-height: 1.6; }
            .booking-ref { background: linear-gradient(135deg, #1a0000 0%, #0a0a0a 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
            .booking-ref .label { color: #a1a1aa; font-size: 14px; margin-bottom: 8px; }
            .booking-ref .value { color: #ef4444; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
            .card { background-color: #111111; border: 1px solid #1f1f1f; border-radius: 12px; padding: 25px; margin: 20px 0; }
            .card h2 { color: #ffffff; font-size: 18px; margin: 0 0 15px 0; font-weight: 600; }
            .card p { color: #d4d4d8; margin: 10px 0; line-height: 1.6; font-size: 14px; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #1f1f1f; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #a1a1aa; font-size: 14px; }
            .detail-value { color: #ffffff; font-size: 14px; font-weight: 600; text-align: right; }
            .cta-button { display: inline-block; background-color: #ef4444; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 25px 0; transition: background-color 0.2s; }
            .cta-button:hover { background-color: #dc2626; }
            .alert-box { background: linear-gradient(135deg, #1a0000 0%, #0a0a0a 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 25px 0; }
            .alert-box h3 { color: #ef4444; margin: 0 0 15px 0; font-size: 18px; }
            .alert-box p { color: #d4d4d8; margin: 10px 0; line-height: 1.6; font-size: 14px; }
            .contact { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #1f1f1f; }
            .contact p { color: #a1a1aa; margin: 8px 0; font-size: 14px; }
            .contact .phone { color: #ef4444; font-size: 20px; font-weight: 700; margin: 15px 0; }
            .footer { margin-top: 40px; border-top: 1px solid #1f1f1f; padding-top: 30px; text-align: center; color: #52525b; font-size: 13px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="${logoUrl}" alt="Sedulous Group Ltd" />
            </div>
            
            <div class="header">
              <div class="icon">${stepIcon}</div>
              <h1>${stepTitle}</h1>
              <p>${stepDescription}</p>
            </div>

            <div class="booking-ref">
              <div class="label">Booking Reference</div>
              <div class="value">#${bookingId.substring(0, 8).toUpperCase()}</div>
            </div>

            <div class="card">
              <h2>Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Vehicle</span>
                <span class="detail-value">${car.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer</span>
                <span class="detail-value">${booking.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Pick-up Date</span>
                <span class="detail-value">${new Date(booking.pickupDate).toLocaleDateString("en-GB")}</span>
              </div>
            </div>

            ${
              stepCompleted === "ready"
                ? `
              <div class="alert-box">
                <h3>✍️ Action Required: Sign Your Agreement</h3>
                <p>All preparation steps are complete! Please review your rental agreement and vehicle details, then provide your signature to finalize your booking.</p>
              </div>
            `
                : `
              <div class="card">
                <h2>Next Steps</h2>
                <p>We're preparing everything for your rental. You'll receive notifications as we complete each step. Once everything is ready, you'll be asked to review and sign your agreement.</p>
              </div>
            `
            }

            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="cta-button">View Booking Details</a>
            </div>

            <div class="contact">
              <p>Questions? We're here to help</p>
              <div class="phone">📞 020 3355 2561</div>
              <p style="color: #71717a; font-size: 12px;">Monday-Friday: 10:00-17:30 | Saturday: 10:00-14:00</p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Sedulous Group Ltd. All rights reserved.</p>
              <p style="margin: 0; color: #3f3f46;">Unit 5, 100 Colindeep Lane, London, NW9 6HB</p>
              <p style="margin: 10px 0 0 0; color: #3f3f46;">Company No: 13272612 | FCA No: 964621</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error("[v0] Error sending booking progress email:", emailError)
      return { success: false, error: "Failed to send email" }
    }

    console.log("[v0] Booking progress email sent successfully to:", booking.customerEmail)
    return { success: true }
  } catch (err) {
    console.error("[v0] Exception sending booking progress email:", err)
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
