import { NextResponse } from "next/server"
import { isMaintenanceMode } from "@/lib/settings"

export async function GET() {
    try {
        const maintenanceMode = await isMaintenanceMode()
        return NextResponse.json({ maintenanceMode })
    } catch (error) {
        console.error("Error checking maintenance mode:", error)
        return NextResponse.json({ maintenanceMode: false })
    }
}
