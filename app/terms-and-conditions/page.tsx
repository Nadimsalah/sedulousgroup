"use client"

import { useEffect } from "react"
import { Scale, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TermsAndConditionsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-red-950/20 to-black border-b border-red-900/20">
        <div className="container mx-auto px-4 py-16">
          <Link href="/">
            <Button variant="ghost" className="mb-8 text-white hover:text-red-400">
              ← Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <Scale className="h-12 w-12 text-red-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">Terms and Conditions</h1>
          </div>
          <p className="text-lg text-gray-300 max-w-3xl">
            Please read these terms and conditions carefully before using our services.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>
                These Terms and Conditions outline the rules and regulations for the use of Sedulous Group's Website,
                located at www.sedulousgroup.net.
              </p>
              <p>
                By accessing this website we assume you accept these terms and conditions. Do not continue to use
                sedulousgroup.net if you do not agree to take all of the terms and conditions stated on this page.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Cookies</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>
                We employ the use of cookies. By accessing sedulousgroup.net, you agreed to use cookies in agreement
                with the Sedulous Group's Privacy Policy.
              </p>
              <p>
                Most interactive websites use cookies to let us retrieve the user's details for each visit. Cookies are
                used by our website to enable the functionality of certain areas to make it easier for people visiting
                our website. Some of our affiliate/advertising partners may also use cookies.
              </p>
            </CardContent>
          </Card>

          {/* License */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">License</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>
                Unless otherwise stated, Sedulous Group and/or its licensors own the intellectual property rights for
                all material on sedulousgroup.net. All intellectual property rights are reserved. You may access this
                from sedulousgroup.net for your own personal use subjected to restrictions set in these terms and
                conditions.
              </p>
              <p className="text-white font-semibold">You must not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Republish material from sedulousgroup.net</li>
                <li>Sell, rent or sub-license material from sedulousgroup.net</li>
                <li>Reproduce, duplicate or copy material from sedulousgroup.net</li>
                <li>Redistribute content from sedulousgroup.net</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Comments */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">User Comments</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>
                Parts of this website offer an opportunity for users to post and exchange opinions and information in
                certain areas of the website. Sedulous Group does not filter, edit, publish or review Comments prior to
                their presence on the website. Comments do not reflect the views and opinions of Sedulous Group, its
                agents and/or affiliates. Comments reflect the views and opinions of the person who post their views and
                opinions. To the extent permitted by applicable laws, Sedulous Group shall not be liable for the
                Comments or for any liability, damages or expenses caused and/or suffered as a result of any use of
                and/or posting of and/or appearance of the Comments on this website.
              </p>
              <p>
                Sedulous Group reserves the right to monitor all Comments and to remove any Comments which can be
                considered inappropriate, offensive or causes breach of these Terms and Conditions.
              </p>
              <p className="text-white font-semibold">You warrant and represent that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  You are entitled to post the Comments on our website and have all necessary licenses and consents to
                  do so;
                </li>
                <li>
                  The Comments do not invade any intellectual property right, including without limitation copyright,
                  patent or trademark of any third party;
                </li>
                <li>
                  The Comments do not contain any defamatory, libelous, offensive, indecent or otherwise unlawful
                  material which is an invasion of privacy
                </li>
                <li>
                  The Comments will not be used to solicit or promote business or custom or present commercial
                  activities or unlawful activity.
                </li>
              </ul>
              <p>
                You hereby grant Sedulous Group a non-exclusive license to use, reproduce, edit and authorize others to
                use, reproduce and edit any of your Comments in any and all forms, formats or media.
              </p>
            </CardContent>
          </Card>

          {/* Hyperlinking */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Hyperlinking to our Content</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p className="text-white font-semibold">
                The following organizations may link to our Website without prior written approval:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Government agencies;</li>
                <li>Search engines;</li>
                <li>News organizations;</li>
                <li>
                  Online directory distributors may link to our Website in the same manner as they hyperlink to the
                  Websites of other listed businesses; and
                </li>
                <li>
                  System wide Accredited Businesses except soliciting non-profit organizations, charity shopping malls,
                  and charity fundraising groups which may not hyperlink to our Web site.
                </li>
              </ul>
              <p>
                These organizations may link to our home page, to publications or to other Website information so long
                as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or
                approval of the linking party and its products and/or services; and (c) fits within the context of the
                linking party's site.
              </p>
            </CardContent>
          </Card>

          {/* iFrames */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">iFrames</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>
                Without prior approval and written permission, you may not create frames around our Webpages that alter
                in any way the visual presentation or appearance of our Website.
              </p>
            </CardContent>
          </Card>

          {/* Content Liability */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Content Liability</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>
                We shall not be hold responsible for any content that appears on your Website. You agree to protect and
                defend us against all claims that is rising on your Website. No link(s) should appear on any Website
                that may be interpreted as libelous, obscene or criminal, or which infringes, otherwise violates, or
                advocates the infringement or other violation of, any third party rights.
              </p>
            </CardContent>
          </Card>

          {/* Your Privacy */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Your Privacy</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>
                Please read our{" "}
                <Link href="/privacy-policy" className="text-red-400 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          {/* Reservation of Rights */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Reservation of Rights</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>
                We reserve the right to request that you remove all links or any particular link to our Website. You
                approve to immediately remove all links to our Website upon request. We also reserve the right to amen
                these terms and conditions and it's linking policy at any time. By continuously linking to our Website,
                you agree to be bound to and follow these linking terms and conditions.
              </p>
            </CardContent>
          </Card>

          {/* Removal of Links */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Removal of links from our website</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>
                If you find any link on our Website that is offensive for any reason, you are free to contact and inform
                us any moment. We will consider requests to remove links but we are not obligated to or so or to respond
                to you directly.
              </p>
              <p>
                We do not ensure that the information on this website is correct, we do not warrant its completeness or
                accuracy; nor do we promise to ensure that the website remains available or that the material on the
                website is kept up to date.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p className="text-white font-semibold">
                To the maximum extent permitted by applicable law, we exclude all representations, warranties and
                conditions relating to our website and the use of this website. Nothing in this disclaimer will:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>limit or exclude our or your liability for death or personal injury;</li>
                <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
                <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
                <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
              </ul>
              <p>
                The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a)
                are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer,
                including liabilities arising in contract, in tort and for breach of statutory duty.
              </p>
              <p>
                As long as the website and the information and services on the website are provided free of charge, we
                will not be liable for any loss or damage of any nature.
              </p>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <Card className="bg-zinc-900 border-red-900/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-red-400" />
                <CardTitle className="text-white">Last Updated</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p>These terms and conditions were last updated on December 6, 2025.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
