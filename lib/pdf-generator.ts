import jsPDF from "jspdf"

export interface AgreementData {
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_license: string
  customer_address: string
  vehicle: string
  registration: string
  odometer: string
  fuel: string
  pickup_date: string
  pickup_time: string
  dropoff_date: string
  dropoff_time: string
  pickup_location: string
  dropoff_location: string
  insurance_text: string
  terms: string[]
  agreement_number: string
  created_date: string
  admin_signature?: string // Base64 image or URL
  customer_signature?: string // Base64 image or URL
  admin_name?: string
  customer_name_signed?: string
}

// Helper to load image and convert to base64 data URL
// Works in both browser and Node.js environments
// Returns an object with base64 data URL and dimensions
export async function loadImage(src: string): Promise<{ dataUrl: string; width: number; height: number }> {
  // If it's already a base64 data URL, handle it directly
  if (src.startsWith('data:image')) {
    console.log("[PDF] Using base64 data URL directly")
    // Try to get actual dimensions from the image in browser
    if (typeof window !== 'undefined' && typeof window.Image !== 'undefined') {
      return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => {
          console.log("[PDF] Base64 image loaded, dimensions:", img.width, "x", img.height)
          resolve({ dataUrl: src, width: img.width, height: img.height })
        }
        img.onerror = (err) => {
          console.warn("[PDF] Could not load base64 image for dimensions, using defaults:", err)
          resolve({ dataUrl: src, width: 200, height: 200 })
        }
        img.src = src
      })
    }
    // For server-side, return with default dimensions
    return { dataUrl: src, width: 200, height: 200 }
  }

  try {
    console.log("[PDF] Loading image from URL:", src.substring(0, 100))

    // In browser, try to load image directly first (more reliable for same-origin)
    if (typeof window !== 'undefined' && typeof window.Image !== 'undefined' && !src.startsWith('http')) {
      // For relative paths in browser, try direct image loading first
      return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = 'anonymous' // Allow CORS if needed
        img.onload = () => {
          // Convert image to base64
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/png')
          console.log("[PDF] Image loaded via canvas, dimensions:", img.width, "x", img.height)
          resolve({ dataUrl, width: img.width, height: img.height })
        }
        img.onerror = (err) => {
          console.warn("[PDF] Direct image load failed, trying fetch:", err)
          // Fall through to fetch method
          fetch(src)
            .then(response => {
              if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
              return response.arrayBuffer()
            })
            .then(arrayBuffer => {
              // Convert ArrayBuffer to base64 (handle large arrays)
              const bytes = new Uint8Array(arrayBuffer)
              let binary = ''
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i])
              }
              const base64 = btoa(binary)
              const mimeType = 'image/png' // Default
              const dataUrl = `data:${mimeType};base64,${base64}`
              const img2 = new window.Image()
              img2.onload = () => resolve({ dataUrl, width: img2.width, height: img2.height })
              img2.onerror = () => resolve({ dataUrl, width: 200, height: 200 })
              img2.src = dataUrl
            })
            .catch(reject)
        }
        // Use full URL if relative path
        const fullSrc = src.startsWith('/') ? `${window.location.origin}${src}` : src
        img.src = fullSrc
      })
    }

    // Fetch image in both browser and server environments
    const response = await fetch(src)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    let base64: string
    if (typeof Buffer !== 'undefined') {
      // Server-side: use Buffer
      base64 = Buffer.from(arrayBuffer).toString('base64')
    } else {
      // Client-side: convert ArrayBuffer to base64 (handle large arrays)
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      base64 = btoa(binary)
    }
    const mimeType = response.headers.get('content-type') || 'image/png'
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Try to get dimensions if in browser
    if (typeof window !== 'undefined' && typeof window.Image !== 'undefined') {
      return new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => {
          console.log("[PDF] Image loaded, dimensions:", img.width, "x", img.height)
          resolve({ dataUrl, width: img.width, height: img.height })
        }
        img.onerror = () => {
          console.warn("[PDF] Could not get image dimensions, using defaults")
          resolve({ dataUrl, width: 200, height: 200 })
        }
        img.src = dataUrl
      })
    } else {
      // Server-side: return with default dimensions (jsPDF will scale)
      console.log("[PDF] Image converted to base64, length:", base64.length)
      return { dataUrl, width: 200, height: 200 }
    }
  } catch (error) {
    console.error("[PDF] Failed to load image:", error)
    throw error
  }
}

// Helper to add table with borders
function addTable(
  doc: jsPDF,
  x: number,
  y: number,
  rows: string[][],
  colWidths: number[],
): number {
  const rowHeight = 8
  const headerHeight = 10
  let currentY = y

  // Draw table
  rows.forEach((row, rowIndex) => {
    let currentX = x
    let maxCellHeight = rowHeight

    // First pass: calculate max height for this row
    row.forEach((cell, colIndex) => {
      const width = colWidths[colIndex]
      const maxWidth = width - 8
      const lines = doc.splitTextToSize(cell, maxWidth)
      const cellHeight = lines.length * 5 + 2
      maxCellHeight = Math.max(maxCellHeight, cellHeight)
    })

    // Use header height for first row
    const actualRowHeight = rowIndex === 0 ? headerHeight : maxCellHeight

    // Second pass: draw cells
    row.forEach((cell, colIndex) => {
      const width = colWidths[colIndex]

      // Draw border (draw after text to avoid overlap issues)
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)

      // Background for header (draw first)
      if (rowIndex === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(currentX, currentY, width, actualRowHeight, "FD") // Fill and draw
      } else {
        doc.rect(currentX, currentY, width, actualRowHeight) // Just draw border
      }

      // Add text
      doc.setFontSize(rowIndex === 0 ? 10 : 9)
      doc.setFont("helvetica", rowIndex === 0 ? "bold" : "normal")
      doc.setTextColor(0, 0, 0)

      const textX = currentX + 4
      const textY = currentY + (rowIndex === 0 ? 7 : 6)

      // Split long text
      const maxWidth = width - 8
      const lines = doc.splitTextToSize(cell, maxWidth)
      lines.forEach((line: string, lineIndex: number) => {
        doc.text(line, textX, textY + lineIndex * 5)
      })

      currentX += width
    })

    currentY += actualRowHeight
  })

  return currentY
}

export async function generateRentalAgreementPDF(
  data: AgreementData,
  logoPathOrUrl?: string,
): Promise<jsPDF> {
  // Default logo path
  const defaultLogoPath = "/sed.jpg"
  const logoPath = logoPathOrUrl || defaultLogoPath
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 36 / 2.83465 // Convert points to mm (36pt = ~12.7mm, but jsPDF uses mm)
  const contentWidth = pageWidth - margin * 2
  let yPosition = margin

  // Helper to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // HEADER with Logo and Company Info
  try {
    console.log("[PDF] Loading logo from:", logoPath)
    // Try to load logo - if it fails, try alternative paths
    let logoData: { dataUrl: string; width: number; height: number } | null = null

    // Helper to convert relative paths to full URLs for both client and server-side
    const getFullUrl = (path: string): string => {
      if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
        return path
      }
      // If it's a relative path, convert to full URL
      if (path.startsWith("/")) {
        // Client-side: use window.location.origin
        if (typeof window !== "undefined" && window.location) {
          return `${window.location.origin}${path}`
        }
        // Server-side: use environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
          process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
          (supabaseUrl ? new URL(supabaseUrl).origin : "http://localhost:3000")
        return `${baseUrl}${path}`
      }
      return path
    }

    try {
      const fullLogoPath = getFullUrl(logoPath)
      console.log("[PDF] Attempting to load logo from:", fullLogoPath)
      logoData = await loadImage(fullLogoPath)
      console.log("[PDF] Logo loaded successfully from primary path")
    } catch (firstError) {
      console.warn("[PDF] Failed to load logo from primary path:", firstError)
      console.warn("[PDF] Trying alternative logo paths...")
      // Try alternative logo paths
      const alternativePaths = [
        "/sed.jpg",
        "/images/dna-group-logo.png",
        "/dna-group-logo.png",
      ]
      for (const altPath of alternativePaths) {
        try {
          const fullAltPath = getFullUrl(altPath)
          console.log("[PDF] Trying alternative path:", fullAltPath)
          logoData = await loadImage(fullAltPath)
          console.log("[PDF] ✓ Logo loaded from alternative path:", fullAltPath)
          break
        } catch (err) {
          console.warn("[PDF] ✗ Failed to load from alternative path:", altPath, err)
          continue
        }
      }
      if (!logoData) {
        console.error("[PDF] ✗✗✗ Failed to load logo from ALL paths")
        console.error("[PDF] Original error:", firstError)
        throw new Error(`Failed to load logo. Tried: ${logoPath} and alternatives. Error: ${firstError instanceof Error ? firstError.message : String(firstError)}`)
      }
    }

    if (!logoData) {
      throw new Error("Failed to load logo from all paths")
    }

    console.log("[PDF] Logo loaded successfully, dimensions:", logoData.width, "x", logoData.height)

    const logoWidth = 50 // mm - make it larger
    const logoHeight = (logoData.height / logoData.width) * logoWidth
    const logoX = margin

    // Add logo image using base64 data URL directly
    // Determine image format from data URL or file extension
    let imageFormat: "PNG" | "JPEG" = "PNG"
    if (logoData.dataUrl.startsWith('data:image/jpeg') || logoData.dataUrl.startsWith('data:image/jpg')) {
      imageFormat = "JPEG"
    } else if (logoPath.toLowerCase().endsWith('.jpg') || logoPath.toLowerCase().endsWith('.jpeg')) {
      imageFormat = "JPEG"
    }
    // Verify logo data before adding
    if (!logoData.dataUrl || logoData.dataUrl.length < 100) {
      throw new Error("Logo data URL is invalid or too short")
    }

    console.log("[PDF] Adding logo to PDF - Format:", imageFormat, "Data URL length:", logoData.dataUrl.length)
    doc.addImage(logoData.dataUrl, imageFormat, logoX, yPosition, logoWidth, logoHeight)
    console.log("[PDF] ✓ Logo added to PDF at position:", logoX, yPosition, "Size:", logoWidth, "x", logoHeight, "Format:", imageFormat)

    // Company info next to logo
    const companyX = logoX + logoWidth + 8
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(data.company_name, companyX, yPosition + 5)

    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.text(data.company_address, companyX, yPosition + 10)
    doc.text(`Phone: ${data.company_phone}`, companyX, yPosition + 15)
    doc.text(`Email: ${data.company_email}`, companyX, yPosition + 20)

    // Set yPosition to bottom of logo or company info, whichever is lower
    yPosition = Math.max(yPosition + logoHeight, yPosition + 25) + 10
  } catch (logoErr) {
    console.error("[PDF] Could not load logo:", logoErr)
    // Add company info without logo
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(data.company_name, margin, yPosition)
    yPosition += 5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(data.company_address, margin, yPosition)
    yPosition += 4
    doc.text(`Phone: ${data.company_phone}`, margin, yPosition)
    yPosition += 4
    doc.text(`Email: ${data.company_email}`, margin, yPosition)
    yPosition += 10
  }

  // TITLE - Centered
  checkNewPage(20)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(220, 38, 38) // Red
  doc.text("AGREEMENT", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 12

  // CUSTOMER DETAILS SECTION
  checkNewPage(30)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 139) // Dark blue
  doc.text("CUSTOMER DETAILS", margin, yPosition)
  yPosition += 8

  const customerRows = [
    ["Name", data.customer_name || "N/A"],
    ["Email", data.customer_email || "N/A"],
    ["Phone", data.customer_phone || "N/A"],
    ["Driving License", data.customer_license || "N/A"],
    ["Address", data.customer_address || "N/A"],
  ]

  yPosition = addTable(doc, margin, yPosition, customerRows, [60, 120]) + 5

  // VEHICLE DETAILS SECTION
  checkNewPage(30)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 139)
  doc.text("VEHICLE DETAILS", margin, yPosition)
  yPosition += 8

  const vehicleRows = [
    ["Vehicle", data.vehicle],
    ["Registration", data.registration],
    ["Initial Odometer", data.odometer],
    ["Fuel Level", data.fuel],
  ]

  yPosition = addTable(doc, margin, yPosition, vehicleRows, [60, 120]) + 5

  // RENTAL PERIOD SECTION
  checkNewPage(30)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 139)
  doc.text("RENTAL PERIOD", margin, yPosition)
  yPosition += 8

  const rentalRows = [
    ["Pickup", `${data.pickup_date} at ${data.pickup_time}`],
    ["Dropoff", `${data.dropoff_date} at ${data.dropoff_time}`],
    ["Pickup Location", data.pickup_location],
    ["Dropoff Location", data.dropoff_location],
  ]

  yPosition = addTable(doc, margin, yPosition, rentalRows, [60, 120]) + 10

  // INSURANCE DECLARATION
  checkNewPage(40)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 139)
  doc.text("INSURANCE DECLARATION", margin, yPosition)
  yPosition += 8

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)
  const insuranceLines = doc.splitTextToSize(data.insurance_text, contentWidth)
  insuranceLines.forEach((line: string) => {
    checkNewPage(6)
    doc.text(line, margin, yPosition)
    yPosition += 5
  })

  yPosition += 5

  // TERMS & CONDITIONS
  checkNewPage(30)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 139)
  doc.text("TERMS & CONDITIONS", margin, yPosition)
  yPosition += 8

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)
  data.terms.forEach((clause) => {
    checkNewPage(10)
    const clauseLines = doc.splitTextToSize(clause, contentWidth)
    clauseLines.forEach((line: string) => {
      checkNewPage(6)
      doc.text(line, margin, yPosition)
      yPosition += 5
    })
    yPosition += 3
  })

  // SIGNATURES SECTION
  checkNewPage(60)
  yPosition += 10

  // Signature table
  const sigTableY = yPosition
  const sigColWidth = 85
  const sigRowHeight = 45 // Increased height for better signature display

  // Draw signature table borders
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(margin, sigTableY, sigColWidth, sigRowHeight)
  doc.rect(margin + sigColWidth, sigTableY, sigColWidth, sigRowHeight)

  // Labels - at the top of each box
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Client Signature", margin + sigColWidth / 2, sigTableY + 6, { align: "center" })
  doc.text("Administration Signature", margin + sigColWidth + sigColWidth / 2, sigTableY + 6, {
    align: "center",
  })

  // Signature area starts after the label
  const signatureStartY = sigTableY + 10
  const signatureMaxHeight = 22 // Max height for signature image

  // Customer signature (Client Signature) - LEFT SIDE
  const hasCustomerSignature = data.customer_signature && data.customer_signature.trim().length > 0
  console.log("[PDF] Checking customer signature:", hasCustomerSignature ? `Present (${data.customer_signature!.substring(0, 50)}...)` : "Missing")

  if (hasCustomerSignature) {
    try {
      console.log("[PDF] Loading customer signature from:", data.customer_signature!.substring(0, 100))

      // Validate signature format
      if (!data.customer_signature!.startsWith('data:image') && !data.customer_signature!.startsWith('http')) {
        throw new Error(`Invalid signature format. Expected data:image or http URL, got: ${data.customer_signature!.substring(0, 50)}`)
      }

      // If it's already a base64 data URL, use it directly without fetch
      let customerSigData: { dataUrl: string; width: number; height: number }

      if (data.customer_signature!.startsWith('data:image')) {
        console.log("[PDF] Signature is base64 data URL, using directly")

        // Validate base64 data URL format
        if (!data.customer_signature!.includes(',')) {
          throw new Error("Invalid base64 data URL format: missing comma separator")
        }

        // Get dimensions from the image
        if (typeof window !== 'undefined' && typeof window.Image !== 'undefined') {
          customerSigData = await new Promise((resolve, reject) => {
            const img = new window.Image()
            const timeout = setTimeout(() => {
              reject(new Error("Timeout loading signature image"))
            }, 5000)

            img.onload = () => {
              clearTimeout(timeout)
              console.log("[PDF] Base64 signature image loaded, dimensions:", img.width, "x", img.height)
              resolve({ dataUrl: data.customer_signature!, width: img.width, height: img.height })
            }
            img.onerror = (err) => {
              clearTimeout(timeout)
              console.warn("[PDF] Could not load base64 image for dimensions, using defaults")
              // Still use the base64 data even if we can't get dimensions
              resolve({ dataUrl: data.customer_signature!, width: 200, height: 200 })
            }
            img.src = data.customer_signature!
          })
        } else {
          // Server-side: use default dimensions
          customerSigData = { dataUrl: data.customer_signature!, width: 200, height: 200 }
        }
      } else {
        // It's a URL, use loadImage
        console.log("[PDF] Signature is URL, loading via loadImage...")
        customerSigData = await loadImage(data.customer_signature!)
      }

      if (!customerSigData || !customerSigData.dataUrl) {
        throw new Error("Failed to load signature: empty data returned")
      }

      console.log("[PDF] Customer signature image loaded successfully, dimensions:", customerSigData.width, "x", customerSigData.height)

      // FIXED signature dimensions - same as admin signature
      const fixedSigWidth = 55 // Fixed width in mm
      const fixedSigHeight = 15 // Fixed height in mm

      // FIXED X position - centered in left box with equal margins
      // Left box: from margin (12.7mm) to margin+sigColWidth (97.7mm)
      // Center signature horizontally in the box
      const sigX = margin + (sigColWidth - fixedSigWidth) / 2

      // FIXED Y position - inside box, above Date line
      // signatureStartY is 10mm from box top
      // Place signature at signatureStartY + 4mm for proper spacing
      const sigY = signatureStartY + 4

      // Use base64 data URL directly with FIXED dimensions
      doc.addImage(customerSigData.dataUrl, "PNG", sigX, sigY, fixedSigWidth, fixedSigHeight)
      console.log("[PDF] ✓ Customer signature added to PDF at FIXED position:", sigX, sigY, "Size:", fixedSigWidth, "x", fixedSigHeight)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err) || "Unknown error"
      console.error("[PDF] ✗ Could not load customer signature:", errorMessage)
      console.error("[PDF] Error details:", err)
      console.error("[PDF] Signature value was:", data.customer_signature ? `${data.customer_signature.substring(0, 200)}... (length: ${data.customer_signature.length})` : "undefined or null")

      // Don't throw - instead draw a line and let the PDF generate without signature
      console.warn("[PDF] Continuing PDF generation without signature image")
      doc.setDrawColor(150, 150, 150)
      doc.setLineWidth(0.5)
      doc.line(margin + 10, signatureStartY + signatureMaxHeight / 2, margin + sigColWidth - 10, signatureStartY + signatureMaxHeight / 2)
      console.log("[PDF] Drew signature line as fallback")
    }
  } else {
    console.warn("[PDF] ⚠ Customer signature not provided in PDF data, drawing line")
    // Draw a line for signature if not provided
    doc.setDrawColor(150, 150, 150)
    doc.setLineWidth(0.5)
    doc.line(margin + 10, signatureStartY + signatureMaxHeight / 2, margin + sigColWidth - 10, signatureStartY + signatureMaxHeight / 2)
  }

  // Admin signature (Administration Signature) - RIGHT SIDE
  if (data.admin_signature) {
    try {
      console.log("[PDF] Loading admin signature:", data.admin_signature.substring(0, 50))
      const adminSigData = await loadImage(data.admin_signature)

      // Calculate signature size to fit in the box properly
      const maxSigWidth = sigColWidth - 10 // Leave 5mm padding on each side
      const sigRatio = adminSigData.height / adminSigData.width
      let sigWidth = Math.min(maxSigWidth, 65)
      let sigHeight = sigWidth * sigRatio

      // Limit height and recalculate width if needed
      if (sigHeight > signatureMaxHeight) {
        sigHeight = signatureMaxHeight
        sigWidth = sigHeight / sigRatio
      }

      // Center the signature in the box
      const sigX = margin + sigColWidth + (sigColWidth - sigWidth) / 2
      const sigY = signatureStartY + 2

      doc.addImage(adminSigData.dataUrl, "PNG", sigX, sigY, sigWidth, sigHeight)
      console.log("[PDF] Admin signature added to PDF at position:", sigX, sigY, "Size:", sigWidth, "x", sigHeight)
    } catch (err) {
      console.error("[PDF] Could not load admin signature:", err)
      // Draw a line for signature if image fails
      doc.setDrawColor(150, 150, 150)
      doc.line(margin + sigColWidth + 10, signatureStartY + signatureMaxHeight / 2, margin + sigColWidth * 2 - 10, signatureStartY + signatureMaxHeight / 2)
    }
  } else {
    // Draw a line for signature if not provided
    doc.setDrawColor(150, 150, 150)
    doc.line(margin + sigColWidth + 10, signatureStartY + signatureMaxHeight / 2, margin + sigColWidth * 2 - 10, signatureStartY + signatureMaxHeight / 2)
  }

  // Date labels - at the bottom of each box
  const dateY = sigTableY + sigRowHeight - 6
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  doc.text("Date:", margin + 5, dateY)
  doc.text("Date:", margin + sigColWidth + 5, dateY)

  // Add dates if available
  if (data.created_date) {
    doc.text(new Date().toLocaleDateString("en-GB"), margin + 20, dateY)
    doc.text(new Date().toLocaleDateString("en-GB"), margin + sigColWidth + 20, dateY)
  }

  yPosition = sigTableY + sigRowHeight + 10

  // FOOTER - Centered
  checkNewPage(15)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(
    `${data.agreement_number}  |  Created: ${data.created_date}`,
    pageWidth / 2,
    yPosition,
    { align: "center" },
  )

  return doc
}

export interface InvoiceData {
  invoice_number: string
  date: string
  due_date: string
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  customer_name: string
  customer_address: string
  customer_email: string
  items: {
    description: string
    quantity: number
    unit_price: number
    total: number
  }[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  company_reg?: string[] // Added for registration details
}

export async function generateInvoicePDF(
  data: InvoiceData,
  logoPathOrUrl?: string,
): Promise<jsPDF> {
  // Default logo path
  const defaultLogoPath = "/sed.jpg"
  const logoPath = logoPathOrUrl || defaultLogoPath
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPosition = margin

  // Header with Logo and Company Info
  try {
    // Try primary logo, then fallback
    let logoData = null;
    try {
      logoData = await loadImage(logoPath);
    } catch (e) {
      try {
        logoData = await loadImage("/images/dna-group-logo.png");
      } catch (e2) {
        console.warn("Failed to load invoice logos");
      }
    }

    if (logoData) {
      const logoWidth = 40
      const logoHeight = (logoData.height / logoData.width) * logoWidth

      // Determine format
      let imageFormat: "PNG" | "JPEG" = "PNG"
      if (logoData.dataUrl.startsWith('data:image/jpeg') || logoData.dataUrl.startsWith('data:image/jpg') || logoPath.toLowerCase().endsWith('.jpg')) {
        imageFormat = "JPEG"
      }

      doc.addImage(logoData.dataUrl, imageFormat, margin, yPosition, logoWidth, logoHeight)

      // Company Info (Right aligned)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(data.company_name, pageWidth - margin, yPosition + 5, { align: "right" })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)

      let infoY = yPosition + 10
      // Address - split if needed, though usually passed as single string with newlines if desired or we split here
      const addressLines = doc.splitTextToSize(data.company_address, 80)
      doc.text(addressLines, pageWidth - margin, infoY, { align: "right" })
      infoY += (addressLines.length * 4) + 2

      doc.text(data.company_phone, pageWidth - margin, infoY, { align: "right" })
      infoY += 5
      doc.text(data.company_email, pageWidth - margin, infoY, { align: "right" })

      yPosition = Math.max(yPosition + logoHeight, infoY) + 15
    } else {
      // Fallback if no logo
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text(data.company_name, margin, yPosition + 10)
      yPosition += 20
    }
  } catch (e) {
    console.error("Error loading logo for invoice:", e)
    yPosition += 20
  }

  // Invoice Title and Details
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(220, 38, 38) // Red
  doc.text("INVOICE", margin, yPosition)

  // Invoice Meta (Number, Date)
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Invoice #: ${data.invoice_number}`, pageWidth - margin, yPosition, { align: "right" })
  doc.text(`Date: ${data.date}`, pageWidth - margin, yPosition + 5, { align: "right" })
  doc.text(`Due Date: ${data.due_date}`, pageWidth - margin, yPosition + 10, { align: "right" })

  yPosition += 20

  // Bill To Section
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, yPosition, pageWidth - margin * 2, 25, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text("BILL TO:", margin + 5, yPosition + 7)

  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text(data.customer_name, margin + 5, yPosition + 14)

  doc.setFont("helvetica", "normal")
  doc.text(data.customer_address, margin + 5, yPosition + 19)

  yPosition += 35

  // Line Items Header
  doc.setFillColor(220, 38, 38) // Red header
  doc.rect(margin, yPosition, pageWidth - margin * 2, 10, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("DESCRIPTION", margin + 5, yPosition + 7)
  doc.text("QTY", pageWidth - margin - 60, yPosition + 7, { align: "center" })
  doc.text("PRICE", pageWidth - margin - 35, yPosition + 7, { align: "right" })
  doc.text("TOTAL", pageWidth - margin - 5, yPosition + 7, { align: "right" })

  yPosition += 10

  // Items
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")

  data.items.forEach((item, index) => {
    // Zebra striping
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, yPosition, pageWidth - margin * 2, 10, "F")
    }

    doc.text(item.description, margin + 5, yPosition + 7)
    doc.text(item.quantity.toString(), pageWidth - margin - 60, yPosition + 7, { align: "center" })
    doc.text(`£${item.unit_price.toFixed(2)}`, pageWidth - margin - 35, yPosition + 7, { align: "right" })
    doc.text(`£${item.total.toFixed(2)}`, pageWidth - margin - 5, yPosition + 7, { align: "right" })

    yPosition += 10
  })

  yPosition += 5
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Totals
  const totalsX = pageWidth - margin - 60

  doc.setFont("helvetica", "normal")
  doc.text("Subtotal:", totalsX, yPosition, { align: "right" })
  doc.text(`£${data.subtotal.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: "right" })

  yPosition += 7
  doc.text("VAT (20%):", totalsX, yPosition, { align: "right" }) // FIXED from Tax (0%)
  doc.text(`£${data.tax.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: "right" })

  yPosition += 10
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("Total:", totalsX, yPosition, { align: "right" })
  doc.setTextColor(220, 38, 38)
  doc.text(`£${data.total.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: "right" })

  // Footer / Notes
  if (data.notes) {
    yPosition += 20
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "bold")
    doc.text("Notes:", margin, yPosition)

    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)
    doc.text(data.notes, margin, yPosition + 5, { maxWidth: pageWidth - margin * 2 })
  }

  // Company Registration Info (Footer)
  if (data.company_reg && data.company_reg.length > 0) {
    const footerY = pageHeight - 25
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont("helvetica", "normal")

    data.company_reg.forEach((line, i) => {
      doc.text(line, pageWidth / 2, footerY + (i * 4), { align: "center" })
    })
  } else {
    // Original Footer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 15, { align: "center" })
  }

  return doc
}