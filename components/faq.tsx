"use client"

import { useState } from "react"
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: "How old do I need to be to rent a car?",
    answer:
      "To rent a car with Sedulous Group Ltd, you must be 25 years old or older, but no older than 70 years old. This age range ensures compliance with insurance requirements and allows us to provide a safe and reliable rental experience for all our customers.",
  },
  {
    question: "What documents do I need to rent a car?",
    answer:
      "To rent a car with Sedulous Group Ltd, you will need to provide the following documents: A photo of your driving license (front and back) that has been held for a minimum of 2 years. Proof of address dated within the last 3 months. Your National Insurance (NI) number. Your DVLA driver check code. These documents are required to verify your identity, driving history, and eligibility to ensure a smooth and efficient rental process.",
  },
  {
    question: "What types of vehicles are available for rent?",
    answer:
      "At Sedulous Group Ltd, we offer a wide and diverse range of vehicles to suit every need and preference. Our fleet includes everything from compact cars and family saloons to SUVs, vans, and luxury vehicles. Whether you're looking for a practical option for everyday use, a spacious vehicle for a family trip, or a premium car for a special occasion, we have you covered. With options to meet business, leisure, and personal transportation needs, our selection ensures you'll find the perfect vehicle for any journey. At Sedulous Group Ltd, we have essentially every type of vehicle available to make your trip seamless and enjoyable.",
  },
  {
    question: "Fuel Policy",
    answer:
      "When renting a vehicle from Sedulous Group Ltd, we require that the car is returned with the same amount of fuel as it was at the time of collection. If the vehicle is returned with less fuel, you will be charged for the difference based on the number of miles. This ensures fairness and consistency for all customers. Please ensure you refuel the vehicle to the same level provided at pick-up to avoid additional charges.",
  },
  {
    question: "Can I Add Additional Drivers to My Rental?",
    answer:
      "Yes, you can add additional drivers to your rental, provided they meet our requirements and are approved. Additional drivers will be added at an extra cost, and all drivers must meet our age and documentation criteria. This ensures that all drivers are covered under our insurance and eligible to operate the vehicle. If you'd like to add an additional driver, please inform us in advance so we can process the necessary checks and update your rental agreement accordingly.",
  },
  {
    question: "What Happens If I Return the Vehicle Late?",
    answer:
      "If you anticipate being late in returning your vehicle, a member of our team will contact you before your rental agreement ends to provide a friendly reminder. If the vehicle is still returned late without prior communication, you will be charged an additional late return fee. We encourage all customers to return their vehicles on time to avoid extra costs and ensure a smooth process for all parties. If you need an extension, please inform us as early as possible.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-lg">
            Find answers to your questions from our previous answers
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-red-500/30"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors"
              >
                <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-red-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-5 text-gray-300 leading-relaxed border-t border-white/5 pt-4">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Still have questions?</p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-xl bg-white/5 border border-white/10 text-white hover:bg-red-500 hover:border-red-500 transition-all duration-300"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  )
}
