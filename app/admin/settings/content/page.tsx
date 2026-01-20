"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getContentSettings, updateContentSettings } from "@/app/actions/settings"

export default function ContentManagementPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [settings, setSettings] = useState({
        // Static pages
        aboutUsContent: "",
        privacyPolicyContent: "",
        gdprContent: "",
        rentalAgreementContent: "",
        termsConditionsContent: "",
        // Footer contact
        companyName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        postcode: "",
        phone: "",
        email: "",
        // Opening hours
        hoursWeekday: "",
        hoursSaturday: "",
        hoursSunday: "",
        // Regulatory
        companyNumber: "",
        fcaNumber: "",
        icoRegistered: true,
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setIsLoading(true)
        try {
            const data = await getContentSettings()
            setSettings({
                aboutUsContent: data.about_us_content || "Welcome to Sedulous Group Ltd. We provide premium car rental services.",
                privacyPolicyContent: data.privacy_policy_content || "Your privacy is important to us.",
                gdprContent: data.gdpr_content || "We comply with GDPR regulations.",
                rentalAgreementContent: data.rental_agreement_content || "Standard rental agreement terms.",
                termsConditionsContent: data.terms_conditions_content || "Terms and conditions of service.",
                companyName: data.company_name || "Sedulous Group LTD",
                addressLine1: data.address_line1 || "Unit 5, 100 Colindeep Lane",
                addressLine2: data.address_line2 || "",
                city: data.city || "London",
                postcode: data.postcode || "NW9 6HB",
                phone: data.phone || "020 3355 2561",
                email: data.email || "info@sedulousgroupltd.co.uk",
                hoursWeekday: data.hours_weekday || "10:00 – 17:30",
                hoursSaturday: data.hours_saturday || "10:00 – 14:00",
                hoursSunday: data.hours_sunday || "Closed",
                companyNumber: data.company_number || "13272612",
                fcaNumber: data.fca_number || "964621",
                icoRegistered: data.ico_registered !== false,
            })
        } catch (error) {
            console.error("Error loading content settings:", error)
            toast.error("Failed to load content settings")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await updateContentSettings({
                about_us_content: settings.aboutUsContent,
                privacy_policy_content: settings.privacyPolicyContent,
                gdpr_content: settings.gdprContent,
                rental_agreement_content: settings.rentalAgreementContent,
                terms_conditions_content: settings.termsConditionsContent,
                company_name: settings.companyName,
                address_line1: settings.addressLine1,
                address_line2: settings.addressLine2,
                city: settings.city,
                postcode: settings.postcode,
                phone: settings.phone,
                email: settings.email,
                hours_weekday: settings.hoursWeekday,
                hours_saturday: settings.hoursSaturday,
                hours_sunday: settings.hoursSunday,
                company_number: settings.companyNumber,
                fca_number: settings.fcaNumber,
                ico_registered: settings.icoRegistered,
            })

            if (result.success) {
                toast.success("Content settings saved successfully")
            } else {
                const errorMsg = result.error || "Failed to save content settings"
                toast.error(errorMsg, {
                    action: errorMsg.includes("table does not exist") ? {
                        label: "Setup Database",
                        onClick: () => window.location.href = "/admin/settings/setup"
                    } : undefined
                })
            }
        } catch (error) {
            console.error("Error saving content settings:", error)
            toast.error("Failed to save content settings")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black p-3 md:p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
                    <p className="text-white/60">Loading content settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/settings">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Content Management</h1>
                    <p className="text-white/60 mt-1">Edit static pages and footer information</p>
                </div>
            </div>

            <Tabs defaultValue="pages" className="w-full">
                <TabsList className="liquid-glass border-white/10">
                    <TabsTrigger value="pages">Static Pages</TabsTrigger>
                    <TabsTrigger value="footer">Footer Info</TabsTrigger>
                </TabsList>

                <TabsContent value="pages" className="space-y-6 mt-6">
                    <Card className="liquid-glass border-white/10 p-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="aboutUs" className="text-white text-lg font-semibold">
                                    About Us
                                </Label>
                                <Textarea
                                    id="aboutUs"
                                    value={settings.aboutUsContent}
                                    onChange={(e) => setSettings({ ...settings, aboutUsContent: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white min-h-[200px]"
                                    placeholder="Enter About Us page content..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="privacy" className="text-white text-lg font-semibold">
                                    Privacy Policy
                                </Label>
                                <Textarea
                                    id="privacy"
                                    value={settings.privacyPolicyContent}
                                    onChange={(e) => setSettings({ ...settings, privacyPolicyContent: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white min-h-[200px]"
                                    placeholder="Enter Privacy Policy content..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gdpr" className="text-white text-lg font-semibold">
                                    GDPR
                                </Label>
                                <Textarea
                                    id="gdpr"
                                    value={settings.gdprContent}
                                    onChange={(e) => setSettings({ ...settings, gdprContent: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white min-h-[200px]"
                                    placeholder="Enter GDPR content..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rental" className="text-white text-lg font-semibold">
                                    Rental Agreement
                                </Label>
                                <Textarea
                                    id="rental"
                                    value={settings.rentalAgreementContent}
                                    onChange={(e) => setSettings({ ...settings, rentalAgreementContent: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white min-h-[200px]"
                                    placeholder="Enter Rental Agreement content..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="terms" className="text-white text-lg font-semibold">
                                    Terms & Conditions
                                </Label>
                                <Textarea
                                    id="terms"
                                    value={settings.termsConditionsContent}
                                    onChange={(e) => setSettings({ ...settings, termsConditionsContent: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white min-h-[200px]"
                                    placeholder="Enter Terms & Conditions content..."
                                />
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="footer" className="space-y-6 mt-6">
                    <Card className="liquid-glass border-white/10 p-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-white font-semibold mb-4 text-lg">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName" className="text-white">
                                            Company Name
                                        </Label>
                                        <Input
                                            id="companyName"
                                            value={settings.companyName}
                                            onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-white">
                                            Phone
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={settings.phone}
                                            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
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
                                            value={settings.email}
                                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="addressLine1" className="text-white">
                                            Address Line 1
                                        </Label>
                                        <Input
                                            id="addressLine1"
                                            value={settings.addressLine1}
                                            onChange={(e) => setSettings({ ...settings, addressLine1: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="addressLine2" className="text-white">
                                            Address Line 2
                                        </Label>
                                        <Input
                                            id="addressLine2"
                                            value={settings.addressLine2}
                                            onChange={(e) => setSettings({ ...settings, addressLine2: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-white">
                                            City
                                        </Label>
                                        <Input
                                            id="city"
                                            value={settings.city}
                                            onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="postcode" className="text-white">
                                            Postcode
                                        </Label>
                                        <Input
                                            id="postcode"
                                            value={settings.postcode}
                                            onChange={(e) => setSettings({ ...settings, postcode: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-white font-semibold mb-4 text-lg">Opening Hours</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hoursWeekday" className="text-white">
                                            Monday – Friday
                                        </Label>
                                        <Input
                                            id="hoursWeekday"
                                            value={settings.hoursWeekday}
                                            onChange={(e) => setSettings({ ...settings, hoursWeekday: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                            placeholder="10:00 – 17:30"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="hoursSaturday" className="text-white">
                                            Saturday
                                        </Label>
                                        <Input
                                            id="hoursSaturday"
                                            value={settings.hoursSaturday}
                                            onChange={(e) => setSettings({ ...settings, hoursSaturday: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                            placeholder="10:00 – 14:00"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="hoursSunday" className="text-white">
                                            Sunday
                                        </Label>
                                        <Input
                                            id="hoursSunday"
                                            value={settings.hoursSunday}
                                            onChange={(e) => setSettings({ ...settings, hoursSunday: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                            placeholder="Closed"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-white font-semibold mb-4 text-lg">Regulatory Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyNumber" className="text-white">
                                            Company Number
                                        </Label>
                                        <Input
                                            id="companyNumber"
                                            value={settings.companyNumber}
                                            onChange={(e) => setSettings({ ...settings, companyNumber: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fcaNumber" className="text-white">
                                            FCA Number
                                        </Label>
                                        <Input
                                            id="fcaNumber"
                                            value={settings.fcaNumber}
                                            onChange={(e) => setSettings({ ...settings, fcaNumber: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between md:col-span-2">
                                        <div>
                                            <Label className="text-white font-medium">ICO Registered</Label>
                                            <p className="text-sm text-white/60">Information Commissioner's Office registration</p>
                                        </div>
                                        <Switch
                                            checked={settings.icoRegistered}
                                            onCheckedChange={(checked) => setSettings({ ...settings, icoRegistered: checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-red-500 hover:bg-red-600 text-white"
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
    )
}
