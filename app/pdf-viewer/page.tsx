"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Download, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

function PDFViewerContent() {
  const searchParams = useSearchParams()
  const pdfUrl = searchParams.get("url")
  const [inputUrl, setInputUrl] = useState(pdfUrl || "")
  const [currentPdfUrl, setCurrentPdfUrl] = useState(pdfUrl || "")

  const handleLoadPDF = () => {
    if (!inputUrl.trim()) {
      toast.error("Please enter a PDF URL")
      return
    }
    setCurrentPdfUrl(inputUrl)
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-black/50 border-white/10 p-6 mb-4">
          <h1 className="text-2xl font-bold text-white mb-4">PDF Viewer</h1>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter PDF URL or Agreement ID"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="bg-white/5 border-white/20 text-white"
              onKeyPress={(e) => e.key === "Enter" && handleLoadPDF()}
            />
            <Button onClick={handleLoadPDF} className="bg-red-500 hover:bg-red-600">
              Load PDF
            </Button>
          </div>
        </Card>

        {currentPdfUrl && (
          <Card className="bg-black/50 border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">PDF Document</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(currentPdfUrl, "_blank")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = currentPdfUrl
                    link.download = "agreement.pdf"
                    link.click()
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <div className="w-full h-[calc(100vh-250px)] border border-white/10 rounded-lg overflow-hidden">
              <iframe
                src={currentPdfUrl}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </Card>
        )}

        {!currentPdfUrl && (
          <Card className="bg-black/50 border-white/10 p-6 text-center">
            <p className="text-white/60">Enter a PDF URL above to view the document</p>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function PDFViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
            <p className="text-white/70">Loading PDF viewer...</p>
          </div>
        </div>
      }
    >
      <PDFViewerContent />
    </Suspense>
  )
}

