import type React from "react"
import type { Metadata } from "next"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { BeforeAfter } from "./_components/before-after"
import { Camera, Grid2X2, Scissors, Wand2 } from "lucide-react"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "3D Product Rendering",
}

export default function Page() {
  return (
    <main className="bg-background text-foreground">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-10 md:pt-16">
        <div className="flex items-center justify-center">
          <Badge className="rounded-full bg-secondary text-secondary-foreground">Master the iPhone</Badge>
        </div>

        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-center text-4xl font-semibold leading-tight md:text-6xl">
          <span className="italic font-normal">Learn</span> <span className="font-extrabold">the correct</span>{" "}
          <span className="italic font-normal">way to</span> use your iPhone camera
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          In this step-by-step course, learn the exact settings and techniques to capture amazing photos with your
          iPhone. No experience needed — just follow the steps and see the difference!
        </p>

        <div className="mt-6 flex justify-center">
          <Button size="lg" className="rounded-lg">
            Purchase – $49
            <span className="ml-2 text-sm text-muted-foreground line-through">$79</span>
          </Button>
        </div>

        {/* promo badge under CTA */}
        <div className="mt-6 flex justify-center">
          <div className="rounded-full bg-secondary px-4 py-2 text-sm shadow-sm">
            <span className="mr-2">✦</span> Win a new iPhone 16 Pro and other prizes –{" "}
            <a className="underline" href="#prizes">
              Learn more
            </a>
            <span className="ml-2">✦</span>
          </div>
        </div>

        {/* horizontal image strip */}
        <div className="mt-10 overflow-x-auto pb-2">
          <div className="flex gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="relative h-56 w-80 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={`/photo-grid-.jpg?height=320&width=640&query=photo%20grid%20${i + 1}`}
                  alt={`Sample ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">All photos shot on iPhone.</p>
      </section>

      {/* What you'll learn */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-center text-3xl font-semibold md:text-4xl">What you'll learn.</h2>
        <div className="grid gap-8 md:grid-cols-4">
          <Feature
            icon={<Camera className="h-5 w-5" />}
            title="Best Camera Settings"
            desc="Discover the exact settings to use for different photo scenarios, ensuring sharp and vibrant results every time."
          />
          <Feature
            icon={<Grid2X2 className="h-5 w-5" />}
            title="Better Composition"
            desc="Learn easy tricks to frame your shots like a pro, making every picture look great."
          />
          <Feature
            icon={<Scissors className="h-5 w-5" />}
            title="Quick Editing Tips"
            desc="Enhance your photos directly on your iPhone with simple editing techniques anyone can use."
          />
          <Feature
            icon={<Wand2 className="h-5 w-5" />}
            title="iPhone Camera Tricks"
            desc="Discover hidden features and shortcuts that will take your photography to the next level."
          />
        </div>
      </section>

      {/* Why this course */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
        <div className="relative overflow-hidden rounded-2xl">
          <Image
            src="/macro-iphone-camera.jpg"
            alt="iPhone camera macro"
            width={1100}
            height={800}
            className="h-auto w-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-3xl font-semibold md:text-4xl">Why this course.</h3>
          <ul className="mt-6 space-y-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">For All Levels</strong>
              <br />
              Whether you're a complete beginner or already have some experience, this course is designed to provide
              value for everyone.
            </li>
            <li>
              <strong className="text-foreground">Easy to Understand</strong>
              <br />
              No confusing terms or technical talk — just straightforward advice you can use right away.
            </li>
            <li>
              <strong className="text-foreground">Proven Techniques</strong>
              <br />
              Inspired by popular videos, these methods have already helped thousands improve their photos.
            </li>
            <li>
              <strong className="text-foreground">Learn at Your Own Pace</strong>
              <br />
              Enjoy lifetime access so you can learn whenever it's convenient for you.
            </li>
          </ul>
        </div>
      </section>

      {/* Included resource with before/after */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <Badge className="rounded-full bg-secondary text-secondary-foreground">Included Resource</Badge>
          <h3 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
            Included — Two Lightroom preset packs
          </h3>
          <p className="mt-2 text-sm font-medium text-primary">Total value $78</p>
          <p className="mt-4 text-muted-foreground">
            Included with the course is a pack of Lightroom presets that make it quick and easy to apply professional
            looks to your images. Specifically designed for photos shot on iPhone.
          </p>
        </div>
        <BeforeAfter
          beforeSrc="/before-building-fa-ade.jpg"
          afterSrc="/after-building-fa-ade.jpg"
          className="mx-auto w-full max-w-xl"
        />
      </section>

      {/* Shot on iPhone gallery */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <h3 className="text-center text-3xl font-semibold md:text-4xl">Shot on iPhone.</h3>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          All of the photos you see here are shot on the iPhone. This is exactly the type of images you'll be able to
          reproduce after taking this course.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl">
              <Image
                src={`/large-gallery-image-.jpg?height=900&width=1200&query=large%20gallery%20image%20${i}`}
                alt={`Gallery ${i}`}
                width={1200}
                height={900}
                className="h-auto w-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner with soft gradient */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="rounded-2xl bg-secondary/70 px-6 py-10 text-center">
          <h3 className="text-2xl font-semibold md:text-3xl">Get started with your iPhone photography journey</h3>
          <div className="mt-6 flex justify-center">
            <Button size="lg" className="rounded-lg">
              Purchase – $49 <span className="ml-2 text-sm text-muted-foreground line-through">$79</span>
            </Button>
          </div>
          <div id="prizes" className="mt-6 inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm">
            ✦ Win prizes! ✦
          </div>
        </div>
      </section>

      {/* Prize cards */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          {[{ title: "iPhone 16 Pro" }, { title: "AirPods Pro" }, { title: "$50 Gift Card" }].map((item, i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-6">
                <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-xl">
                  <Image
                    src={`/.jpg?height=320&width=320&query=${encodeURIComponent(item.title)}`}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="mt-4 text-center font-medium">{item.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="rounded-2xl bg-secondary p-6 md:p-10">
          <h3 className="mb-6 text-center text-3xl font-semibold md:text-4xl">FAQ</h3>
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger>Which iPhone do I need?</AccordionTrigger>
                <AccordionContent>
                  We would recommend a recent Pro model, due to the heavy importance of ProRAW and larger sensor, only
                  usually available on the Pro models.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>What's included in the course?</AccordionTrigger>
                <AccordionContent>
                  Step-by-step lessons, presets, and lifetime access so you can learn at your own pace.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>Who is this course for?</AccordionTrigger>
                <AccordionContent>
                  Beginners to intermediate users who want to consistently take better photos with their iPhone.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
    </main>
  )
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground/80">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
