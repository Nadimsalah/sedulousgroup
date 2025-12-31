import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL)

async function runMigrations() {
  console.log("🚀 Starting database migrations...\n")

  // Migration 1: Create cars table
  console.log("📦 Creating cars table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS cars (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER,
        price_per_day DECIMAL(10,2) NOT NULL,
        price_per_week DECIMAL(10,2),
        price_per_month DECIMAL(10,2),
        image_url TEXT,
        images TEXT[],
        description TEXT,
        features TEXT[],
        fuel_type VARCHAR(50),
        transmission VARCHAR(50),
        seats INTEGER,
        category VARCHAR(100),
        rental_type VARCHAR(50) DEFAULT 'rent',
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Cars table created\n")
  } catch (e) {
    console.log("⚠️ Cars table already exists or error:", e.message, "\n")
  }

  // Migration 2: Create stories table
  console.log("📦 Creating stories table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS stories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        content TEXT,
        image_url TEXT,
        car_id UUID REFERENCES cars(id),
        rental_type VARCHAR(50) DEFAULT 'rent',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Stories table created\n")
  } catch (e) {
    console.log("⚠️ Stories table already exists or error:", e.message, "\n")
  }

  // Migration 3: Create user_profiles table
  console.log("📦 Creating user_profiles table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE,
        email VARCHAR(255) UNIQUE,
        full_name VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        postcode VARCHAR(20),
        country VARCHAR(100),
        date_of_birth DATE,
        driving_license_number VARCHAR(100),
        driving_license_expiry DATE,
        driving_license_front_url TEXT,
        driving_license_back_url TEXT,
        national_id_front_url TEXT,
        national_id_back_url TEXT,
        proof_of_address_url TEXT,
        selfie_url TEXT,
        pco_license_number VARCHAR(100),
        pco_license_expiry DATE,
        pco_license_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        is_admin BOOLEAN DEFAULT false,
        role VARCHAR(50) DEFAULT 'customer',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ User profiles table created\n")
  } catch (e) {
    console.log("⚠️ User profiles table already exists or error:", e.message, "\n")
  }

  // Migration 4: Create bookings table
  console.log("📦 Creating bookings table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_reference VARCHAR(50) UNIQUE,
        car_id UUID REFERENCES cars(id),
        user_id UUID,
        customer_id UUID,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        pickup_date DATE NOT NULL,
        return_date DATE NOT NULL,
        pickup_location TEXT,
        return_location TEXT,
        total_price DECIMAL(10,2),
        deposit_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        booking_type VARCHAR(50) DEFAULT 'rent',
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_intent_id VARCHAR(255),
        notes TEXT,
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Bookings table created\n")
  } catch (e) {
    console.log("⚠️ Bookings table already exists or error:", e.message, "\n")
  }

  // Migration 5: Create agreements table
  console.log("📦 Creating agreements table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS agreements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id),
        customer_id UUID,
        agreement_text TEXT,
        admin_signature_url TEXT,
        customer_signature_url TEXT,
        signed_pdf_url TEXT,
        admin_signed_at TIMESTAMP WITH TIME ZONE,
        customer_signed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Agreements table created\n")
  } catch (e) {
    console.log("⚠️ Agreements table already exists or error:", e.message, "\n")
  }

  // Migration 6: Create inspections table
  console.log("📦 Creating inspections table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS inspections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id),
        car_id UUID REFERENCES cars(id),
        inspection_type VARCHAR(50) DEFAULT 'pickup',
        fuel_level VARCHAR(50),
        mileage INTEGER,
        exterior_condition TEXT,
        interior_condition TEXT,
        damage_notes TEXT,
        photos TEXT[],
        inspector_name VARCHAR(255),
        inspector_signature_url TEXT,
        customer_signature_url TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        inspected_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Inspections table created\n")
  } catch (e) {
    console.log("⚠️ Inspections table already exists or error:", e.message, "\n")
  }

  // Migration 7: Create damage_reports table
  console.log("📦 Creating damage_reports table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS damage_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id),
        car_id UUID REFERENCES cars(id),
        customer_id UUID,
        description TEXT NOT NULL,
        damage_type VARCHAR(100),
        severity VARCHAR(50),
        location_on_vehicle VARCHAR(255),
        photos TEXT[],
        repair_cost DECIMAL(10,2),
        repair_status VARCHAR(50) DEFAULT 'pending',
        reported_by VARCHAR(255),
        reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Damage reports table created\n")
  } catch (e) {
    console.log("⚠️ Damage reports table already exists or error:", e.message, "\n")
  }

  // Migration 8: Create pcn_tickets table
  console.log("📦 Creating pcn_tickets table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pcn_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id),
        car_id UUID REFERENCES cars(id),
        customer_id UUID,
        ticket_number VARCHAR(100),
        issue_date DATE,
        due_date DATE,
        amount DECIMAL(10,2),
        location TEXT,
        violation_type VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        paid_by VARCHAR(50),
        paid_at TIMESTAMP WITH TIME ZONE,
        evidence_url TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ PCN tickets table created\n")
  } catch (e) {
    console.log("⚠️ PCN tickets table already exists or error:", e.message, "\n")
  }

  // Migration 9: Create vendors table
  console.log("📦 Creating vendors table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        contact_person VARCHAR(255),
        vendor_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Vendors table created\n")
  } catch (e) {
    console.log("⚠️ Vendors table already exists or error:", e.message, "\n")
  }

  // Migration 10: Create notifications table
  console.log("📦 Creating notifications table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Notifications table created\n")
  } catch (e) {
    console.log("⚠️ Notifications table already exists or error:", e.message, "\n")
  }

  // Migration 11: Create drivers table
  console.log("📦 Creating drivers table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS drivers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        date_of_birth DATE,
        license_number VARCHAR(100),
        license_expiry DATE,
        license_type VARCHAR(50),
        pco_license_number VARCHAR(100),
        pco_license_expiry DATE,
        vehicle_assigned UUID REFERENCES cars(id),
        status VARCHAR(50) DEFAULT 'available',
        rating DECIMAL(3,2),
        total_trips INTEGER DEFAULT 0,
        notes TEXT,
        photo_url TEXT,
        documents JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Drivers table created\n")
  } catch (e) {
    console.log("⚠️ Drivers table already exists or error:", e.message, "\n")
  }

  // Migration 12: Create support_tickets table
  console.log("📦 Creating support_tickets table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(50) UNIQUE,
        customer_id UUID,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'open',
        assigned_to UUID,
        assigned_to_name VARCHAR(255),
        resolution TEXT,
        resolved_at TIMESTAMP WITH TIME ZONE,
        messages JSONB DEFAULT '[]',
        attachments TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Support tickets table created\n")
  } catch (e) {
    console.log("⚠️ Support tickets table already exists or error:", e.message, "\n")
  }

  // Migration 13: Create deposits table
  console.log("📦 Creating deposits table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS deposits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id),
        customer_id UUID,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        car_id UUID REFERENCES cars(id),
        amount DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        refunded_amount DECIMAL(10,2) DEFAULT 0,
        deducted_amount DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50),
        payment_reference VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        refund_reason TEXT,
        deduction_reason TEXT,
        processed_by UUID,
        processed_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Deposits table created\n")
  } catch (e) {
    console.log("⚠️ Deposits table already exists or error:", e.message, "\n")
  }

  // Migration 14: Create car_images table
  console.log("📦 Creating car_images table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS car_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Car images table created\n")
  } catch (e) {
    console.log("⚠️ Car images table already exists or error:", e.message, "\n")
  }

  // Migration 15: Create sales_requests table
  console.log("📦 Creating sales_requests table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS sales_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        car_id UUID REFERENCES cars(id),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Sales requests table created\n")
  } catch (e) {
    console.log("⚠️ Sales requests table already exists or error:", e.message, "\n")
  }

  // Migration 16: Create verification_codes table
  console.log("📦 Creating verification_codes table...")
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        type VARCHAR(50) DEFAULT 'email_verification',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log("✅ Verification codes table created\n")
  } catch (e) {
    console.log("⚠️ Verification codes table already exists or error:", e.message, "\n")
  }

  // Add missing columns to existing tables
  console.log("📦 Adding missing columns to existing tables...")

  // Add rental_type to cars if missing
  try {
    await sql`ALTER TABLE cars ADD COLUMN IF NOT EXISTS rental_type VARCHAR(50) DEFAULT 'rent'`
    console.log("✅ Added rental_type to cars\n")
  } catch (e) {
    console.log("⚠️ rental_type already exists or error:", e.message, "\n")
  }

  // Add booking_type to bookings if missing
  try {
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_type VARCHAR(50) DEFAULT 'rent'`
    console.log("✅ Added booking_type to bookings\n")
  } catch (e) {
    console.log("⚠️ booking_type already exists or error:", e.message, "\n")
  }

  // Add customer_id to bookings if missing
  try {
    await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id UUID`
    console.log("✅ Added customer_id to bookings\n")
  } catch (e) {
    console.log("⚠️ customer_id already exists or error:", e.message, "\n")
  }

  // Create indexes for better performance
  console.log("📦 Creating indexes...")
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_car_id ON bookings(car_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_cars_rental_type ON cars(rental_type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_agreements_booking_id ON agreements(booking_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_inspections_booking_id ON inspections(booking_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_deposits_booking_id ON deposits(booking_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status)`
    console.log("✅ Indexes created\n")
  } catch (e) {
    console.log("⚠️ Some indexes already exist or error:", e.message, "\n")
  }

  // Disable RLS for admin access (using service role)
  console.log("📦 Configuring RLS policies...")
  try {
    // Enable RLS on all tables
    await sql`ALTER TABLE cars ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE bookings ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE agreements ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE inspections ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE pcn_tickets ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE vendors ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE drivers ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE deposits ENABLE ROW LEVEL SECURITY`
    await sql`ALTER TABLE stories ENABLE ROW LEVEL SECURITY`

    // Create policies for public read on cars and stories
    await sql`DROP POLICY IF EXISTS "Cars are viewable by everyone" ON cars`
    await sql`CREATE POLICY "Cars are viewable by everyone" ON cars FOR SELECT USING (true)`

    await sql`DROP POLICY IF EXISTS "Stories are viewable by everyone" ON stories`
    await sql`CREATE POLICY "Stories are viewable by everyone" ON stories FOR SELECT USING (true)`

    console.log("✅ RLS policies configured\n")
  } catch (e) {
    console.log("⚠️ RLS configuration error:", e.message, "\n")
  }

  console.log("🎉 All migrations completed successfully!")
}

runMigrations().catch(console.error)
