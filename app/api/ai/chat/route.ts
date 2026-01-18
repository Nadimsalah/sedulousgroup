import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create admin Supabase client
function createAdminSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing Supabase credentials")
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

// Build data context based on the question
async function buildDataContext(question: string) {
    const supabase = createAdminSupabase()
    const context: any = {}
    const lowerQuestion = question.toLowerCase()

    try {
        // Always include basic stats
        const { data: bookings } = await supabase
            .from("bookings")
            .select("id, status, total_amount, created_at, pickup_date, dropoff_date")
            .order("created_at", { ascending: false })
            .limit(100)

        if (bookings) {
            const activeBookings = bookings.filter((b) => {
                const status = (b.status || "").toLowerCase()
                return !["completed", "cancelled", "rejected"].includes(status)
            })

            context.bookingStats = {
                total: bookings.length,
                active: activeBookings.length,
                completed: bookings.filter((b) => b.status?.toLowerCase() === "completed").length,
                totalRevenue: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
                activeRevenue: activeBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
            }
        }

        // ------------------------------------------------------------------
        // ALWAYS FETCH FULL BUSINESS CONTEXT (No more keywords required)
        // ------------------------------------------------------------------

        // 1. FLEET STATUS (Always fetch)
        const { data: allCars } = await supabase
            .from("cars")
            .select("id, name, brand, status, rental_type, registration_number")

        if (allCars) {
            context.fleet = {
                total: allCars.length,
                available: allCars.filter((c) => c.status?.toLowerCase() === "available").length,
                rented: allCars.filter((c) => c.status?.toLowerCase() === "rented").length,
                maintenance: allCars.filter((c) => c.status?.toLowerCase() === "maintenance").length,
                list: allCars.map(c => ({ name: `${c.brand} ${c.name}`, status: c.status, type: c.rental_type }))
            }
        }

        // 2. CUSTOMERS (Always fetch top stats)
        const { data: customers } = await supabase
            .from("user_profiles")
            .select("id, full_name, email, created_at")
            .limit(50) // Limit to 50 for context size

        if (customers) {
            context.customers = {
                totalCount: customers.length, // accurate enough for now, specific count would need count(*) query
                recent: customers.slice(0, 5).map(c => ({ name: c.full_name, email: c.email, joined: c.created_at }))
            }
        }

        // 3. PCN TICKETS (Always fetch metrics)
        const { data: pcnTickets } = await supabase
            .from("pcn_tickets")
            .select("id, status, amount")

        if (pcnTickets) {
            context.pcns = {
                total: pcnTickets.length,
                pending: pcnTickets.filter(p => p.status?.toLowerCase() === 'pending').length,
                paid: pcnTickets.filter(p => p.status?.toLowerCase() === 'paid').length,
                totalValue: pcnTickets.reduce((sum, p) => sum + (p.amount || 0), 0)
            }
        }

        // 4. DEPOSITS (Always fetch metrics)
        const { data: deposits } = await supabase
            .from("deposits")
            .select("id, status, amount")

        if (deposits) {
            context.deposits = {
                totalHeld: deposits.filter(d => d.status === 'held').reduce((sum, d) => sum + (d.amount || 0), 0),
                pendingCount: deposits.filter(d => d.status === 'pending').length
            }
        }

        // ------------------------------------------------------------------
        // 5. TIME-TRAVEL DATA (Yesterday, Last 30 days, Year to Date)
        // ------------------------------------------------------------------

        const now = new Date()
        const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString()
        const todayEnd = new Date(now.setHours(23, 59, 59, 999)).toISOString()

        // Calculate Yesterday
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString()
        const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()

        // Calculate Last 30 Days Start
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyDaysStart = thirtyDaysAgo.toISOString()

        // Fetch Date-Range Data
        // We fetch a larger chunk of bookings/financials to compute trends in memory
        // (Doing complex aggregations in Supabase JS client is harder than in-memory for small-medium datasets)

        const { data: recentBookings } = await supabase
            .from("bookings")
            .select("id, total_amount, created_at, status")
            .gte("created_at", thirtyDaysStart) // Last 30 days

        // Compute Today vs Yesterday
        const todayRevenue = (recentBookings || [])
            .filter(b => b.created_at >= todayStart && b.created_at <= todayEnd)
            .reduce((sum, b) => sum + (b.total_amount || 0), 0)

        const yesterdayRevenue = (recentBookings || [])
            .filter(b => b.created_at >= yesterdayStart && b.created_at <= yesterdayEnd)
            .reduce((sum, b) => sum + (b.total_amount || 0), 0)

        // Compute Daily Trend (Last 7 days)
        const dailyTrend = []
        for (let i = 0; i < 7; i++) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dStart = new Date(d.setHours(0, 0, 0, 0)).toISOString()
            const dEnd = new Date(d.setHours(23, 59, 59, 999)).toISOString()

            const rev = (recentBookings || [])
                .filter(b => b.created_at >= dStart && b.created_at <= dEnd)
                .reduce((sum, b) => sum + (b.total_amount || 0), 0)

            dailyTrend.push({ date: d.toLocaleDateString(), revenue: rev })
        }

        context.financials = {
            today: {
                revenue: todayRevenue,
                bookings: (recentBookings || []).filter(b => b.created_at >= todayStart && b.created_at <= todayEnd).length
            },
            yesterday: {
                revenue: yesterdayRevenue,
                bookings: (recentBookings || []).filter(b => b.created_at >= yesterdayStart && b.created_at <= yesterdayEnd).length,
                changePercent: yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) + '%' : 'N/A'
            },
            last7Days: dailyTrend,
            total30Days: (recentBookings || []).reduce((sum, b) => sum + (b.total_amount || 0), 0)
        }

        // Unified Transaction Feed (Last 20)
        // We can reuse recentBookings for this part to save a query if we want, 
        // but we need Deposits/PCNs too. Let's keep the dedicated feed logic but update it.

        // Fetch Deposits/PCNs for feed
        const { data: recentDeposits } = await supabase
            .from("deposits")
            .select("id, amount, type, status, created_at")
            .order('created_at', { ascending: false })
            .limit(20)

        const { data: recentPCNs } = await supabase
            .from("pcn_tickets")
            .select("id, amount, ticket_type, status, created_at")
            .order('created_at', { ascending: false })
            .limit(20)

        // 6. AGREEMENTS (Active & Recent)
        const { data: recentAgreements } = await supabase
            .from("agreements")
            .select("id, agreement_number, status, booking_id, created_at")
            .order('created_at', { ascending: false })
            .limit(20)

        if (recentAgreements) {
            context.agreements = {
                totalActive: recentAgreements.filter(a => a.status === 'active').length,
                pendingSignature: recentAgreements.filter(a => a.status === 'generated' || a.status === 'pending').length,
                recent: recentAgreements.slice(0, 5).map(a => ({ id: a.agreement_number, status: a.status, date: a.created_at }))
            }
        }

        // 7. INSPECTIONS / DAMAGE REPORTS
        const { data: recentDamageReports } = await supabase
            .from("damage_reports")
            .select("id, status, description, created_at")
            .order('created_at', { ascending: false })
            .limit(10)

        if (recentDamageReports) {
            context.inspections = {
                recentDamage: recentDamageReports.map(d => ({ description: d.description, status: d.status, date: d.created_at }))
            }
        }

        // 8. PARKING
        const { data: parkingSpots } = await supabase
            .from("parking")
            .select("*")
            .limit(20)

        if (parkingSpots) {
            context.parking = {
                totalSpots: parkingSpots.length,
                list: parkingSpots.slice(0, 5)
            }
        }

        // Update Fleet to explicitly include VRN
        if (allCars) {
            context.fleet = {
                total: allCars.length,
                available: allCars.filter((c) => c.status?.toLowerCase() === "available").length,
                rented: allCars.filter((c) => c.status?.toLowerCase() === "rented").length,
                maintenance: allCars.filter((c) => c.status?.toLowerCase() === "maintenance").length,
                list: allCars.map(c => ({
                    name: `${c.brand} ${c.name}`,
                    vrn: c.registration_number || 'N/A',
                    status: c.status,
                    type: c.rental_type
                }))
            }
        }

        // Combine for Feed
        const rawFeed = [
            ...(recentBookings || []).slice(0, 20).map(b => ({
                type: "BOOKING",
                amount: b.total_amount,
                status: b.status,
                date: b.created_at
            })),
            ...(recentDeposits || []).map(d => ({
                type: "DEPOSIT",
                amount: d.amount,
                status: d.status,
                date: d.created_at
            })),
            ...(recentPCNs || []).map(p => ({
                type: "PCN",
                amount: p.amount,
                status: p.status,
                date: p.created_at
            })),
            ...(recentAgreements || []).map(a => ({
                type: "AGREEMENT",
                description: `Agreement ${a.status}`,
                amount: 0,
                status: a.status,
                date: a.created_at
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 15) // Top 15 mixed events

        context.feed = rawFeed

        // If asking about revenue/money/financial
        if (lowerQuestion.includes("revenue") || lowerQuestion.includes("money") || lowerQuestion.includes("earning") || lowerQuestion.includes("income") || lowerQuestion.includes("today")) {
            const { data: bookings } = await supabase
                .from("bookings")
                .select("total_amount, status, created_at")
                .gte("created_at", new Date(new Date().setDate(1)).toISOString()) // This month

            if (bookings) {
                context.monthlyRevenue = {
                    total: bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
                    completed: bookings
                        .filter((b) => b.status?.toLowerCase() === "completed")
                        .reduce((sum, b) => sum + (b.total_amount || 0), 0),
                    pending: bookings
                        .filter((b) => !["completed", "cancelled", "rejected"].includes(b.status?.toLowerCase()))
                        .reduce((sum, b) => sum + (b.total_amount || 0), 0),
                }
            }
        }

        return context
    } catch (error) {
        console.error("Error building context:", error)
        return { error: "Failed to fetch some data" }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory } = await request.json()

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 })
        }

        // Check for OpenAI API key
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                {
                    reply: "I apologize, but the AI service is not configured yet. Please add your OpenAI API key to the environment variables (OPENAI_API_KEY).",
                },
                { status: 200 }
            )
        }

        // Build data context
        const dataContext = await buildDataContext(message)

        // Build system prompt with context
        const systemPrompt = `You are an AI assistant for Sedulous Group Ltd, a car rental company in the UK.
You have access to real-time business data and can answer questions about:
- Bookings and reservations
- Customers and their history
- Vehicle fleet and availability
- Revenue and financial metrics
- PCN tickets and violations
- Deposits and payments
- Inspections and damage reports

Current Data Context:
${JSON.stringify(dataContext, null, 2)}

Provide helpful, accurate answers based on the data above. Be concise but informative.
Use bullet points for lists. Include numbers and metrics when relevant.
Format currency as £X,XXX.XX for British pounds.
If you don't have specific data to answer a question, say so honestly.
Be professional and friendly.`

        // Prepare messages for OpenAI
        const messages = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
            })),
            { role: "user", content: message },
        ]

        // Call OpenAI API directly via fetch
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4-turbo-preview",
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error("OpenAI API Error:", errorData)

            if (response.status === 429) {
                return NextResponse.json({
                    reply: "I apologize, but the AI service has reached its usage limit OR your API key quota is exceeded. Please check your OpenAI billing.",
                })
            }

            return NextResponse.json({
                reply: `I apologize, but I encountered an error connecting to OpenAI: ${errorData.error?.message || "Unknown error"}`
            })
        }

        const data = await response.json()
        const reply = data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response."

        console.log("[v0] AI Transaction: Fleet Count:", dataContext.fleet?.total || 0)

        return NextResponse.json({
            reply,
            timestamp: new Date().toISOString(),
            debug: {
                fleetCount: dataContext.fleet?.total,
                version: "2.0 (Unrestricted Access)"
            }
        })
    } catch (error: any) {
        console.error("AI Chat Error:", error)
        return NextResponse.json(
            {
                reply: "I apologize, but I encountered an internal error. Please try again later.",
                error: error.message
            },
            { status: 500 }
        )
    }
}
