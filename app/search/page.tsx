import { Suspense } from "react"
import { SearchResults } from "@/components/search-results"
import { SiteHeader } from "@/components/site-header"
import { AppverseFooter } from "@/components/appverse-footer"
import { AnimatedGradient } from "@/components/animated-gradient"

export default function SearchPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedGradient />
      <SiteHeader />
      <main className="relative z-10">
        <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center text-white">Loading...</div>}>
          <SearchResults />
        </Suspense>
      </main>
      <AppverseFooter />
    </div>
  )
}
