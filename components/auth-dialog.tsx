"use client"

import { useState } from "react"
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onContinueAsGuest: () => void
}

export function AuthDialog({ isOpen, onClose, onContinueAsGuest }: AuthDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <Card className="relative w-full max-w-md border border-white/10 bg-gradient-to-br from-neutral-900 to-black p-8 shadow-2xl">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Complete Your Booking</h2>
          <p className="text-white/60 text-sm">Sign in to save your bookings and get exclusive benefits</p>
        </div>

        <div className="space-y-4">
          <Link href="/login" className="block">
            <Button className="w-full bg-red-500 hover:bg-red-600 text-white py-6 text-base font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300">
              Login to Your Account
            </Button>
          </Link>

          <Link href="/signup" className="block">
            <Button variant="outline" className="w-full border-white/20 bg-white/5 hover:bg-white/10 text-white py-6 text-base font-semibold rounded-xl transition-all duration-300">
              Create New Account
            </Button>
          </Link>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-900 px-2 text-white/60">Or</span>
            </div>
          </div>

          <Button
            onClick={() => {
              onContinueAsGuest()
              onClose()
            }}
            variant="ghost"
            className="w-full border border-white/10 bg-transparent hover:bg-white/5 text-white py-6 text-base font-semibold rounded-xl transition-all duration-300"
          >
            Continue as Guest
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-white/40">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </Card>
    </div>
  )
}
