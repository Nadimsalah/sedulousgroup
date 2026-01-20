"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Upload, CheckCircle2, AlertCircle, X, FileText,
  Camera, CreditCard, Home, Calendar, Loader2, Eye
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"

// Document requirements by booking type
const BOOKING_REQUIREMENTS = {
  Rent: {
    title: "Rent",
    color: "green",
    documents: [
      { id: "licenseFront", label: "Driving Licence (Front)", required: true, icon: CreditCard },
      { id: "licenseBack", label: "Driving Licence (Back)", required: true, icon: CreditCard },
      {
        id: "proofOfAddress", label: "Proof of Address", required: true, icon: Home,
        helperText: "Bank statement OR official letter, issued within 3 months", needsIssueDate: true
      },
    ],
    needsNI: true,
    needsBankStatement: false,
    needsPrivateHireLicense: false,
  },
  "Flexi Hire": {
    title: "Flexi Hire",
    color: "blue",
    documents: [
      { id: "licenseFront", label: "Driving Licence (Front)", required: true, icon: CreditCard },
      { id: "licenseBack", label: "Driving Licence (Back)", required: true, icon: CreditCard },
      {
        id: "bankStatement", label: "Bank Statement (Proof of Affordability)", required: true, icon: FileText,
        helperText: "Bank statement issued within the last 3 months", needsIssueDate: true
      },
      {
        id: "proofOfAddress", label: "Proof of Address (NOT Bank Statement)", required: true, icon: Home,
        helperText: "Utility bill, council tax, government letter, tenancy agreement - issued within 3 months",
        needsIssueDate: true, needsDocType: true
      },
    ],
    needsNI: true,
    needsBankStatement: true,
    needsPrivateHireLicense: false,
  },
  "PCO Hire": {
    title: "PCO Hire",
    color: "purple",
    documents: [
      { id: "licenseFront", label: "Driving Licence (Front)", required: true, icon: CreditCard },
      { id: "licenseBack", label: "Driving Licence (Back)", required: true, icon: CreditCard },
      { id: "privateHireLicenseFront", label: "Private Hire Licence (Front)", required: true, icon: Camera },
      { id: "privateHireLicenseBack", label: "Private Hire Licence (Back)", required: true, icon: Camera },
      {
        id: "bankStatement", label: "Bank Statement (Proof of Affordability)", required: true, icon: FileText,
        helperText: "Bank statement issued within the last 3 months", needsIssueDate: true
      },
      {
        id: "proofOfAddress", label: "Proof of Address (NOT Bank Statement)", required: true, icon: Home,
        helperText: "Utility bill, council tax, government letter, tenancy agreement - issued within 3 months",
        needsIssueDate: true, needsDocType: true
      },
    ],
    needsNI: true,
    needsBankStatement: true,
    needsPrivateHireLicense: true,
  },
} as const

const PROOF_OF_ADDRESS_TYPES = [
  { value: "utility_bill", label: "Utility Bill" },
  { value: "council_tax", label: "Council Tax Statement" },
  { value: "government_letter", label: "Government Letter" },
  { value: "tenancy_agreement", label: "Tenancy Agreement" },
  { value: "other_official", label: "Other Official Letter" },
  { value: "bank_statement", label: "Bank Statement" },
]

interface DocumentUploadState {
  file: File | null
  url: string
  uploading: boolean
  error: string | null
  issueDate: string
  docType: string
}

interface RequiredDocumentsProps {
  bookingType: "Rent" | "Flexi Hire" | "PCO Hire"
  bookingDate: string // The pickup date for validating 3-month rule
  onComplete: (isComplete: boolean, data: DocumentData) => void
  savedDocuments?: Record<string, string> // Pre-uploaded URLs from user profile
}

export interface DocumentData {
  niNumber: string
  drivingLicenseNumber: string
  documents: {
    licenseFront: { url: string }
    licenseBack: { url: string }
    proofOfAddress: { url: string; issueDate?: string; docType?: string }
    bankStatement?: { url: string; issueDate?: string }
    privateHireLicenseFront?: { url: string }
    privateHireLicenseBack?: { url: string }
  }
}

const createEmptyDocState = (): DocumentUploadState => ({
  file: null,
  url: "",
  uploading: false,
  error: null,
  issueDate: "",
  docType: "",
})

export function RequiredDocuments({
  bookingType,
  bookingDate,
  onComplete,
  savedDocuments = {}
}: RequiredDocumentsProps) {
  const requirements = BOOKING_REQUIREMENTS[bookingType] || BOOKING_REQUIREMENTS.Rent
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [niNumber, setNiNumber] = useState("")
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("")
  const [documents, setDocuments] = useState<Record<string, DocumentUploadState>>(() => {
    // Initialize state immediately
    const initial: Record<string, DocumentUploadState> = {}
    requirements.documents.forEach((doc) => {
      initial[doc.id] = {
        ...createEmptyDocState(),
        url: savedDocuments[doc.id] || "",
      }
    })
    return initial
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Re-initialize when booking type changes
  useEffect(() => {
    const newDocs: Record<string, DocumentUploadState> = {}
    requirements.documents.forEach((doc) => {
      newDocs[doc.id] = documents[doc.id] || {
        ...createEmptyDocState(),
        url: savedDocuments[doc.id] || "",
      }
    })
    setDocuments(newDocs)
  }, [bookingType])

  const isWithin3Months = (issueDate: string, bookingDateStr: string): boolean => {
    if (!issueDate || !bookingDateStr) return false

    const issue = new Date(issueDate)
    const booking = new Date(bookingDateStr)
    const threeMonthsAgo = new Date(booking)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    return issue >= threeMonthsAgo && issue <= booking
  }

  const validateCompletion = (): boolean => {
    // Check Driving License Number
    if (!drivingLicenseNumber.trim()) {
      return false
    }

    // Check NI number
    if (requirements.needsNI && !niNumber.trim()) {
      return false
    }

    // Check all required documents
    for (const doc of requirements.documents) {
      if (!doc.required) continue

      const docState = documents[doc.id]
      if (!docState?.url) return false

      // Check issue date for documents that need it
      if ((doc as any).needsIssueDate && !docState.issueDate) {
        return false
      }

      // Validate 3-month rule
      if ((doc as any).needsIssueDate && docState.issueDate) {
        if (!isWithin3Months(docState.issueDate, bookingDate)) {
          return false
        }
      }

      // Check doc type for proof of address
      if ((doc as any).needsDocType) {
        if (!docState.docType) return false
        // Block bank statement as proof of address for Flexi/PCO
        if (docState.docType === "bank_statement" && (bookingType === "Flexi Hire" || bookingType === "PCO Hire")) {
          return false
        }
      }
    }

    return true
  }

  const getDocumentData = (): DocumentData => {
    const data: DocumentData = {
      niNumber,
      drivingLicenseNumber,
      documents: {
        licenseFront: { url: documents.licenseFront?.url || "" },
        licenseBack: { url: documents.licenseBack?.url || "" },
        proofOfAddress: {
          url: documents.proofOfAddress?.url || "",
          issueDate: documents.proofOfAddress?.issueDate,
          docType: documents.proofOfAddress?.docType,
        },
      },
    }

    if (requirements.needsBankStatement) {
      data.documents.bankStatement = {
        url: documents.bankStatement?.url || "",
        issueDate: documents.bankStatement?.issueDate,
      }
    }

    if (requirements.needsPrivateHireLicense) {
      data.documents.privateHireLicenseFront = { url: documents.privateHireLicenseFront?.url || "" }
      data.documents.privateHireLicenseBack = { url: documents.privateHireLicenseBack?.url || "" }
    }

    return data
  }

  // Notify parent of completion status
  useEffect(() => {
    const isComplete = validateCompletion()
    onComplete(isComplete, getDocumentData())
  }, [niNumber, drivingLicenseNumber, documents, bookingDate, bookingType])

  const handleUploadClick = (docId: string) => {
    const input = fileInputRefs.current[docId]
    if (input) {
      input.click()
    }
  }

  const handleFileChange = async (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset input value to allow re-uploading same file
    event.target.value = ''

    console.log("[Documents] File selected:", file.name, file.type, file.size)

    // Validate file size
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setDocuments((prev) => ({
        ...prev,
        [docId]: {
          ...(prev[docId] || createEmptyDocState()),
          error: "File size exceeds 10MB limit"
        },
      }))
      return
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"]
    const fileExtension = file.name.toLowerCase().split('.').pop() || ""
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif", "pdf"]

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setDocuments((prev) => ({
        ...prev,
        [docId]: {
          ...(prev[docId] || createEmptyDocState()),
          error: "Invalid file type. Please upload JPEG, PNG, WEBP, HEIC, or PDF."
        },
      }))
      return
    }

    // Start upload
    setDocuments((prev) => ({
      ...prev,
      [docId]: {
        ...(prev[docId] || createEmptyDocState()),
        file,
        uploading: true,
        error: null
      },
    }))

    try {
      console.log("[Documents] Starting upload for:", docId)

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("[Documents] Upload response:", response.status, data)

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      if (!data.url) {
        throw new Error("No URL returned from upload")
      }

      setDocuments((prev) => ({
        ...prev,
        [docId]: {
          ...(prev[docId] || createEmptyDocState()),
          file,
          url: data.url,
          uploading: false,
          error: null,
        },
      }))

      console.log("[Documents] Upload successful:", docId, data.url)
    } catch (error) {
      console.error("[Documents] Upload error:", error)
      setDocuments((prev) => ({
        ...prev,
        [docId]: {
          ...(prev[docId] || createEmptyDocState()),
          uploading: false,
          error: error instanceof Error ? error.message : "Upload failed. Please try again.",
        },
      }))
    }
  }

  const handleRemoveFile = (docId: string) => {
    setDocuments((prev) => ({
      ...prev,
      [docId]: createEmptyDocState(),
    }))
  }

  const handleIssueDateChange = (docId: string, date: string) => {
    setDocuments((prev) => ({
      ...prev,
      [docId]: { ...(prev[docId] || createEmptyDocState()), issueDate: date },
    }))
  }

  const handleDocTypeChange = (docId: string, docType: string) => {
    setDocuments((prev) => ({
      ...prev,
      [docId]: { ...(prev[docId] || createEmptyDocState()), docType },
    }))
  }

  const completedCount = requirements.documents.filter((doc) => {
    const docState = documents[doc.id]
    if (!docState?.url) return false
    if ((doc as any).needsIssueDate && !docState.issueDate) return false
    if ((doc as any).needsDocType && !docState.docType) return false
    return true
  }).length + (niNumber.trim() ? 1 : 0)

  const totalRequired = requirements.documents.length + (requirements.needsNI ? 1 : 0)

  const colorClasses = {
    green: "border-green-500/30 bg-green-500/10",
    blue: "border-blue-500/30 bg-blue-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
  }

  return (
    <Card className="border border-zinc-800 bg-zinc-900 p-6">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-500" />
            Required Documents
          </CardTitle>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${completedCount === totalRequired
            ? "bg-green-500/20 text-green-400"
            : "bg-yellow-500/20 text-yellow-400"
            }`}>
            {completedCount}/{totalRequired} Complete
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Upload all required documents to complete your {requirements.title} booking
        </p>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* Requirements Info Box */}
        <div className={`rounded-lg p-4 ${colorClasses[requirements.color as keyof typeof colorClasses]}`}>
          <h4 className={`font-semibold mb-2 text-${requirements.color}-400`}>
            {requirements.title} Requirements
          </h4>
          <ul className={`text-sm text-${requirements.color}-300 space-y-1 list-disc list-inside`}>
            <li>Driving licence (front and back photos)</li>
            {requirements.needsPrivateHireLicense && (
              <li>Private hire licence (front and back photos)</li>
            )}
            <li>National Insurance (NI) number</li>
            {requirements.needsBankStatement && (
              <li>Bank statement (proof of affordability - max 3 months old)</li>
            )}
            <li>
              {bookingType === "Rent"
                ? "Proof of address (bank statement or official letter - max 3 months old)"
                : "Proof of address - NOT bank statement (max 3 months old)"}
            </li>
          </ul>
        </div>

        {/* Driving License Number Input */}
        <div>
          <Label htmlFor="drivingLicenseNumber" className="text-gray-300 flex items-center gap-2">
            Driving Licence Number *
            {drivingLicenseNumber.trim() && (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            )}
          </Label>
          <Input
            id="drivingLicenseNumber"
            value={drivingLicenseNumber}
            onChange={(e) => setDrivingLicenseNumber(e.target.value.toUpperCase())}
            className="mt-2 border-zinc-700 bg-zinc-800 text-white placeholder:text-gray-500 uppercase"
            placeholder="ABCD 123456 EF"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: Enter your 16-character driving licence number
          </p>
        </div>

        {/* NI Number Input */}
        <div>
          <Label htmlFor="niNumber" className="text-gray-300 flex items-center gap-2">
            National Insurance Number *
            {niNumber.trim() && (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            )}
          </Label>
          <Input
            id="niNumber"
            value={niNumber}
            onChange={(e) => setNiNumber(e.target.value.toUpperCase())}
            className="mt-2 border-zinc-700 bg-zinc-800 text-white placeholder:text-gray-500 uppercase"
            placeholder="QQ 12 34 56 A"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: 2 letters, 6 numbers, 1 letter (e.g., QQ 12 34 56 A)
          </p>
        </div>

        {/* Document Uploads */}
        {requirements.documents.map((doc) => {
          const docState = documents[doc.id] || createEmptyDocState()
          const Icon = doc.icon
          const isValid = docState.url &&
            (!(doc as any).needsIssueDate || (docState.issueDate && isWithin3Months(docState.issueDate, bookingDate))) &&
            (!(doc as any).needsDocType || (docState.docType && !(docState.docType === "bank_statement" && bookingType !== "Rent")))

          return (
            <div key={doc.id} className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {doc.label} {doc.required && "*"}
                {isValid && <CheckCircle2 className="h-4 w-4 text-green-400" />}
              </Label>

              {(doc as any).helperText && (
                <p className="text-xs text-gray-500">
                  {(doc as any).helperText}
                </p>
              )}

              {!docState.url ? (
                <>
                  {/* Hidden file input */}
                  <input
                    ref={(el) => { fileInputRefs.current[doc.id] = el }}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf"
                    onChange={(e) => handleFileChange(doc.id, e)}
                    className="hidden"
                    disabled={docState.uploading}
                  />

                  {/* Clickable upload button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleUploadClick(doc.id)}
                    disabled={docState.uploading}
                    className={`w-full h-auto py-6 flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all ${docState.uploading
                      ? "border-red-500/50 bg-zinc-800/50 cursor-wait"
                      : "border-zinc-600 bg-zinc-800 hover:border-red-500 hover:bg-zinc-700/50"
                      }`}
                  >
                    {docState.uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
                        <span className="text-gray-300 text-base">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-gray-300 text-base">Click to Upload {doc.label}</span>
                        <span className="text-gray-500 text-xs">JPEG, PNG, WEBP, HEIC, or PDF (max 10MB)</span>
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-green-500/30">
                  {docState.file?.type?.startsWith("image/") || docState.url.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i) ? (
                    <div
                      className="relative w-16 h-16 rounded overflow-hidden cursor-pointer flex-shrink-0"
                      onClick={() => setPreviewImage(docState.url)}
                    >
                      <Image
                        src={docState.url}
                        alt={doc.label}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {docState.file?.name || "Document uploaded"}
                    </p>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Uploaded successfully
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(doc.id)}
                    className="text-gray-400 hover:text-red-400 flex-shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Issue Date for documents that need it */}
              {(doc as any).needsIssueDate && docState.url && (
                <div className="ml-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <Label className="text-gray-400 text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Document Issue Date *
                  </Label>
                  <Input
                    type="date"
                    value={docState.issueDate || ""}
                    onChange={(e) => handleIssueDateChange(doc.id, e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="mt-2 border-zinc-600 bg-zinc-700 text-white w-auto"
                  />
                  {docState.issueDate && !isWithin3Months(docState.issueDate, bookingDate) && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Document must be issued within 3 months of your booking date
                    </p>
                  )}
                </div>
              )}

              {/* Document Type for proof of address */}
              {(doc as any).needsDocType && docState.url && (
                <div className="ml-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <Label className="text-gray-400 text-sm">Document Type *</Label>
                  <Select
                    value={docState.docType || ""}
                    onValueChange={(value) => handleDocTypeChange(doc.id, value)}
                  >
                    <SelectTrigger className="mt-2 border-zinc-600 bg-zinc-700 text-white">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {PROOF_OF_ADDRESS_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          disabled={type.value === "bank_statement" && bookingType !== "Rent"}
                          className="text-white"
                        >
                          {type.label}
                          {type.value === "bank_statement" && bookingType !== "Rent" && (
                            <span className="text-red-400 ml-2">(Not allowed for {bookingType})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {docState.docType === "bank_statement" && bookingType !== "Rent" && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Bank statement cannot be used as proof of address for {bookingType}. Please upload a different document.
                    </p>
                  )}
                </div>
              )}

              {docState.error && (
                <p className="text-xs text-red-400 flex items-center gap-1 p-2 bg-red-500/10 rounded border border-red-500/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {docState.error}
                </p>
              )}
            </div>
          )
        })}
      </CardContent>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPreviewImage(null)
            }}
            className="absolute top-4 right-4 z-[10000] text-white hover:text-red-400 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full">
            <Image
              src={previewImage}
              alt="Document preview"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

export default RequiredDocuments
