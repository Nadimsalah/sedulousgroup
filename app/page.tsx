import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { CarListings } from "@/components/car-listings"
import { LogoMarquee } from "@/components/logo-marquee"
import { FAQ } from "@/components/faq"
import { AppverseFooter } from "@/components/appverse-footer"
import Script from "next/script"

// ✅ Force static generation for low TTFB
export const dynamic = "force-static"

export default function Page() {
  const pageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://dnarentalcar.com/",
    name: "Sedulous Group Ltd | Premium Car Rentals Made Simple, Reliable & Affordable",
    description:
      "From daily rentals to long-term leases, Sedulous Group Ltd delivers premium vehicles that are fast, reliable, and built to make your journey exceptional.",
    url: "https://dnarentalcar.com",
    mainEntity: {
      "@type": "Organization",
      name: "Sedulous Group Ltd",
      url: "https://dnarentalcar.com",
      sameAs: [
        "https://twitter.com/dnarentalcar",
        "https://www.youtube.com/@dnarentalcar",
        "https://instagram.com/dnarentalcar",
        "https://threads.com/dnarentalcar",
      ],
    },
  }

  return (
    <>
      <main className="min-h-[100dvh] text-white">
        <SiteHeader />
        <Hero />
        <LogoMarquee />
        <CarListings />
        <FAQ />
        <AppverseFooter />
      </main>

      {/* JSON-LD structured data */}
      <Script
        id="page-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageStructuredData),
        }}
      />
    </>
  )
}
