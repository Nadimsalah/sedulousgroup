"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"

export default function CompanySettingsPage() {
  const [company, setCompany] = useState({
    name: "Sedulous Group Ltd",
    email: "info@sedulousgroup.net",
    phone: "+44 20 1234 5678",
    address: "123 Business Street, London",
    postcode: "SW1A 1AA",
    vatNumber: "GB123456789",
    companyNumber: "12345678",
    description: "Premium car rental services in London",
    logo: "/images/dna-group-logo.png",
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
          <h1 className="text-3xl font-bold text-white">Company Profile</h1>
          <p className="text-white/60 mt-1">Manage your company information</p>
        </div>
      </div>

      <Card className="liquid-glass border-white/10 p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-white">Company Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                {company.logo ? (
                  <img
                    src={company.logo || "/placeholder.svg"}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-white/40" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
                <p className="text-xs text-white/60">PNG or JPG, max 5MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Company Name
              </Label>
              <Input
                id="name"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                Phone
              </Label>
              <Input
                id="phone"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postcode" className="text-white">
                Postcode
              </Label>
              <Input
                id="postcode"
                value={company.postcode}
                onChange={(e) => setCompany({ ...company, postcode: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-white">
                Address
              </Label>
              <Input
                id="address"
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatNumber" className="text-white">
                VAT Number
              </Label>
              <Input
                id="vatNumber"
                value={company.vatNumber}
                onChange={(e) => setCompany({ ...company, vatNumber: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyNumber" className="text-white">
                Company Number
              </Label>
              <Input
                id="companyNumber"
                value={company.companyNumber}
                onChange={(e) => setCompany({ ...company, companyNumber: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-white">
                Description
              </Label>
              <Textarea
                id="description"
                value={company.description}
                onChange={(e) => setCompany({ ...company, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
