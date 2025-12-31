import EditCarForm from "@/components/edit-car-form"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: car, error } = await supabase.from("cars").select("*").eq("id", id).single()

  if (error || !car) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Car Not Found</h1>
          <Link href="/admin/cars" className="text-red-500 hover:text-red-600">
            Back to Cars
          </Link>
        </div>
      </div>
    )
  }

  return <EditCarForm car={car} />
}
