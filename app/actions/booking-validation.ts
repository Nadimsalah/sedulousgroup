"use server"

import { getBookingSettings } from "./settings"

export interface BookingValidation {
    isValid: boolean
    error?: string
    minDays?: number
    maxDays?: number
    advanceDays?: number
    bufferHours?: number
}

/**
 * Validates booking duration based on service type settings
 */
export async function validateBookingDuration(
    rentalType: "Rent" | "Flexi Hire" | "PCO Hire",
    durationDays: number
): Promise<BookingValidation> {
    try {
        const settings = await getBookingSettings()

        // Get service-specific settings
        let enabled = true
        let minDays = 1
        let maxDays = 365
        let advanceDays = 90
        let bufferHours = 2

        switch (rentalType) {
            case "Rent":
                enabled = settings.rent_enabled !== false
                minDays = settings.rent_min_days || 1
                maxDays = settings.rent_max_days || 30
                advanceDays = settings.rent_advance_days || 90
                bufferHours = settings.rent_buffer_hours || 2
                break
            case "Flexi Hire":
                enabled = settings.flexi_enabled !== false
                minDays = settings.flexi_min_days || 7
                maxDays = settings.flexi_max_days || 90
                advanceDays = settings.flexi_advance_days || 30
                bufferHours = settings.flexi_buffer_hours || 4
                break
            case "PCO Hire":
                enabled = settings.pco_enabled !== false
                minDays = settings.pco_min_days || 28
                maxDays = settings.pco_max_days || 365
                advanceDays = settings.pco_advance_days || 14
                bufferHours = settings.pco_buffer_hours || 6
                break
        }

        // Check if service is enabled
        if (!enabled) {
            return {
                isValid: false,
                error: `${rentalType} service is currently disabled`,
            }
        }

        // Validate duration
        if (durationDays < minDays) {
            return {
                isValid: false,
                error: `Minimum booking duration for ${rentalType} is ${minDays} day${minDays > 1 ? "s" : ""}`,
                minDays,
                maxDays,
                advanceDays,
                bufferHours,
            }
        }

        if (durationDays > maxDays) {
            return {
                isValid: false,
                error: `Maximum booking duration for ${rentalType} is ${maxDays} days`,
                minDays,
                maxDays,
                advanceDays,
                bufferHours,
            }
        }

        return {
            isValid: true,
            minDays,
            maxDays,
            advanceDays,
            bufferHours,
        }
    } catch (error) {
        console.error("Error validating booking duration:", error)
        return {
            isValid: true, // Default to allowing booking if settings can't be loaded
            minDays: 1,
            maxDays: 365,
        }
    }
}

/**
 * Get booking constraints for a specific rental type
 */
export async function getBookingConstraints(rentalType: "Rent" | "Flexi Hire" | "PCO Hire") {
    try {
        const settings = await getBookingSettings()

        switch (rentalType) {
            case "Rent":
                return {
                    enabled: settings.rent_enabled !== false,
                    minDays: settings.rent_min_days || 1,
                    maxDays: settings.rent_max_days || 30,
                    advanceDays: settings.rent_advance_days || 90,
                    bufferHours: settings.rent_buffer_hours || 2,
                }
            case "Flexi Hire":
                return {
                    enabled: settings.flexi_enabled !== false,
                    minDays: settings.flexi_min_days || 7,
                    maxDays: settings.flexi_max_days || 90,
                    advanceDays: settings.flexi_advance_days || 30,
                    bufferHours: settings.flexi_buffer_hours || 4,
                }
            case "PCO Hire":
                return {
                    enabled: settings.pco_enabled !== false,
                    minDays: settings.pco_min_days || 28,
                    maxDays: settings.pco_max_days || 365,
                    advanceDays: settings.pco_advance_days || 14,
                    bufferHours: settings.pco_buffer_hours || 6,
                }
        }
    } catch (error) {
        console.error("Error getting booking constraints:", error)
        return {
            enabled: true,
            minDays: 1,
            maxDays: 365,
            advanceDays: 90,
            bufferHours: 2,
        }
    }
}
