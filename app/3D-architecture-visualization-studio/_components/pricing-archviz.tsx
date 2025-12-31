"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

type Currency = "INR" | "USD"

const ACCENT = "#C6FF3A"

const IN_EXTERIOR_PER_VIEW = 4000
const IN_FIRST_MIN = 4000
const IN_FIRST_MAX = 8000
const IN_ADDITIONAL = 3000
const USD_MULTIPLIER = 2

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

const PRICES: Record<
  Currency,
  {
    exterior: string
    interior: string
    walkthrough: string
    save: string
    firstRange: string
    additional: string
    unitLabel: string
  }
> = {
  INR: {
    exterior: `${fmtINR(IN_EXTERIOR_PER_VIEW)}/-`,
    interior: "₹55,000/-",
    walkthrough: "₹1,70,500/-",
    save: "Save Flat ₹1,500/-",
    firstRange: `${fmtINR(IN_FIRST_MIN)}–${fmtINR(IN_FIRST_MAX)}`,
    additional: `${fmtINR(IN_ADDITIONAL)}`,
    unitLabel: "per view",
  },
  USD: {
    exterior: `${fmtUSD(IN_EXTERIOR_PER_VIEW * USD_MULTIPLIER)}`,
    interior: "$699",
    walkthrough: "$2,049",
    save: "Save $20",
    firstRange: `${fmtUSD(IN_FIRST_MIN * USD_MULTIPLIER)}–${fmtUSD(IN_FIRST_MAX * USD_MULTIPLIER)}`,
    additional: `${fmtUSD(IN_ADDITIONAL * USD_MULTIPLIER)}`,
    unitLabel: "per view",
  },
}

function guessLocalCurrency(): Currency {
  const lang = typeof navigator !== "undefined" ? navigator.language : ""
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""
  if (/-(IN|PK|BD)\b/i.test(lang) || /(Kolkata|Karachi|Dhaka)/i.test(tz || "")) return "INR"
  return "USD"
}

export function PricingArchviz() {
  const [currency, setCurrency] = useState<Currency>("USD")
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/geo", { cache: "no-store" })
        if (!res.ok) throw new Error("geo failed")
        const data = await res.json()
        if (!cancelled) setCurrency(data?.currency === "INR" ? "INR" : "USD")
      } catch {
        if (!cancelled) setCurrency(guessLocalCurrency())
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="pricing" className="text-white">
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="mx-auto mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", border: `1px solid ${ACCENT}` }}
          >
            Transparent pricing for ArchViz
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Packages.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-300">
            Predictable budgets for exteriors, interiors and cinematic walkthroughs.
          </p>
          <div className="mt-6">
            <Button
              asChild
              className="rounded-full px-5 text-neutral-900 hover:brightness-95"
              style={{ backgroundColor: "#f2f2f2" }}
            >
              <Link href="https://wa.link/65mf3i" target="_blank">
                Get a Custom Quote
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Exterior Still */}
          <Card className="relative overflow-hidden rounded-2xl liquid-glass shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
            <div
              className="absolute right-4 top-11 rounded-full px-2 py-0.5 text-[10px]"
              style={{ backgroundColor: "#1f1f1f", color: "#d4d4d4" }}
            >
              {PRICES[currency].save}
            </div>
            <CardHeader className="space-y-3 pb-4">
              <h3 className="text-sm font-semibold text-neutral-100">Exterior Still</h3>
              <div className="flex items-end gap-2 text-white">
                <div className="text-xl font-bold tracking-tight">{PRICES[currency].exterior}</div>
                <span className="pb-0.5 text-[11px] text-neutral-300">{PRICES[currency].unitLabel}</span>
              </div>
              <Button
                className="w-full rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{ backgroundColor: "#0a0a0a", color: "#ffffff", border: "1px solid #333" }}
              >
                View Examples
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="grid gap-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" style={{ color: ACCENT }} />
                  <span className="text-sm text-neutral-100">{`First render ${PRICES[currency].firstRange}`}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" style={{ color: ACCENT }} />
                  <span className="text-sm text-neutral-100">
                    {`Each additional view ${PRICES[currency].additional}`}
                  </span>
                </li>
                {[
                  "1 exterior camera angle",
                  "Day or dusk mood",
                  "Photoreal materials & lighting",
                  "1 revision",
                  "Delivered in 7–10 days",
                ].map((f, i) => (
                  <li key={i + 100} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4" style={{ color: ACCENT }} />
                    <span className="text-sm text-neutral-100">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter />
          </Card>

          {/* Interior Still */}
          <Card className="relative overflow-hidden rounded-2xl liquid-glass shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300">
            <CardHeader className="space-y-3 pb-4">
              <h3 className="text-sm font-semibold text-neutral-100">Interior Still</h3>
              <div className="flex items-end gap-2 text-white">
                <div className="text-xl font-bold tracking-tight">{PRICES[currency].interior}</div>
                <span className="pb-0.5 text-[11px] text-neutral-300">{PRICES[currency].unitLabel}</span>
              </div>
              <Button
                className="w-full rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{ backgroundColor: "#0a0a0a", color: "#ffffff", border: "1px solid #333" }}
              >
                View Examples
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="grid gap-2">
                {[
                  "1 interior camera angle",
                  "Furniture / props styling",
                  "Photoreal materials & lighting",
                  "2 revisions",
                  "Delivered in ~2 weeks",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4" style={{ color: ACCENT }} />
                    <span className="text-sm text-neutral-100">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter />
          </Card>

          {/* Walkthrough */}
          <Card className="relative overflow-hidden rounded-2xl liquid-glass-enhanced shadow-[0_16px_50px_rgba(0,0,0,0.4)] transition-all duration-300">
            <CardHeader className="relative space-y-3 pb-4">
              <h3 className="text-sm font-semibold text-neutral-100">Walkthrough</h3>
              <div className="flex items-end gap-2 text-white">
                <div className="text-xl font-bold tracking-tight">{PRICES[currency].walkthrough}</div>
                <span className="pb-0.5 text-[11px] text-neutral-300">per 30–40s</span>
              </div>
              <Button
                className="w-full rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{ backgroundColor: "#0a0a0a", color: "#ffffff", border: "1px solid #333" }}
              >
                View Examples
              </Button>
            </CardHeader>
            <CardContent className="relative pt-0">
              <ul className="grid gap-2">
                {[
                  "Shot‑planned camera path",
                  "Advanced lighting & environments",
                  "Music / SFX sync ready",
                  "Up to 3 structured revisions",
                  "Delivered in ~4 weeks",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4" style={{ color: ACCENT }} />
                    <span className="text-sm text-neutral-100">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter />
          </Card>
        </div>
      </div>
    </section>
  )
}
