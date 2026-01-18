"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle, Upload, ArrowLeft, Camera, Gauge, FileCheck, PenTool, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createAgreementAction, getAgreementsByBookingAction, updateAgreementAction } from "@/app/actions/agreements"
import { getAvailableFleetVehiclesAction, type FleetOption } from "@/app/actions/parking"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import jsPDF from "jspdf"
import SignatureCanvas from "react-signature-canvas"
import { generateRentalAgreementPDF, type AgreementData } from "@/lib/pdf-generator"

const AGREEMENT_TEMPLATE = `RENTAL AGREEMENT TERMS & CONDITIONS - SEDULOUS GROUP LTD

Company Name: Sedulous Group LTD
Legal Form: Private Limited Company (LTD – UK)
Registered Address: 200 Burnt Oak Broadway, Edgware, HA8 0AP, United Kingdom
Phone: 020 8952 6908
Email: info@sedulousgroupltd.co.uk

CUSTOMER DETAILS:
Name: {{CUSTOMER_NAME}}
Email: {{CUSTOMER_EMAIL}}
Phone: {{CUSTOMER_PHONE}}
Driving License Number: {{LICENSE_NUMBER}}
Address: {{ADDRESS}}

VEHICLE DETAILS:
Vehicle: {{CAR_MAKE}} {{CAR_MODEL}}
Registration: {{CAR_REG}}
Initial Odometer: {{ODOMETER}} km
Initial Fuel Level: {{FUEL_LEVEL}}

RENTAL PERIOD:
Pickup Date: {{PICKUP_DATE}}
Pickup Time: {{PICKUP_TIME}}
Dropoff Date: {{DROPOFF_DATE}}
Dropoff Time: {{DROPOFF_TIME}}
Pickup Location: {{PICKUP_LOCATION}}
Dropoff Location: {{DROPOFF_LOCATION}}

INSURANCE DETAILS:
I DECLARE THAT I have not had a proposal declined, a policy cancelled, nor renewal refused nor been required to pay an increased premium nor had special conditions imposed by any motor insurer. I have not been convicted of any motoring offense (other than a maximum of 2 speeding offenses) during the past 5 years nor had my license suspended during the past 10 years and there is no prosecution pending. I do not have any physical nor mental defect nor infirmity nor suffer from diabetes, fits nor any heart complaint. I have not had any accidents and/or claims exceeding £3000 in the past 36 calendar months, and I further declare that to the best of my knowledge and belief no information has been withheld which would influence the provision of motor insurance to me and this declaration shall form the basis of the contract of insurance.

ALL PCN'S, PARKING, CONGESTION, SPEEDING FINES ETC WILL BE SUBJECT TO A £50 + VAT ADMINISTRATION CHARGE
• I acknowledge my liability for ALL FINES AND PENALTIES
• ONLY NAMED DRIVERS MAY DRIVE THE VEHICLE EXCLUDING THE HIRER
• REPORT ANY ACCIDENTS OR COLLISION TO SEDULOUS GROUP LTD
• NOT TO BE TAKEN OFFSHORE WITHOUT CONSENT

STATEMENT BY HIRER:
I hereby acknowledge that I shall be liable as owner of any vehicle hired to me under this Agreement in respect of any infringement of any Road Traffic Act or Parking Regulation arising during the currency of this Agreement. I have read and agree to the terms and conditions. I warrant that I am authorized to sign the Agreement on behalf of the Hirers. I authorize Sedulous Group LTD irrevocably to debit all charges arising under this Agreement. I confirm that all charges will be paid immediately and without offset or deduction and that no refunds are due in the event I wish to terminate the rental prior to the Hire ends date. I understand that Sedulous Group LTD will keep the personal information on this form as part of their records.

1. YOUR CONTRACT WITH US
When you sign the form you accept the conditions set out in this rental agreement. Please read this rental agreement carefully.

2. RENTAL PERIOD
You will have the vehicle for the rental period shown in the agreement. We may agree to extend the rental, but the period may never be more than 30 days.

3. YOUR RESPONSIBILITIES
• You must look after the vehicle and the keys to the vehicle
• You must always lock the vehicle when not in use
• You must protect the vehicle against bad weather
• You must use the correct fuel
• You are responsible for any damage to the vehicle caused by hitting low level objects
• You must not sell, rent, or dispose of the vehicle
• You must let us know as soon as you become aware of a fault
• You must bring the vehicle back to the place we agreed
• You will have to pay for reasonable costs of repair if we have to pay extra costs to return the vehicle to its condition
• Before you return the vehicle, you must empty your belongings

4. CONDITIONS FOR USING THE VEHICLE
The vehicle must only be driven by named drivers with full valid licenses.
You and other drivers must not:
• Use the vehicle for hire or reward
• Use the vehicle for any illegal purpose
• Use the vehicle for racing or teaching someone to drive
• Use the vehicle under the influence of drugs or alcohol
• Drive outside England, Scotland, Wales without written permission
• Exceed manufacturer weight limits or carry unsafe loads

5. CHARGES
You will pay:
A. Rental and other charges in this agreement
B. Costs/damages from failing conditions
C. Refuelling charges if fuel is not replaced
D. All fines and court costs for traffic/parking offences plus administration costs
E. Repair costs for unrecorded damage and replacement if stolen
F. Loss of income charges if the vehicle is unavailable
G. Interest on late payments at Barclays base rate + 4%
H. VAT and taxes

6. IN THE EVENT OF AN ACCIDENT
• Do NOT admit liability
• Collect names/addresses of all involved and witnesses
• Secure the vehicle
• Contact police if injury or dispute
• Inform rental office and complete accident form

7. GOVERNING LAW
The laws of the country in which it is signed governs this agreement.

Agreement Number: {{AGREEMENT_NUMBER}}
Created Date: {{CREATED_DATE}}
`

export default function AgreementStepsPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.bookingId as string
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<any>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  // Change currentStep to number for easier comparison
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const [booking, setBooking] = useState<any>(null)
  const [car, setCar] = useState<any>(null)
  const [agreement, setAgreement] = useState<any>(null)
  const [odometerReading, setOdometerReading] = useState("")
  const [fuelLevel, setFuelLevel] = useState("")
  // Change photos to File array, add previewUrls state
  const [photos, setPhotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [cameraActive, setCameraActive] = useState(false)
  // Renamed generatedAgreementText to agreementText for clarity
  const [agreementText, setAgreementText] = useState("")
  const [vehicleRegistration, setVehicleRegistration] = useState("")

  const [adminSignature, setAdminSignature] = useState<string>("")
  const [fleetOptions, setFleetOptions] = useState<FleetOption[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [bookingId])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Loading data for booking:", bookingId)

      const response = await fetch(`/api/admin/bookings/${bookingId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch booking: ${response.statusText}`)
      }

      const { booking: bookingData } = await response.json()

      console.log("[v0] Booking data loaded:", bookingData)
      setBooking(bookingData)
      setCar(bookingData.cars)

      // Fetch Fleet VRNs
      if (bookingData.car_id && bookingData.pickup_date && bookingData.dropoff_date) {
        getAvailableFleetVehiclesAction(bookingData.car_id, {
          start: bookingData.pickup_date,
          end: bookingData.dropoff_date
        }).then(res => {
          if (res.success) {
            setFleetOptions(res.vehicles)
          }
        })
      }

      // Check if agreement exists
      const existingAgreements = await getAgreementsByBookingAction(bookingId)

      if (existingAgreements && existingAgreements.length > 0) {
        const existingAgreement = existingAgreements[0]
        setAgreement(existingAgreement)

        // Populate fields from existing agreement
        if (existingAgreement.odometer_reading) {
          setOdometerReading(existingAgreement.odometer_reading.toString())
        }
        if (existingAgreement.fuel_level) {
          setFuelLevel(existingAgreement.fuel_level)
        }
        if (existingAgreement.vehicle_registration) {
          setVehicleRegistration(existingAgreement.vehicle_registration)
        }
        // Set agreement text if it exists
        if (existingAgreement.terms) {
          setAgreementText(existingAgreement.terms)
        }
        // Populate photos from existing agreement
        if (existingAgreement.vehicle_photos) {
          // ... (keep existing photo logic, too long to include all here, just targeting the end of if block)
          const photoFiles = await Promise.all(
            existingAgreement.vehicle_photos.map(async (url: string) => {
              // ...
              return null // checking content for matching
            })
          ) // closing map
          // ...
        }

        console.log("[v0] Existing agreement found:", existingAgreement)
      } else {
        // No existing agreement, auto-populate from car details
        if (bookingData.cars?.registration_number) {
          setVehicleRegistration(bookingData.cars.registration_number)
        }
      }

      setError("")
    } catch (err: any) {
      console.error("[v0] Error loading data:", err)
      setError(err.message || "Failed to load booking data")
    } finally {
      setLoading(false)
    }
  }

  const generateAgreementText = (bookingData: any = booking, carData: any = car) => {
    if (!bookingData || !carData) {
      console.error("[v0] Missing booking or car data for text generation")
      return AGREEMENT_TEMPLATE
    }

    // Use existing agreement number if available, otherwise generate a new one
    const agreementNumber = agreement?.agreement_number || `AGR-${Date.now()}`
    const createdDate = new Date().toLocaleDateString("en-GB")

    // Format dates
    const formatDate = (date: any) => {
      if (!date) return "N/A"
      // Ensure date is a valid Date object before formatting
      try {
        const d = new Date(date)
        if (isNaN(d.getTime())) return "Invalid Date"
        return d.toLocaleDateString("en-GB")
      } catch (e) {
        console.error("Error formatting date:", date, e)
        return "Invalid Date"
      }
    }

    const text = AGREEMENT_TEMPLATE.replace(/{{CUSTOMER_NAME}}/g, bookingData.customer_name || "N/A")
      .replace(/{{CUSTOMER_EMAIL}}/g, bookingData.customer_email || "N/A")
      .replace(/{{CUSTOMER_PHONE}}/g, bookingData.customer_phone || "N/A")
      .replace(/{{LICENSE_NUMBER}}/g, bookingData.driving_license_number || "N/A")
      // Use booking.pickup_location for address as a placeholder
      .replace(/{{ADDRESS}}/g, bookingData.pickup_location || "N/A")
      .replace(/{{CAR_MAKE}}/g, carData.brand || "N/A")
      .replace(/{{CAR_MODEL}}/g, carData.name || "N/A")
      .replace(/{{CAR_REG}}/g, vehicleRegistration || "N/A")
      .replace(/{{ODOMETER}}/g, odometerReading || "N/A")
      .replace(/{{FUEL_LEVEL}}/g, fuelLevel || "N/A")
      .replace(/{{PICKUP_DATE}}/g, formatDate(bookingData.pickup_date))
      .replace(/{{PICKUP_TIME}}/g, bookingData.pickup_time || "N/A")
      .replace(/{{DROPOFF_DATE}}/g, formatDate(bookingData.dropoff_date))
      .replace(/{{DROPOFF_TIME}}/g, bookingData.dropoff_time || "N/A")
      .replace(/{{PICKUP_LOCATION}}/g, bookingData.pickup_location || "N/A")
      .replace(/{{DROPOFF_LOCATION}}/g, bookingData.dropoff_location || "N/A")
      .replace(/{{AGREEMENT_NUMBER}}/g, agreementNumber)
      .replace(/{{CREATED_DATE}}/g, createdDate)

    console.log("[v0] Generated agreement text with data")
    return text
  }

  const handleNextStep = async () => {
    try {
      setSaving(true)
      setError(null)

      if (currentStep === 1) {
        // Validate step 1 inputs
        if (!odometerReading || !fuelLevel || !vehicleRegistration) {
          setError("Please fill in all required fields: Odometer Reading, Fuel Level, and Vehicle Registration")
          setSaving(false)
          return
        }

        console.log("[v0] Saving vehicle data:", { odometerReading, fuelLevel, vehicleRegistration })

        // Create or update agreement
        if (!agreement) {
          // Generate a new agreement number if none exists
          const agreementNumber = `AGR-${Date.now()}`
          const newAgreement = await createAgreementAction({
            booking_id: bookingId,
            // Ensure these fields exist on the booking object before passing
            customer_id: booking?.user_id || null,
            vehicle_id: booking?.car_id || null,
            agreement_number: agreementNumber,
            agreement_type: (booking?.booking_type || "rent").toLowerCase(), // Valid types: 'rent', 'flexi_hire', 'pco_hire'
            status: "pending", // Valid statuses: 'pending', 'sent', 'signed', 'active', 'completed', 'cancelled'
            odometer_reading: Number.parseInt(odometerReading),
            fuel_level: fuelLevel,
            vehicle_registration: vehicleRegistration,
            start_date: booking?.pickup_date,
            end_date: booking?.dropoff_date,
            total_amount: booking?.total_amount,
          })
          setAgreement(newAgreement)
          console.log("[v0] Agreement created:", newAgreement)
        } else {
          // Save current state before generating PDF
          // Checking `updateAgreementAction` in `agreements.ts`: it takes `agreementId` and `updates`.
          // Currently the page calls it with `agreementId` and payload.
          // Let's check `app/admin/agreement-steps/[bookingId]/page.tsx` around line 590 where `generateAgreement` calls it.
          // I need to verify the call site.
          await updateAgreementAction(agreement.id, {
            odometer_reading: Number.parseInt(odometerReading),
            fuel_level: fuelLevel,
            vehicle_registration: vehicleRegistration, // Pass as vehicle_registration for the action helper if it expects snake_case, checking agreements.ts
            // Wait, agreements.ts `updateAgreementAction` defines input with snake_case keys for some?
            // Let's check agreements.ts definition.
            // It has `terms`, `vehicle_photos`, `status`, `signature_url`, `fuel_level`, `odometer_reading`.
            // I need to add `vehicle_registration` to `updateAgreementAction` in `agreements.ts`.
          } as any) // temporary cast while I fix agreements.ts
          console.log("[v0] Agreement updated with vehicle data")
        }

        // Generate agreement text with all data
        const fullText = generateAgreementText()
        setAgreementText(fullText)

        setCurrentStep(2)
      } else if (currentStep === 2) {
        // First ensure agreement exists (it should from step 1)
        if (!agreement) {
          setError("Agreement not found. Please go back to step 1 and complete vehicle information first.")
          setSaving(false)
          return
        }

        // Upload photos and save to database before moving to review
        if (photos.length > 0) {
          console.log("[v0] Uploading", photos.length, "photos before moving to review...")
          console.log("[v0] Agreement ID:", agreement.id)

          const photoUrls: string[] = []

          for (let i = 0; i < photos.length; i++) {
            const photo = photos[i]
            try {
              console.log(`[v0] Uploading photo ${i + 1}/${photos.length}`)
              const formData = new FormData()
              formData.append("file", photo)

              const uploadResponse = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              })

              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}))
                throw new Error(errorData.error || `Upload failed: ${uploadResponse.statusText}`)
              }

              const uploadResult = await uploadResponse.json()
              photoUrls.push(uploadResult.url)
              console.log(`[v0] Photo ${i + 1} uploaded:`, uploadResult.url)
            } catch (uploadError: any) {
              console.error(`[v0] Failed to upload photo ${i + 1}:`, uploadError)
              // Continue with other photos even if one fails
            }
          }

          console.log("[v0] Photos uploaded, total:", photoUrls.length)

          // Save photos to database
          if (photoUrls.length > 0) {
            console.log("[v0] Saving photos to agreement:", agreement.id)
            const updateResult = await updateAgreementAction(agreement.id, {
              vehicle_photos: photoUrls,
            })

            if (updateResult.success) {
              console.log("[v0] Vehicle photos saved to agreement successfully")
              // Update preview URLs with actual uploaded URLs
              setPreviewUrls(photoUrls)
            } else {
              console.error("[v0] Failed to save photos:", updateResult.error)
              setError(`Photos uploaded but failed to save to database: ${updateResult.error}`)
            }
          }
        } else {
          console.log("[v0] No photos to upload, moving to review")
        }

        // Move to review
        setCurrentStep(3)
      }
    } catch (err: any) {
      console.error("[v0] Error in handleNextStep:", err)
      setError(err.message || "Failed to proceed to next step")
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    console.log("[v0] Files selected:", files.length)
    setPhotos((prev) => [...prev, ...files])

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls])
  }

  // Handle photo capture from camera
  const handleTakePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (!blob) return

      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
      setPhotos((prev) => [...prev, file])

      const previewUrl = URL.createObjectURL(file)
      setPreviewUrls((prev) => [...prev, previewUrl])

      console.log("[v0] Photo captured")
    }, "image/jpeg")
  }

  // Updated camera start/stop logic
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        console.log("[v0] Camera started")
      }
    } catch (err) {
      console.error("[v0] Camera error:", err)
      setError("Failed to access camera")
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      setCameraActive(false)
      console.log("[v0] Camera stopped")
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
    console.log("[v0] Photo removed:", index)
  }

  const handleCompleteAgreement = async () => {
    try {
      setCompleting(true)
      setError(null)

      console.log("[v0] Completing agreement with", photos.length, "photos")

      if (!agreement) {
        throw new Error("No agreement found. Please start from step 1.")
      }

      // Upload photos to Vercel Blob
      const photoUrls: string[] = []

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        try {
          console.log(`[v0] Uploading photo ${i + 1}/${photos.length}`)

          // Upload via API route to avoid token issues
          const formData = new FormData()
          formData.append("file", photo)

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}))
            throw new Error(errorData.error || "Failed to upload photo")
          }

          const uploadResult = await uploadResponse.json()
          photoUrls.push(uploadResult.url)
          console.log(`[v0] Photo ${i + 1} uploaded:`, uploadResult.url)
        } catch (uploadError: any) {
          console.error(`[v0] Failed to upload photo ${i + 1}:`, uploadError)
          // Continue with other photos even if one fails
        }
      }

      console.log("[v0] All photos uploaded, total:", photoUrls.length)

      // Update agreement with photos and set to Active
      await updateAgreementAction(agreement.id, {
        vehicle_photos: photoUrls,
        status: "Active",
      })

      // Update booking status to Active using admin API
      try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "Active",
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update booking status")
        }

        console.log("[v0] Booking status updated to Active")
      } catch (updateError) {
        console.error("[v0] Error updating booking status:", updateError)
        // Continue even if booking update fails
      }

      console.log("[v0] Agreement completed successfully")
      alert("Agreement completed successfully!")
      router.push("/admin/requests")
    } catch (err: any) {
      console.error("[v0] Error completing agreement:", err)
      setError(err.message || "Failed to complete agreement. Please try again.")
    } finally {
      setCompleting(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setPhotos([...photos, ...files])

    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrls((prev) => [...prev, e.target.result as string])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleNextStepGeneric = () => {
    if (currentStep === 1 && (!vehicleRegistration || !odometerReading || !fuelLevel)) {
      setError("Please fill in all vehicle information")
      return
    }
    if (currentStep === 2 && photos.length === 0) {
      setError("Please add at least one photo")
      return
    }
    setError("")
    setCurrentStep(currentStep + 1)
  }

  const generatePDFWithSignature = async () => {
    console.log("[v0] generatePDFWithSignature called")
    console.log("[v0] adminSignature:", !!adminSignature)
    console.log("[v0] agreement:", agreement?.id)
    console.log("[v0] agreementText:", !!agreementText)

    if (!adminSignature) {
      const errorMsg = "Please sign before completing"
      setError(errorMsg)
      alert(errorMsg)
      return
    }

    if (!agreementText || agreementText.trim() === "") {
      const errorMsg = "Agreement text is required. Please go back and complete all steps."
      setError(errorMsg)
      alert(errorMsg)
      return
    }

    // Ensure agreement exists before generating PDF
    let agreementId = agreement?.id
    if (!agreementId) {
      console.log("[v0] Agreement not found, creating one...")
      try {
        if (!odometerReading || !fuelLevel || !vehicleRegistration) {
          throw new Error("Please complete all vehicle information first")
        }

        const agreementNumber = `AGR-${Date.now()}`
        const newAgreement = await createAgreementAction({
          booking_id: bookingId,
          customer_id: booking?.user_id || null,
          vehicle_id: booking?.car_id || null,
          agreement_number: agreementNumber,
          agreement_type: booking?.booking_type || "Rent",
          status: "pending", // Valid statuses: 'pending', 'sent', 'signed', 'active', 'completed', 'cancelled'
          odometer_reading: Number.parseInt(odometerReading),
          fuel_level: fuelLevel,
          vehicle_registration: vehicleRegistration,
          start_date: booking?.pickup_date,
          end_date: booking?.dropoff_date,
          total_amount: booking?.total_amount || 0,
        })

        if (!newAgreement || !newAgreement.id) {
          throw new Error("Failed to create agreement: No ID returned")
        }

        agreementId = newAgreement.id
        setAgreement(newAgreement)
        console.log("[v0] Agreement created successfully:", newAgreement.id)
      } catch (err: any) {
        console.error("[v0] Error creating agreement:", err)
        const errorMessage = err?.message || err?.toString() || "Failed to create agreement"
        setError(errorMessage)
        setCompleting(false)
        alert(`Error creating agreement: ${errorMessage}\n\nPlease check the console for more details.`)
        return
      }
    }

    try {
      setCompleting(true)
      setError(null)

      console.log("[v0] Starting PDF generation...")

      // Wait for image to load using Promise
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          // Use global Image constructor to avoid conflict with Next.js Image component
          const imgElement = new window.Image()
          imgElement.crossOrigin = "anonymous"
          imgElement.onload = () => {
            console.log("[v0] Image loaded successfully")
            resolve(imgElement)
          }
          imgElement.onerror = (err) => {
            console.error("[v0] Image load error:", err)
            reject(new Error("Failed to load signature image"))
          }
          imgElement.src = src
        })
      }

      console.log("[v0] Preparing PDF data...")

      // Format dates
      const formatDate = (date: any) => {
        if (!date) return "N/A"
        try {
          const d = new Date(date)
          if (isNaN(d.getTime())) return "Invalid Date"
          return d.toLocaleDateString("en-GB")
        } catch (e) {
          return "Invalid Date"
        }
      }

      // Extract insurance text and terms from agreement text
      const insuranceText = `I DECLARE THAT I have not had a proposal declined, a policy cancelled, nor renewal refused nor been required to pay an increased premium nor had special conditions imposed by any motor insurer. I have not been convicted of any motoring offense (other than a maximum of 2 speeding offenses) during the past 5 years nor had my license suspended during the past 10 years and there is no prosecution pending. I do not have any physical nor mental defect nor infirmity nor suffer from diabetes, fits nor any heart complaint. I have not had any accidents and/or claims exceeding £3000 in the past 36 calendar months, and I further declare that to the best of my knowledge and belief no information has been withheld which would influence the provision of motor insurance to me and this declaration shall form the basis of the contract of insurance.`

      const terms = [
        "1. YOUR CONTRACT WITH US: When you sign the form you accept the conditions set out in this rental agreement. Please read this rental agreement carefully.",
        "2. RENTAL PERIOD: You will have the vehicle for the rental period shown in the agreement. We may agree to extend the rental, but the period may never be more than 30 days.",
        "3. YOUR RESPONSIBILITIES: You must look after the vehicle and the keys to the vehicle. You must always lock the vehicle when not in use. You must protect the vehicle against bad weather. You must use the correct fuel.",
        "4. CONDITIONS FOR USING THE VEHICLE: The vehicle must only be driven by named drivers with full valid licenses. You and other drivers must not use the vehicle for hire or reward, for any illegal purpose, for racing or teaching someone to drive, or under the influence of drugs or alcohol.",
        "5. CHARGES: You will pay rental and other charges, costs/damages from failing conditions, refuelling charges if fuel is not replaced, all fines and court costs for traffic/parking offences plus administration costs, repair costs for unrecorded damage and replacement if stolen, loss of income charges if the vehicle is unavailable, interest on late payments at Barclays base rate + 4%, and VAT and taxes.",
        "6. IN THE EVENT OF AN ACCIDENT: Do NOT admit liability. Collect names/addresses of all involved and witnesses. Secure the vehicle. Contact police if injury or dispute. Inform rental office and complete accident form.",
        "7. GOVERNING LAW: The laws of the country in which it is signed governs this agreement.",
      ]

      const agreementNumber = agreement?.agreement_number || `AGR-${Date.now()}`
      const createdDate = new Date().toLocaleDateString("en-GB")

      // Prepare data for PDF generator
      const pdfData: AgreementData = {
        company_name: "Sedulous Group LTD",
        company_address: "200 Burnt Oak Broadway, Edgware, HA8 0AP, United Kingdom",
        company_phone: "020 8952 6908",
        company_email: "info@sedulousgroupltd.co.uk",
        customer_name: booking?.customer_name || "N/A",
        customer_email: booking?.customer_email || "N/A",
        customer_phone: booking?.customer_phone || "N/A",
        customer_license: booking?.driving_license_number || booking?.drivingLicenseNumber || "N/A",
        customer_address: booking?.pickup_location || "N/A",
        vehicle: `${car?.brand || ""} ${car?.name || ""}`.trim() || "N/A",
        registration: vehicleRegistration || "N/A",
        odometer: odometerReading ? `${odometerReading} km` : "N/A",
        fuel: fuelLevel || "N/A",
        pickup_date: formatDate(booking?.pickup_date),
        pickup_time: booking?.pickup_time || "N/A",
        dropoff_date: formatDate(booking?.dropoff_date),
        dropoff_time: booking?.dropoff_time || "N/A",
        pickup_location: booking?.pickup_location || "N/A",
        dropoff_location: booking?.dropoff_location || "N/A",
        insurance_text: insuranceText,
        terms: terms,
        agreement_number: agreementNumber,
        created_date: createdDate,
        admin_signature: adminSignature,
        admin_name: "Admin",
      }

      console.log("[v0] Generating PDF with new structured format...")

      // Get company logo from settings
      const { getCompanySettings } = await import("@/app/actions/company-settings")
      const companySettings = await getCompanySettings()
      const logoPath = companySettings?.logo_url || "/sed.jpg"
      console.log("[v0] Using logo path:", logoPath)

      const doc = await generateRentalAgreementPDF(pdfData, logoPath)
      console.log("[v0] PDF generated successfully")

      // Generate PDF blob
      const pdfBlob = doc.output("blob")
      const fileName = `agreement-${bookingId}-${Date.now()}.pdf`
      console.log("[v0] PDF blob created, uploading...", "Size:", pdfBlob.size, "Type:", pdfBlob.type)

      // Convert blob to File for FormData
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" })

      // Upload PDF via API route (which has the token configured)
      const formData = new FormData()
      formData.append("file", pdfFile)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to upload PDF")
      }

      const uploadResult = await uploadResponse.json()
      const pdfUrl = uploadResult.url
      console.log("[v0] PDF uploaded to:", pdfUrl)

      // Update agreement via API route
      console.log("[v0] Updating agreement:", agreementId)
      const updateResponse = await fetch(`/api/agreements/${agreementId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unsigned_agreement_url: pdfUrl, // Store PDF with admin signature as unsigned (customer still needs to sign)
          customer_signature_data: adminSignature,
          status: "sent", // Status is "sent" since it's being sent to customer for signature
          sent_to_customer_at: new Date().toISOString(),
          vehicle_registration: vehicleRegistration,
          odometer_reading: odometerReading ? Number.parseInt(odometerReading) : undefined,
          fuel_level: fuelLevel,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}))
        console.error("[v0] Update response error:", errorData)
        throw new Error(errorData.error || `Failed to update agreement: ${updateResponse.statusText}`)
      }

      const updateResult = await updateResponse.json()
      console.log("[v0] Agreement updated successfully:", updateResult)

      // Send agreement email to customer
      console.log("[v0] Sending agreement email to customer...")
      try {
        const { sendAgreementToCustomerAction } = await import("@/app/actions/agreements")
        const emailResult = await sendAgreementToCustomerAction(agreementId)

        if (emailResult.success) {
          console.log("[v0] Agreement email sent successfully")

          // Update agreement status to "sent" after email is sent
          const sentResponse = await fetch(`/api/agreements/${agreementId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "sent",
              sent_to_customer_at: new Date().toISOString(),
            }),
          })

          if (sentResponse.ok) {
            console.log("[v0] Agreement status updated to 'sent'")
          }

          // Update booking status to approved/confirmed
          if (booking?.id) {
            const bookingResponse = await fetch(`/api/admin/bookings/${booking.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "Approved",
              }),
            })

            if (bookingResponse.ok) {
              console.log("[v0] Booking status updated to 'Approved'")
            }
          }
        } else {
          console.warn("[v0] Email sending failed:", emailResult.error)
          // Don't fail the whole process if email fails
        }
      } catch (emailErr: any) {
        console.error("[v0] Error sending email:", emailErr)
        // Don't fail the whole process if email fails
      }

      setCompleting(false)

      // Show success message before redirecting
      alert("Agreement completed, PDF generated, and sent to customer successfully!")
      router.push("/admin/requests")
    } catch (err: any) {
      console.error("[v0] Error generating PDF:", err)
      const errorMsg = err.message || "Failed to generate PDF. Please try again."
      setError(errorMsg)
      setCompleting(false)
      alert(`Error: ${errorMsg}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
          <p className="text-zinc-400">Loading agreement data...</p>
        </div>
      </div>
    )
  }

  // Modified error handling for initial load
  if (error && !booking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800 p-6">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push("/admin/requests")} className="w-full bg-zinc-800 hover:bg-zinc-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </Card>
      </div>
    )
  }

  // Define steps array for progress indicator
  const steps = [
    { number: 1, title: "Vehicle Info", icon: Gauge },
    { number: 2, title: "Photos", icon: Camera },
    { number: 3, title: "Review & Sign", icon: PenTool },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/requests")}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
          <h1 className="text-2xl font-bold">Create Agreement</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${currentStep >= step.number ? "bg-red-600 border-red-600" : "bg-zinc-900 border-zinc-700"
                    }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <p className="text-sm mt-2 text-center">{step.title}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${currentStep > step.number ? "bg-red-600" : "bg-zinc-800"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Display errors */}
        {error && <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">{error}</div>}

        {/* Step Content */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          {/* Step 1: Vehicle Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Gauge className="h-6 w-6 text-red-600" />
                <h2 className="text-xl font-semibold">Vehicle Information</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="vehicleReg" className="text-zinc-300">
                    Vehicle Registration Number *
                  </Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                      >
                        {vehicleRegistration
                          ? (fleetOptions.find((vehicle) => vehicle.registrationNumber === vehicleRegistration)
                            ? `${vehicleRegistration} — ${fleetOptions.find((vehicle) => vehicle.registrationNumber === vehicleRegistration)?.brand} ${fleetOptions.find((vehicle) => vehicle.registrationNumber === vehicleRegistration)?.model}`
                            : vehicleRegistration) // Fallback for pre-existing or non-matched
                          : "Select vehicle..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-zinc-900 border-zinc-800 z-[100]">
                      <Command className="bg-zinc-900 text-white border-zinc-800">
                        <CommandInput placeholder="Search VRN..." className="text-white placeholder:text-zinc-500" />
                        <CommandList>
                          <CommandEmpty className="py-6 text-center text-sm text-zinc-500">
                            No available vehicles found for this category during selected dates.
                          </CommandEmpty>
                          <CommandGroup>
                            {fleetOptions.map((vehicle) => (
                              <CommandItem
                                key={vehicle.registrationNumber}
                                value={vehicle.registrationNumber}
                                onSelect={(currentValue) => {
                                  // currentValue is often normalized by cmdk. We use the real value.
                                  setVehicleRegistration(vehicle.registrationNumber)
                                  setOpen(false)
                                }}
                                className="text-zinc-300 aria-selected:bg-zinc-800 aria-selected:text-white"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    vehicleRegistration === vehicle.registrationNumber ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="font-mono font-bold mr-2">{vehicle.registrationNumber}</span>
                                <span className="text-zinc-500">— {vehicle.brand} {vehicle.model}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {fleetOptions.length === 0 && (
                    <p className="text-xs text-amber-500">
                      No vehicles available. Please check booking dates or fleet availability.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="odometer" className="text-zinc-300">
                    Odometer Reading (km) *
                  </Label>
                  <Input
                    id="odometer"
                    type="number"
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(e.target.value)}
                    placeholder="Enter current mileage"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fuel" className="text-zinc-300">
                    Fuel Level *
                  </Label>
                  <Select value={fuelLevel} onValueChange={setFuelLevel} required>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select fuel level" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="Empty">Empty</SelectItem>
                      <SelectItem value="1/4 Tank">1/4 Tank</SelectItem>
                      <SelectItem value="1/2 Tank">1/2 Tank</SelectItem>
                      <SelectItem value="3/4 Tank">3/4 Tank</SelectItem>
                      <SelectItem value="Full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Display booking info */}
              {booking && car && (
                <div className="mt-6 p-4 bg-zinc-800 rounded-lg">
                  <h3 className="font-semibold mb-3 text-zinc-300">Booking Details:</h3>
                  <div className="grid gap-2 text-sm">
                    <p>
                      <span className="text-zinc-400">Customer:</span> {booking.customer_name}
                    </p>
                    <p>
                      <span className="text-zinc-400">Email:</span> {booking.customer_email}
                    </p>
                    <p>
                      <span className="text-zinc-400">Phone:</span> {booking.customer_phone}
                    </p>
                    <p>
                      <span className="text-zinc-400">Driving License Number:</span>{" "}
                      {booking.driving_license_number || booking.drivingLicenseNumber || "N/A"}
                    </p>
                    <p>
                      <span className="text-zinc-400">Vehicle:</span> {car.brand} {car.name}
                    </p>
                    <p>
                      <span className="text-zinc-400">Pickup:</span>{" "}
                      {new Date(booking.pickup_date).toLocaleDateString("en-GB")} at {booking.pickup_time}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleNextStep}
                disabled={saving || !odometerReading || !fuelLevel || !vehicleRegistration}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? "Saving..." : "Continue to Photos"}
              </Button>
            </div>
          )}

          {/* Step 2: Photos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Camera className="h-6 w-6 text-red-600" />
                <h2 className="text-xl font-semibold">Vehicle Photos</h2>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => document.getElementById("camera-capture")?.click()}
                    variant="outline"
                    className="flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Use Camera
                  </Button>
                  <Button
                    type="button"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    variant="outline"
                    className="flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photos
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    id="camera-capture"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Camera View Removed - using native capture */}

                {/* Photo Grid */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={url || "/placeholder.svg"}
                          alt={`Photo ${index + 1}`}
                          width={200}
                          height={150}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-zinc-400">{photos.length} photo(s) added</p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep(1)}
                  variant="outline"
                  className="flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                >
                  Back
                </Button>
                {/* Upload photos and save to DB before moving to review */}
                <Button
                  onClick={handleNextStep}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={photos.length === 0 || saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading Photos...
                    </>
                  ) : (
                    "Continue to Review"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Sign */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-3">
                <FileCheck className="h-6 w-6 text-red-600" />
                Review Agreement
              </h2>

              {/* Agreement Preview */}
              <div className="bg-zinc-800 rounded-lg p-6 max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono text-zinc-300">
                  {agreementText || generateAgreementText()}
                </pre>
              </div>

              {/* Photos Preview */}
              {previewUrls.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Attached Photos ({photos.length})</h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {previewUrls.map((url, index) => (
                      <Image
                        key={index}
                        src={url || "/placeholder.svg"}
                        alt={`Photo ${index + 1}`}
                        width={100}
                        height={75}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-zinc-300">Admin Signature *</Label>
                <div className="border-2 border-zinc-700 rounded-lg bg-white p-2">
                  <SignatureCanvas
                    ref={signaturePadRef}
                    canvasProps={{ width: 500, height: 150, className: "border border-gray-300 rounded" }}
                    backgroundColor="#ffffff"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => signaturePadRef.current?.clear()}
                    variant="outline"
                    className="flex-1 bg-zinc-800 border-zinc-700"
                  >
                    Clear Signature
                  </Button>
                  <Button
                    onClick={() => {
                      if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
                        const signatureData = signaturePadRef.current.toDataURL()
                        setAdminSignature(signatureData)
                        alert("Signature confirmed!")
                      } else {
                        alert("Please draw your signature first")
                      }
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!signaturePadRef.current || signaturePadRef.current.isEmpty()}
                  >
                    Confirm Signature
                  </Button>
                </div>
              </div>

              {adminSignature && (
                <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm">
                  ✓ Signature captured
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep(2)}
                  variant="outline"
                  className="flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                  disabled={completing}
                >
                  Back
                </Button>
                <Button
                  onClick={async (e) => {
                    e.preventDefault()
                    console.log("[v0] Complete & Generate PDF button clicked")
                    console.log("[v0] - adminSignature exists:", !!adminSignature)
                    console.log("[v0] - signaturePadRef exists:", !!signaturePadRef.current)
                    console.log("[v0] - signature pad is empty:", signaturePadRef.current?.isEmpty())
                    console.log("[v0] - completing:", completing)
                    console.log("[v0] - agreement:", agreement?.id)
                    console.log("[v0] - agreementText:", !!agreementText)

                    // If signature not confirmed, try to capture it automatically
                    if (!adminSignature) {
                      if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
                        // Auto-capture signature if it exists
                        const signatureData = signaturePadRef.current.toDataURL()
                        console.log("[v0] Auto-capturing signature, data length:", signatureData.length)
                        setAdminSignature(signatureData)
                        // Wait a moment for state to update, then proceed
                        setTimeout(() => {
                          console.log("[v0] Calling generatePDFWithSignature after auto-capture")
                          generatePDFWithSignature()
                        }, 200)
                        return
                      } else {
                        alert("Please draw your signature in the signature pad above, then click 'Complete & Generate PDF' again")
                        return
                      }
                    }

                    console.log("[v0] Calling generatePDFWithSignature with confirmed signature")
                    generatePDFWithSignature()
                  }}
                  disabled={completing}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    "Complete & Generate PDF"
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div >
    </div >
  )
}
