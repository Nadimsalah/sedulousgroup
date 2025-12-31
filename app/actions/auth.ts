"use server"

import { createClient } from "@/lib/supabase/server"

export async function signIn(emailOrFormData: string | FormData, password?: string) {
  try {
    let email: string
    let pwd: string

    if (emailOrFormData instanceof FormData) {
      email = emailOrFormData.get("email") as string
      pwd = emailOrFormData.get("password") as string
    } else {
      email = emailOrFormData
      pwd = password || ""
    }

    console.log("[v0] Sign in attempt for:", email)

    if (!email || !pwd) {
      console.error("[v0] Missing email or password")
      return { success: false, error: "Email and password are required" }
    }

    const supabase = await createClient()

    if (!supabase) {
      console.error("[v0] CRITICAL: Supabase client is null")
      return {
        success: false,
        error: "Authentication service is not available. Please check your configuration.",
      }
    }

    console.log("[v0] Attempting sign in with Supabase...")

    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(pwd),
    })

    if (error) {
      console.error("[v0] Supabase login error:", error.message, error.status)
      return {
        success: false,
        error: error.message === "Invalid login credentials" ? "Invalid email or password" : error.message,
      }
    }

    if (!data.user) {
      console.error("[v0] Login returned no user")
      return { success: false, error: "Login failed. Please try again." }
    }

    console.log("[v0] Login successful for user:", data.user.id)
    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("[v0] Sign in exception:", error)
    return {
      success: false,
      error: error?.message || "An unexpected error occurred. Please try again.",
    }
  }
}

export const login = signIn

export async function signInWithMagicLink(email: string) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return { success: false, error: "Authentication service not configured" }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: String(email),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Magic link error:", error)
    return { success: false, error: error?.message || "Failed to send magic link" }
  }
}

export async function signUp(email: string, password: string, fullName?: string) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return { success: false, error: "Authentication service not configured" }
    }

    const { data, error } = await supabase.auth.signUp({
      email: String(email),
      password: String(password),
      options: {
        data: {
          full_name: fullName || "",
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data.user) {
      return { success: true, user: data.user }
    }

    return { success: false, error: "Unknown error" }
  } catch (error: any) {
    console.error("[v0] Sign up error:", error)
    return { success: false, error: error?.message || "Failed to sign up" }
  }
}

export async function sendOTP(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const fullName = formData.get("fullName") as string

    console.log("[v0] sendOTP called with email:", email, "fullName:", fullName)

    const supabase = await createClient()

    if (!supabase) {
      return { error: "Authentication service not configured" }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: String(email),
      options: {
        data: {
          full_name: fullName || "",
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
      },
    })

    if (error) {
      console.error("[v0] sendOTP error:", error.message)
      return { error: error.message }
    }

    console.log("[v0] OTP sent successfully to:", email)
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Send OTP exception:", error)
    return { error: error?.message || "Failed to send OTP" }
  }
}

export async function verifyOTPAndSignup(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const phone = formData.get("phone") as string
    const otp = formData.get("otp") as string

    console.log("[v0] verifyOTPAndSignup called with email:", email)

    const supabase = await createClient()

    if (!supabase) {
      return { error: "Authentication service not configured" }
    }

    // First, verify the OTP
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: String(email),
      token: String(otp),
      type: "email",
    })

    if (verifyError) {
      console.error("[v0] OTP verification error:", verifyError.message)
      return { error: verifyError.message }
    }

    console.log("[v0] OTP verified successfully")

    // If OTP verified, update user data and set password
    if (verifyData.user) {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        password: String(password),
        data: {
          full_name: fullName,
          phone: phone,
        },
      })

      if (updateError) {
        console.error("[v0] Error updating user:", updateError.message)
        return { error: updateError.message }
      }

      // Create user profile in database
      const { error: profileError } = await supabase.from("user_profiles").upsert({
        id: verifyData.user.id,
        full_name: fullName,
        phone: phone,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("[v0] Error creating profile:", profileError.message)
        // Don't fail the signup if profile creation fails
      }

      console.log("[v0] User created successfully:", verifyData.user.id)
      return { success: true, user: verifyData.user }
    }

    return { error: "Verification failed" }
  } catch (error: any) {
    console.error("[v0] Verify OTP exception:", error)
    return { error: error?.message || "Failed to verify OTP" }
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return { success: false, error: "Authentication service not configured" }
    }

    await supabase.auth.signOut()
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Sign out error:", error)
    return { success: false, error: error?.message || "Failed to sign out" }
  }
}
