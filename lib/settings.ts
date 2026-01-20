import { getGeneralSettings } from "@/app/actions/settings"

/**
 * Get the site name from general settings
 */
export async function getSiteName(): Promise<string> {
    try {
        const settings = await getGeneralSettings()
        return settings.site_name || "Sedulous Group Ltd"
    } catch (error) {
        console.error("Error getting site name:", error)
        return "Sedulous Group Ltd"
    }
}

/**
 * Get the site URL from general settings
 */
export async function getSiteUrl(): Promise<string> {
    try {
        const settings = await getGeneralSettings()
        return settings.site_url || "https://sedulousgroup.net"
    } catch (error) {
        console.error("Error getting site URL:", error)
        return "https://sedulousgroup.net"
    }
}

/**
 * Get the currency from general settings
 */
export async function getCurrency(): Promise<string> {
    try {
        const settings = await getGeneralSettings()
        return settings.currency || "GBP"
    } catch (error) {
        console.error("Error getting currency:", error)
        return "GBP"
    }
}

/**
 * Get the currency symbol based on currency code
 */
export function getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
        GBP: "£",
        USD: "$",
        EUR: "€",
        CAD: "C$",
        AUD: "A$",
        JPY: "¥",
        CHF: "CHF",
        CNY: "¥",
        INR: "₹",
        SGD: "S$",
        HKD: "HK$",
        NZD: "NZ$",
        SEK: "kr",
        NOK: "kr",
        DKK: "kr",
        PLN: "zł",
        MXN: "$",
        BRL: "R$",
        ZAR: "R",
        AED: "د.إ",
        SAR: "﷼",
    }
    return symbols[currency] || currency
}

/**
 * Format a price with the correct currency symbol
 */
export async function formatPrice(amount: number): Promise<string> {
    try {
        const currency = await getCurrency()
        const symbol = getCurrencySymbol(currency)
        return `${symbol}${amount.toFixed(2)}`
    } catch (error) {
        console.error("Error formatting price:", error)
        return `£${amount.toFixed(2)}`
    }
}

/**
 * Check if maintenance mode is enabled
 */
export async function isMaintenanceMode(): Promise<boolean> {
    try {
        const settings = await getGeneralSettings()
        return settings.maintenance_mode || false
    } catch (error) {
        console.error("Error checking maintenance mode:", error)
        return false
    }
}

/**
 * Check if user registration is enabled
 */
export async function isRegistrationEnabled(): Promise<boolean> {
    try {
        const settings = await getGeneralSettings()
        return settings.registration_enabled !== false
    } catch (error) {
        console.error("Error checking registration status:", error)
        return true
    }
}

/**
 * Get the timezone from general settings
 */
export async function getTimezone(): Promise<string> {
    try {
        const settings = await getGeneralSettings()
        return settings.timezone || "Europe/London"
    } catch (error) {
        console.error("Error getting timezone:", error)
        return "Europe/London"
    }
}

/**
 * Get the date format from general settings
 */
export async function getDateFormat(): Promise<string> {
    try {
        const settings = await getGeneralSettings()
        return settings.date_format || "DD/MM/YYYY"
    } catch (error) {
        console.error("Error getting date format:", error)
        return "DD/MM/YYYY"
    }
}

/**
 * Get the time format from general settings
 */
export async function getTimeFormat(): Promise<string> {
    try {
        const settings = await getGeneralSettings()
        return settings.time_format || "24h"
    } catch (error) {
        console.error("Error getting time format:", error)
        return "24h"
    }
}

/**
 * Format a date according to the configured format
 */
export async function formatDate(date: Date | string): Promise<string> {
    try {
        const dateFormat = await getDateFormat()
        const dateObj = typeof date === "string" ? new Date(date) : date

        const day = String(dateObj.getDate()).padStart(2, "0")
        const month = String(dateObj.getMonth() + 1).padStart(2, "0")
        const year = dateObj.getFullYear()

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const monthNamesLong = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ]

        switch (dateFormat) {
            case "DD/MM/YYYY":
                return `${day}/${month}/${year}`
            case "MM/DD/YYYY":
                return `${month}/${day}/${year}`
            case "YYYY-MM-DD":
                return `${year}-${month}-${day}`
            case "DD-MM-YYYY":
                return `${day}-${month}-${year}`
            case "MM-DD-YYYY":
                return `${month}-${day}-${year}`
            case "DD.MM.YYYY":
                return `${day}.${month}.${year}`
            case "MM.DD.YYYY":
                return `${month}.${day}.${year}`
            case "DD MMM YYYY":
                return `${day} ${monthNames[dateObj.getMonth()]} ${year}`
            case "MMMM DD, YYYY":
                return `${monthNamesLong[dateObj.getMonth()]} ${day}, ${year}`
            case "DD MMMM YYYY":
                return `${day} ${monthNamesLong[dateObj.getMonth()]} ${year}`
            default:
                return `${day}/${month}/${year}`
        }
    } catch (error) {
        console.error("Error formatting date:", error)
        return new Date(date).toLocaleDateString()
    }
}

/**
 * Format a time according to the configured format
 */
export async function formatTime(date: Date | string): Promise<string> {
    try {
        const timeFormat = await getTimeFormat()
        const dateObj = typeof date === "string" ? new Date(date) : date

        if (timeFormat === "12h") {
            return dateObj.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            })
        } else {
            return dateObj.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            })
        }
    } catch (error) {
        console.error("Error formatting time:", error)
        return new Date(date).toLocaleTimeString()
    }
}
