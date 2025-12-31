"use client"

import { useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Shield, FileText, AlertCircle } from "lucide-react"

export default function GDPRPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">GDPR & Data Protection</h1>
          <div className="w-24 h-1 bg-red-600 mx-auto"></div>
        </div>

        {/* Information Collection */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-white">THE INFORMATION THAT WE COLLECT</h2>
          </div>
          <p className="text-xl font-semibold text-white mb-2">General Data Protection Regulations (HR)</p>
          <p className="text-xl font-semibold text-white">Data Protection</p>
        </Card>

        {/* How Information is Used */}
        <Card className="bg-zinc-900 border-zinc-800 p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-white">How will your information be used?</h2>
          </div>
          <p className="text-gray-300 mb-4">
            This notice applies to all applicants and (if the application is made by a limited company or
            partnership/unincorporated association) directors and partners.
          </p>
          <p className="text-gray-300 mb-4">
            We and/or our partners will use the details in this application for the following purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
            <li>Assess your creditworthiness and whether you can afford to take the product;</li>
            <li>Verify the accuracy of the data you have provided to us;</li>
            <li>Prevent criminal activity, fraud, and money laundering;</li>
            <li>Create and manage your account(s);</li>
            <li>Trace and recover debts; and</li>
            <li>Ensure any offers provided to you are appropriate to your circumstances.</li>
          </ul>
        </Card>

        {/* Declaration */}
        <Card className="bg-zinc-900 border-zinc-800 p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-white">Declaration</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <p>
              I hereby warrant that the information contained in this application is true and accurate and authorise all
              enquiries to verify the information to enable you to consider this application. I understand that the
              lender reserves the right to decline this application.
            </p>
            <p>
              I understand that I may be required to provide supplementary evidence to corroborate the information that
              I have provided (i.e., bank statements, proof of address, and/or photographic ID).
            </p>
            <p>
              You agree that if you break the terms of this agreement, we can pass your personal information to
              credit-reference agencies, debt collectors, the police, or any other relevant organisation. We can also
              give this information to the British Vehicle Rental and Leasing Association (BVRLA), which can share your
              personal information with its members to prevent crime and protect their assets, as allowed under the Data
              Protection Act.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
