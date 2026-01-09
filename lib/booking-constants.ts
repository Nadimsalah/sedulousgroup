// Rejection reasons for bookings
export const REJECTION_REASONS = {
  NOT_ELIGIBLE: "Not Eligible - Does not meet rental requirements",
  LICENSE_UNCLEAR: "Document Issue - Driving license photo is unclear or unreadable",
  LICENSE_EXPIRED: "Document Issue - Driving license has expired",
  ADDRESS_UNCLEAR: "Document Issue - Proof of address is unclear or unreadable",
  ADDRESS_EXPIRED: "Document Issue - Proof of address is older than 3 months",
  BANK_STATEMENT_ISSUE: "Document Issue - Bank statement is unclear or older than 3 months",
  PCO_LICENSE_ISSUE: "Document Issue - Private hire license is unclear or expired",
  MISSING_DOCUMENTS: "Missing Documents - Not all required documents were uploaded",
  FRAUDULENT_DOCUMENTS: "Security Issue - Documents appear to be fraudulent or tampered",
  AGE_REQUIREMENT: "Not Eligible - Does not meet minimum age requirement",
  DRIVING_HISTORY: "Not Eligible - Driving history does not meet requirements",
  OTHER: "Other - Please contact us for more information",
} as const

export type RejectionReasonKey = keyof typeof REJECTION_REASONS

