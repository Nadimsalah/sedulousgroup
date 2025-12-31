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
  // If it's already a base64 data URL, extract dimensions if possible
  if (src.startsWith('data:image')) {
    // For base64, we'll use default dimensions and let jsPDF handle it
    return { dataUrl: src, width: 200, height: 200 }
  }
  
  try {
    console.log("[PDF] Loading image:", src.substring(0, 100))
    
    // Fetch image in both browser and server environments
    const response = await fetch(src)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
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
        img.onerror = reject
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
    try {
      logoData = await loadImage(logoPath)
    } catch (firstError) {
      console.warn("[PDF] Failed to load logo from primary path, trying alternatives...")
      // Try alternative logo paths
      const alternativePaths = [
        "/sed.jpg",
        "/images/dna-group-logo.png",
        "/dna-group-logo.png",
        "dna-group-logo.png",
      ]
      for (const altPath of alternativePaths) {
        try {
          logoData = await loadImage(altPath)
          console.log("[PDF] Logo loaded from alternative path:", altPath)
          break
        } catch (err) {
          continue
        }
      }
      if (!logoData) {
        throw firstError
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
  checkNewPage(50)
  yPosition += 10

  // Signature table
  const sigTableY = yPosition
  const sigColWidth = 80
  const sigRowHeight = 30

  // Draw signature table borders
  doc.setDrawColor(200, 200, 200)
  doc.rect(margin, sigTableY, sigColWidth, sigRowHeight)
  doc.rect(margin + sigColWidth, sigTableY, sigColWidth, sigRowHeight)

  // Labels
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text("Client Signature", margin + sigColWidth / 2, sigTableY + 6, { align: "center" })
  doc.text("Administration Signature", margin + sigColWidth + sigColWidth / 2, sigTableY + 6, {
    align: "center",
  })

  // Add signature images if available
  let signatureY = sigTableY + 12

  // Customer signature (Client Signature) - LEFT SIDE
  console.log("[PDF] Checking customer signature:", data.customer_signature ? `Present (${data.customer_signature.substring(0, 50)}...)` : "Missing")
  if (data.customer_signature) {
    try {
      console.log("[PDF] Loading customer signature from:", data.customer_signature.substring(0, 100))
      const customerSigData = await loadImage(data.customer_signature)
      console.log("[PDF] Customer signature image loaded successfully, dimensions:", customerSigData.width, "x", customerSigData.height)
      const sigWidth = 60
      const sigHeight = (customerSigData.height / customerSigData.width) * sigWidth
      const adjustedHeight = Math.min(sigHeight, 20) // Increased max height
      const sigX = margin + 10
      const sigY = signatureY
      
      // Use base64 data URL directly
      doc.addImage(customerSigData.dataUrl, "PNG", sigX, sigY, sigWidth, adjustedHeight)
      console.log("[PDF] ✓ Customer signature added to PDF at position:", sigX, sigY, "Size:", sigWidth, "x", adjustedHeight)
    } catch (err) {
      console.error("[PDF] ✗ Could not load customer signature:", err)
      console.error("[PDF] Error details:", err instanceof Error ? err.message : String(err))
      console.error("[PDF] Signature URL was:", data.customer_signature)
      // Draw a line for signature if image fails
      doc.setDrawColor(150, 150, 150)
      doc.setLineWidth(0.5)
      doc.line(margin + 10, signatureY + 5, margin + 70, signatureY + 5)
      console.log("[PDF] Drew signature line as fallback")
    }
  } else {
    console.warn("[PDF] ⚠ Customer signature not provided in PDF data, drawing line")
    // Draw a line for signature if not provided
    doc.setDrawColor(150, 150, 150)
    doc.setLineWidth(0.5)
    doc.line(margin + 10, signatureY + 5, margin + 70, signatureY + 5)
  }

  // Admin signature (Administration Signature) - RIGHT SIDE
  if (data.admin_signature) {
    try {
      console.log("[PDF] Loading admin signature:", data.admin_signature.substring(0, 50))
      const adminSigData = await loadImage(data.admin_signature)
      const sigWidth = 60
      const sigHeight = (adminSigData.height / adminSigData.width) * sigWidth
      const adjustedHeight = Math.min(sigHeight, 15)
      doc.addImage(adminSigData.dataUrl, "PNG", margin + sigColWidth + 10, signatureY, sigWidth, adjustedHeight)
      console.log("[PDF] Admin signature added to PDF")
    } catch (err) {
      console.error("[PDF] Could not load admin signature:", err)
      // Draw a line for signature if image fails
      doc.setDrawColor(150, 150, 150)
      doc.line(margin + sigColWidth + 10, signatureY + 5, margin + sigColWidth + 70, signatureY + 5)
    }
  } else {
    // Draw a line for signature if not provided
    doc.setDrawColor(150, 150, 150)
    doc.line(margin + sigColWidth + 10, signatureY + 5, margin + sigColWidth + 70, signatureY + 5)
  }

  // Date labels
  const dateY = sigTableY + sigRowHeight - 8
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
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

