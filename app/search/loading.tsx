import { SiteHeader } from "@/components/site-header"
import { AppverseFooter } from "@/components/appverse-footer"
import { AnimatedGradient } from "@/components/animated-gradient"

export default function SearchLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedGradient />
      <SiteHeader />
      <main className="relative z-10">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            {/* Search header skeleton */}
            <div className="mb-12 text-center">
              <div className="h-10 w-64 mx-auto bg-white/10 rounded-lg animate-pulse mb-4" />
              <div className="h-6 w-48 mx-auto bg-white/10 rounded-lg animate-pulse" />
            </div>

            {/* Car cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-pulse"
                >
                  <div className="aspect-video bg-white/20 rounded-lg mb-4" />
                  <div className="h-6 bg-white/20 rounded mb-2" />
                  <div className="h-4 bg-white/20 rounded w-2/3 mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="h-8 bg-white/20 rounded flex-1" />
                    <div className="h-8 bg-white/20 rounded flex-1" />
                  </div>
                  <div className="h-10 bg-white/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <AppverseFooter />
    </div>
  )
}
