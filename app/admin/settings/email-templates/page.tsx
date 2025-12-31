"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Mail, Eye } from "lucide-react"
import Link from "next/link"

export default function EmailTemplatesPage() {
  const templates = [
    { id: "booking-confirmation", name: "Booking Confirmation", subject: "Your Booking Confirmation" },
    { id: "payment-received", name: "Payment Received", subject: "Payment Confirmation" },
    { id: "agreement-ready", name: "Agreement Ready", subject: "Your Rental Agreement is Ready" },
    { id: "inspection-reminder", name: "Inspection Reminder", subject: "Vehicle Inspection Reminder" },
    { id: "return-reminder", name: "Return Reminder", subject: "Vehicle Return Reminder" },
  ]

  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id)
  const [emailContent, setEmailContent] = useState({
    subject: templates[0].subject,
    body: "Dear {{customer_name}},\n\nThank you for your booking...",
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Email Templates</h1>
          <p className="text-white/60 mt-1">Customize your email notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="liquid-glass border-white/10 p-4 lg:col-span-1">
          <h3 className="text-white font-semibold mb-4">Templates</h3>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedTemplate === template.id ? "bg-red-500 text-white" : "text-white/70 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{template.name}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="liquid-glass border-white/10 p-6 lg:col-span-3">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-white">
                Subject
              </Label>
              <Input
                id="subject"
                value={emailContent.subject}
                onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body" className="text-white">
                Email Body
              </Label>
              <Textarea
                id="body"
                value={emailContent.body}
                onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                className="bg-white/5 border-white/10 text-white min-h-[300px] font-mono"
              />
              <p className="text-xs text-white/40">
                Available variables: {"{{customer_name}}"}, {"{{booking_id}}"}, {"{{car_name}}"}, {"{{pickup_date}}"},{" "}
                {"{{total_amount}}"}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white">Save Template</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
