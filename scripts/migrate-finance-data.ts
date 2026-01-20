
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Manually load .env.local
const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
                    process.env[key] = value;
                }
            });
            console.log("✅ Loaded .env.local");
        } else {
            console.warn("⚠️ .env.local file not found");
        }
    } catch (e) {
        console.error("❌ Error loading .env.local", e);
    }
};

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Service Role Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
    console.log("\n🚀 Starting Finance Data Migration (Historical Backfill)...\n");

    let totalMigrated = 0;

    // 1. Backfill Bookings (Revenue)
    // Only migrate confirmed/active/completed bookings that have a total_amount
    console.log("--- Migrating Bookings ---");
    const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, total_amount, created_at, status, customer_email, customer_name, car_id')
        .neq('status', 'Cancelled')
        .not('total_amount', 'is', null)
        .gt('total_amount', 0);

    if (bookingError) console.error("Error fetching bookings:", bookingError);
    else {
        console.log(`Found ${bookings.length} valid bookings to migrate.`);
        let bookingCount = 0;

        for (const booking of bookings) {
            // Check if already exists to avoid duplicates (optional but good for re-running)
            const { data: existing } = await supabase
                .from('finance_transactions')
                .select('id')
                .eq('booking_id', booking.id)
                .eq('type', 'booking_payment')
                .single();

            if (!existing) {
                const { error: insertError } = await supabase.from('finance_transactions').insert({
                    occurred_at: booking.created_at, // Use creation date as payment date approximation
                    direction: 'in',
                    type: 'booking_payment',
                    source: 'booking',
                    status: 'paid', // Assume paid for historical purpose if active/confirmed
                    amount_gross: booking.total_amount,
                    amount_net: booking.total_amount,
                    currency: 'GBP',
                    booking_id: booking.id,
                    vehicle_id: booking.car_id,
                    notes: `Migrated from Booking History (Customer: ${booking.customer_name})`
                });

                if (insertError) console.error(`Failed to migrate booking ${booking.id}:`, insertError);
                else bookingCount++;
            }
        }
        console.log(`✅ Migrated ${bookingCount} bookings.`);
        totalMigrated += bookingCount;
    }

    // 2. Backfill Deposits
    console.log("\n--- Migrating Deposits ---");
    const { data: deposits, error: depositError } = await supabase
        .from('deposits')
        .select('id, amount, status, created_at, booking_id'); // Removed vehicle_id

    if (depositError) console.error("Error fetching deposits:", depositError);
    else {
        console.log(`Found ${deposits.length} deposits to migrate.`);
        let depositCount = 0;

        for (const deposit of deposits) {
            // Only migrate if it has an amount
            if (!deposit.amount) continue;

            const { data: existing } = await supabase
                .from('finance_transactions')
                .select('id') // Added select
                // .eq('deposit_id', deposit.id) // Can't query on JSON ID easily if we just store it blindly, but we stored it in deposit_id column
                .eq('source', 'deposit')
                .ilike('notes', `%${deposit.id}%`) // Fallback check
                .single();

            if (!existing) {
                // Determine transaction type based on status

                // 1. Initial Deposit (In)
                const { error: tx1 } = await supabase.from('finance_transactions').insert({
                    occurred_at: deposit.created_at,
                    direction: 'in',
                    type: 'deposit',
                    source: 'deposit',
                    status: 'paid', // Money received
                    amount_gross: deposit.amount,
                    amount_net: deposit.amount,
                    currency: 'GBP',
                    booking_id: deposit.booking_id, // Might be null
                    // vehicle_id: deposit.vehicle_id, // Removed as source doesn't have it
                    deposit_id: deposit.id, // Store source ID
                    notes: `Security Deposit (Migrated) - ID: ${deposit.id}`
                });

                if (tx1) console.error(`Failed deposit IN ${deposit.id}:`, tx1);
                else depositCount++;

                // 2. Refund (Out) - If status is refunded
                if (deposit.status === 'refunded' || deposit.status === 'Refunded') {
                    const { error: tx2 } = await supabase.from('finance_transactions').insert({
                        occurred_at: new Date().toISOString(), // Unknown refund date, use now or create date + duration
                        direction: 'out',
                        type: 'refund',
                        source: 'deposit',
                        status: 'paid',
                        amount_gross: deposit.amount,
                        amount_net: deposit.amount,
                        currency: 'GBP',
                        deposit_id: deposit.id,
                        notes: `Deposit Refund (Migrated) - ID: ${deposit.id}`
                    });
                    if (tx2) console.error(`Failed deposit OUT ${deposit.id}:`, tx2);
                    else depositCount++;
                }
            }
        }
        console.log(`✅ Migrated ${depositCount} deposit transactions.`);
        totalMigrated += depositCount;
    }

    // 3. Backfill PCN Tickets (Paid)
    console.log("\n--- Migrating PCN Tickets ---");
    const { data: tickets, error: pcnError } = await supabase
        .from('pcn_tickets')
        .select('*')
        .eq('status', 'paid');

    if (pcnError) console.error("Error fetching PCN tickets:", pcnError);
    else {
        console.log(`Found ${tickets.length} paid PCN tickets.`);
        let pcnCount = 0;

        for (const ticket of tickets) {
            const { data: existing } = await supabase
                .from('finance_transactions')
                .select('id') // Added select
                .eq('type', 'pcn_ticket')
                .ilike('notes', `%${ticket.ticket_number}%`)
                .single();

            if (!existing) {
                // Determine direction. Usually PCN is a cost (out) if we pay it, or revenue (in) if client pays us.
                // Assuming client paid us -> IN.
                // If we paid authority -> OUT.
                // For simplicity in migration, assume we are logging the REVENUE from client for the ticket.
                // Or if it's just a cost we paid?
                // Let's assume it's IN (Reimbursement) based on previous patterns.

                const { error: tx } = await supabase.from('finance_transactions').insert({
                    occurred_at: ticket.paid_at || ticket.created_at,
                    direction: 'in', // Client paying us
                    type: 'pcn_ticket',
                    source: 'manual', // or booking
                    status: 'paid',
                    amount_gross: ticket.amount,
                    amount_net: ticket.amount,
                    currency: 'GBP',
                    booking_id: ticket.booking_id,
                    vehicle_id: ticket.vehicle_id,
                    notes: `PCN Ticket Reference: ${ticket.ticket_number} (Migrated)`
                });

                if (tx) console.error(`Failed PCN ${ticket.id}:`, tx);
                else pcnCount++;
            }
        }
        console.log(`✅ Migrated ${pcnCount} PCN transactions.`);
        totalMigrated += pcnCount;
    }

    // 4. Backfill Company Expenses (Legacy)
    console.log("\n--- Migrating Company Expenses ---");
    const { data: expenses, error: expError } = await supabase
        .from('company_expenses')
        .select('*');

    if (expError) console.error("Error fetching company expenses:", expError);
    else {
        console.log(`Found ${expenses.length} legacy expenses.`);
        let expCount = 0;

        for (const exp of expenses) {
            const { data: existing } = await supabase
                .from('finance_transactions')
                .select('id') // Added select
                .eq('source', 'manual') // Mapped to manual/vendor
                .ilike('notes', `%Legacy Expense: ${exp.title || exp.description}%`)
                .single();

            if (!existing) {
                const { error: tx } = await supabase.from('finance_transactions').insert({
                    occurred_at: exp.date || exp.created_at,
                    direction: 'out',
                    type: 'one_time_charge', // Generic type
                    source: 'manual', // Migrated as manual
                    status: 'paid',
                    amount_gross: exp.amount,
                    amount_net: exp.amount,
                    currency: 'GBP',
                    notes: `Legacy Expense: ${exp.title || exp.description} (Category: ${exp.category})`
                });

                if (tx) console.error(`Failed Expense ${exp.id}:`, tx);
                else expCount++;
            }
        }
        console.log(`✅ Migrated ${expCount} company expenses.`);
        totalMigrated += expCount;
    }

    console.log(`\n🎉 Migration Complete! Total transactions created: ${totalMigrated}`);
}

migrateData();
