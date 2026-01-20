
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verify() {
    console.log("Checking tables...");

    const { data: transactions, error: tError } = await supabase
        .from("finance_transactions")
        .select("id")
        .limit(1);

    if (tError) {
        console.error("Error accessing finance_transactions:", tError.message);
    } else {
        console.log("finance_transactions table exists and is accessible.");
    }

    const { data: recurring, error: rError } = await supabase
        .from("finance_recurring_charges")
        .select("id")
        .limit(1);

    if (rError) {
        console.error("Error accessing finance_recurring_charges:", rError.message);
    } else {
        console.log("finance_recurring_charges table exists and is accessible.");
    }
}

verify();
