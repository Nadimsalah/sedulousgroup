"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Phone, Mail, Clock, Building2, Shield } from "lucide-react"
import Image from "next/image"

interface FooterContent {
  tagline: string
  copyright: string
}

const defaultContent: FooterContent = {
  tagline: "Experience car rental like never before. We provide premium vehicles for all your travel needs.",
  copyright: "© 2025 — Sedulous Group Ltd",
}

export function AppverseFooter() {
  const [content, setContent] = useState<FooterContent>(defaultContent)

  useEffect(() => {
    // Load content from localStorage
    const savedContent = localStorage.getItem("skitbit-content")
    if (savedContent) {
      try {
        const parsed = JSON.parse(savedContent)
        if (parsed.footer) {
          setContent(parsed.footer)
        }
      } catch (error) {
        console.error("Error parsing saved content:", error)
      }
    }
  }, [])

  return (
    <section className="text-white">
      {/* Footer */}
      <footer className="border-t border-white/10 pb-20 md:pb-10">
        <div className="container mx-auto px-4 py-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center">
                <Image
                  src="/images/dna-group-logo.png"
                  alt="Sedulous Group Ltd logo"
                  width={180}
                  height={60}
                  className="h-12 w-auto"
                />
              </div>
              <p className="max-w-sm text-sm text-neutral-400">{content.tagline}</p>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-2">
              <div>
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">Navigation</h5>
                <ul className="space-y-2 text-sm text-neutral-300">
                  {["Rent", "Flexi Hire", "PCO Hire", "Sales", "About Us", "Contact Us"].map((item) => (
                    <li key={item}>
                      <Link href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-red-400">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">Legal</h5>
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li>
                    <Link href="/about-us" className="hover:text-red-400">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="hover:text-red-400">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/gdpr" className="hover:text-red-400">
                      GDPR
                    </Link>
                  </li>
                  <li>
                    <Link href="/rental-agreement" className="hover:text-red-400">
                      Rental Agreement
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-and-conditions" className="hover:text-red-400">
                      Terms & Conditions
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Contact Information */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-red-400" />
                <h5 className="text-sm font-semibold text-white">Contact Information</h5>
              </div>
              <div className="space-y-3 text-sm text-neutral-300">
                <p className="text-neutral-400">Sedulous Group LTD</p>
                <p className="leading-relaxed">
                  Unit 5, 100 Colindeep Lane
                  <br />
                  London
                  <br />
                  NW9 6HB
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Phone className="h-4 w-4 text-red-400" />
                  <a href="tel:02033552561" className="hover:text-red-400">
                    020 3355 2561
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-red-400" />
                  <a href="mailto:info@sedulousgroupltd.co.uk" className="hover:text-red-400 break-all">
                    info@sedulousgroupltd.co.uk
                  </a>
                </div>
              </div>
            </Card>

            {/* Opening Hours */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-red-400" />
                <h5 className="text-sm font-semibold text-white">Opening Hours</h5>
              </div>
              <div className="space-y-2 text-sm text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Monday – Friday</span>
                  <span>10:00 – 17:30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Saturday</span>
                  <span>10:00 – 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </Card>

            {/* Regulatory Information */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-red-400" />
                <h5 className="text-sm font-semibold text-white">Regulatory Information</h5>
              </div>
              <div className="space-y-2 text-sm text-neutral-300">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Company No:</span>
                  <span className="font-medium">13272612</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">FCA No:</span>
                  <span className="font-medium">964621</span>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <span className="text-neutral-400">ICO Registered</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Legal Disclaimer */}
          <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">
              <span className="font-semibold text-neutral-300">Sedulous Group Ltd</span> acts as a credit broker, not a
              lender. We are authorised and regulated by the Financial Conduct Authority (FCA No: 964621). Finance is
              subject to status, and terms and conditions apply. Guarantees may be required. Other offers may be
              available but cannot be used in conjunction with this offer.
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We work with a range of carefully selected credit providers who may be able to assist with financing your
              purchase. Nationwide delivery is available.
            </p>
          </div>
        </div>
      </footer>
    </section>
  )
}

export { AppverseFooter as AppVerseFooter }
