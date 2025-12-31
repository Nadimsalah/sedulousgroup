import { SiteHeader } from "@/components/site-header"
import { AppverseFooter } from "@/components/appverse-footer"
import { Shield, Lock, Eye, Users, FileText, Clock, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export const metadata = {
  title: "Privacy Policy | Sedulous Group",
  description: "Learn how Sedulous Group protects your privacy and handles your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader />

      <div className="container mx-auto px-4 py-24">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-red-500/10 p-4">
            <Shield className="h-12 w-12 text-red-400" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">Privacy Policy</h1>
          <p className="mx-auto max-w-3xl text-lg text-neutral-300">
            Sedulous Group – Car Rental Van Rental London Vehicle Rental Self Drive Hire UK
          </p>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Introduction */}
          <section>
            <Card className="border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h2 className="mb-6 text-3xl font-bold text-white">Privacy Policy</h2>
              <p className="leading-relaxed text-neutral-300">
                Sedulous Group – Car Rental Van Rental London Vehicle Rental Self Drive Hire UK is committed to
                protecting your privacy and developing technology that gives you the most powerful and safe online
                experience. This Statement of Privacy applies to the Sedulous Group – Car Rental Van Rental London
                Vehicle Rental Self Drive Hire UK Web site and governs data collection and usage. By using the Sedulous
                Group – Car Rental Van Rental London Vehicle Rental Self Drive Hire UK website, you consent to the data
                practices described in this statement.
              </p>
            </Card>
          </section>

          {/* Collection of Personal Information */}
          <section>
            <Card className="border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h2 className="mb-6 text-3xl font-bold text-white">Collection of your Personal Information</h2>
              <p className="leading-relaxed text-neutral-300">
                Sedulous Group Car Rental Van Rental London Vehicle Rental Self Drive Hire UK collects personally
                identifiable information, such as your e-mail address, name, home or work address or telephone number.
              </p>
            </Card>
          </section>

          {/* Privacy Statement */}
          <section>
            <Card className="border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <h2 className="mb-6 text-3xl font-bold text-white">Privacy Statement</h2>
              <p className="mb-6 leading-relaxed text-neutral-300">
                This statement explains what types of information we collect from you, how it is used by us, how we
                share it with others, how you can manage the information we hold and how you can contact us.
              </p>
              <p className="leading-relaxed text-neutral-300">
                The contents of this statement may change from time to time so please check this page occasionally to
                ensure you are still happy to share your information with us. Where possible, we will also contact you
                directly to notify you of these changes.
              </p>
            </Card>
          </section>

          {/* Information Collection */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-red-400" />
              <h2 className="text-3xl font-bold text-white">THE INFORMATION THAT WE COLLECT</h2>
            </div>
            <Card className="border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <p className="mb-6 leading-relaxed text-neutral-300">
                We collect information about you when you engage with us either through our call centre, our website,
                other digital platforms or our partners. Some of this information does not identify you personally, but
                provides us with information about how you use our services and engage with us (we use this information
                to improve our services and make them more useful to you). The information we collect includes some or
                all of the following:
              </p>
              <ul className="space-y-3 text-neutral-300">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    Your personal details including name, date of birth, address, employment, and contact details
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    Your banking and financial information where you may provide it (including income, expenditure, and
                    previous credit history)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Information about your lifestyle and home ownership</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    Identifiers assigned to your computer or other devices, including your Internet Protocol (IP)
                    address
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Cookie information</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Details of communications between us (for example emails or call recordings)</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Any other information which you may provide to us</span>
                </li>
              </ul>
            </Card>
          </section>

          {/* How We Use Information */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-red-400" />
              <h2 className="text-3xl font-bold text-white">HOW WE USE YOUR INFORMATION</h2>
            </div>
            <Card className="border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <p className="mb-6 leading-relaxed text-neutral-300">
                We use the information we collect for the following purposes:
              </p>
              <ul className="space-y-3 text-neutral-300">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Administering your vehicle quotes and policies.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Carrying out anti-fraud and anti-money laundering checks and verifying your identity.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    Assessing financial risks, including carrying out credit reference checks and credit scoring
                    assessments.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Broking your finance agreement and any related services.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Using your payment details to process payments or refunds.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Sending you information about your end-of-contract obligations and renewals.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    Communicating with you about your quotes and policies, including responding to your inquiries.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Administering debt recoveries.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Undertaking market research and statistical analysis.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>Fulfilling our obligations owed to a relevant regulator or authority.</span>
                </li>
              </ul>
              <div className="mt-6 rounded-lg bg-red-500/10 p-4">
                <p className="text-sm leading-relaxed text-neutral-300">
                  Our "legitimate interests" as referred to in this document include our legitimate business purposes
                  and commercial interests in operating our business in a customer-focused, efficient, and sustainable
                  manner, in accordance with all applicable legal and regulatory requirements.
                </p>
              </div>
            </Card>
          </section>

          {/* Data Retention */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <Clock className="h-6 w-6 text-red-400" />
              <h2 className="text-3xl font-bold text-white">HOW LONG DO WE KEEP YOUR INFORMATION FOR?</h2>
            </div>
            <Card className="border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <p className="leading-relaxed text-neutral-300">
                We will not hold your personal information for any longer than is necessary. If you are a customer or
                otherwise have a relationship with us, we will hold personal information about you for a longer period
                than if we have obtained your details in connection with a prospective relationship. In any event, the
                retention period will be the statutory retention period unless there is a further legal or regulatory
                requirement to do so.
              </p>
            </Card>
          </section>

          {/* Your Rights */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-6 w-6 text-red-400" />
              <h2 className="text-3xl font-bold text-white">HOW CAN YOU MANAGE THE INFORMATION WE HOLD ABOUT YOU?</h2>
            </div>
            <Card className="border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <p className="mb-6 leading-relaxed text-neutral-300">
                Under the data protection act you have certain rights in relation to the data we hold about you. Under
                GDPR these rights are extended and listed below:
              </p>
              <ul className="space-y-3 text-neutral-300">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>to obtain access to, and copies of, the personal information that we hold about you;</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    to require that we cease processing your personal information if the processing is causing you
                    damage or distress;
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>to require us not to send you marketing communications.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>to require us to erase your personal information;</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>to require us to restrict or object to our data processing activities;</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    to receive from us the personal information we hold about you which you have provided to us, in a
                    reasonable format specified by you, including for the purpose of you transmitting that personal
                    information to another data controller; and
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>to require us to correct the personal information we hold about you if it is incorrect.</span>
                </li>
              </ul>
              <div className="mt-6 rounded-lg bg-yellow-500/10 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-400" />
                  <p className="text-sm leading-relaxed text-neutral-300">
                    Please note that these rights may be limited by data protection legislation, and we may be entitled
                    to refuse requests where exceptions apply.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Automated Decisions */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <Lock className="h-6 w-6 text-red-400" />
              <h2 className="text-3xl font-bold text-white">AUTOMATED DECISIONS AND PROFILING</h2>
            </div>
            <Card className="border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <p className="leading-relaxed text-neutral-300">
                We will never make automated decisions when processing your data nor will we use profiling techniques.
              </p>
            </Card>
          </section>

          {/* Data Sharing */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <Eye className="h-6 w-6 text-red-400" />
              <h2 className="text-3xl font-bold text-white">WHO DO WE SHARE THIS WITH?</h2>
            </div>
            <Card className="border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <p className="mb-6 leading-relaxed text-neutral-300">
                We do not sell your information to third parties, but we do work closely with third party suppliers who
                fulfil business activities for us. In these situations we will only share the information that is
                necessary for the third party to perform the processing activity it was provided for, such as:
              </p>
              <ul className="space-y-3 text-neutral-300">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    third party service providers who support the operation of our business, such as IT and marketing
                    suppliers, financial service providers, delivery companies, dealer groups and debt collection
                    agencies (as is necessary for the performance of a contract between you and us and/or as is
                    necessary for our legitimate interests);
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    third party insurance providers (as is necessary for the performance of a contract between you and
                    us and/or as is necessary for our legitimate interests).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    fraud prevention agencies and associations, (as is necessary for compliance with our legal
                    obligations and/or as is necessary for our legitimate interests);
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <span>
                    regulators and law enforcement agencies, including the police, the Financial Conduct Authority or
                    any other relevant authority who may have jurisdiction (as is necessary for compliance with our
                    legal obligations).
                  </span>
                </li>
              </ul>
              <p className="mt-6 leading-relaxed text-neutral-300">
                Some of these third parties may also be considered a data controller in respect of holding your personal
                data. In these cases, we will provide you with the privacy statements of those parties.
              </p>
            </Card>
          </section>

          {/* Back to Home */}
          <div className="text-center pt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-red-500 px-8 py-3 font-semibold text-white transition-all hover:bg-red-600"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <AppverseFooter />
    </main>
  )
}
