"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { Menu, Building2, Tag, HelpCircle, Info, ChevronDown, Package } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"

export function SiteHeaderArchviz() {
  const [servicesOpen, setServicesOpen] = useState(false)

  const services = [
    {
      href: "/3D-architecture-visualization-studio",
      label: "Architectural Visualization",
      icon: Building2,
      description: "Photoreal 3D renders & CGI walkthroughs",
    },
    {
      href: "/3d-product-rendering",
      label: "3D Product Rendering",
      icon: Package,
      description: "Studio-quality product visuals",
    },
    {
      href: "/",
      label: "3D Product Animation",
      icon: Package,
      description: "Motion-led storytelling for products",
    },
  ]

  const links = [
    { href: "#pricing", label: "Pricing", icon: Tag },
    { href: "#faq", label: "FAQ", icon: HelpCircle },
    { href: "#about", label: "About", icon: Info },
  ]

  return (
    <header className="sticky top-0 z-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex h-14 items-center justify-between px-6 liquid-glass-header rounded-full">
          <Link href="/3D-architecture-visualization-studio" className="flex items-center gap-1.5">
            <Image src="/icons/skitbit-white.svg" alt="Skitbit logo" width={20} height={20} className="h-5 w-5" />
            <span className="font-semibold tracking-wide text-white">Skitbit ArchViz</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/90 md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className="bg-transparent text-white/90 hover:text-lime-300 data-[state=open]:text-lime-300
                               hover:bg-transparent focus:bg-transparent
                               data-[state=open]:bg-transparent data-[state=open]:hover:bg-transparent
                               data-[active=true]:bg-transparent"
                  >
                    Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[280px] gap-2 p-3 bg-gray-950/95 backdrop-blur-xl border border-gray-800 rounded-lg">
                      {services.map((service) => (
                        <li key={service.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={service.href}
                              className="group relative flex items-start gap-3 rounded-xl p-3 transition-all
                                         hover:bg-white/5 hover:ring-1 hover:ring-lime-300/60
                                         hover:shadow-[0_0_0_1px_rgba(163,230,53,0.25),0_0_20px_rgba(163,230,53,0.15)]
                                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/70"
                            >
                              <service.icon className="h-5 w-5 text-lime-400 mt-0.5 shrink-0 group-hover:text-lime-300" />
                              <div>
                                <div className="text-sm font-medium text-white group-hover:text-lime-300">
                                  {service.label}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{service.description}</p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-lime-300 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex">
            <Button
              asChild
              className="bg-lime-400 text-black font-medium rounded-lg px-6 py-2.5 hover:bg-lime-300 hover:shadow-md hover:scale-[1.02] transition-all"
            >
              <Link href="https://wa.link/65mf3i" target="_blank">
                Get ArchViz Quote
              </Link>
            </Button>
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-700 bg-gray-900/80 text-gray-200 hover:bg-gray-800"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="liquid-glass border-gray-800 p-0 w-64 flex flex-col">
                <div className="flex items-center gap-1.5 px-4 py-4 border-b border-gray-800">
                  <Image src="/icons/skitbit-white.svg" alt="Skitbit logo" width={24} height={24} className="h-6 w-6" />
                  <span className="font-semibold tracking-wide text-white text-lg">Skitbit ArchViz</span>
                </div>
                <nav className="flex flex-col gap-1 mt-2 text-gray-200">
                  <Collapsible open={servicesOpen} onOpenChange={setServicesOpen}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-900 hover:text-lime-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-gray-400">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <span className="text-sm">Services</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${servicesOpen ? "rotate-180" : ""}`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="flex flex-col bg-gray-900/50 border-l-2 border-lime-400/30 ml-4">
                        {services.map((service) => (
                          <Link
                            key={service.href}
                            href={service.href}
                            className="flex items-center gap-3 pl-8 pr-4 py-2.5 hover:bg-gray-900 hover:text-lime-300 transition-colors"
                          >
                            <service.icon className="h-4 w-4 text-lime-400/70" />
                            <span className="text-sm">{service.label}</span>
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900 hover:text-lime-300 transition-colors"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 text-gray-400">
                        <l.icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm">{l.label}</span>
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto border-t border-gray-800 p-4">
                  <Button
                    asChild
                    className="w-full bg-lime-400 text-black font-medium rounded-lg px-6 py-2.5 hover:bg-lime-300 hover:shadow-md hover:scale-[1.02] transition-all"
                  >
                    <Link href="https://wa.link/65mf3i" target="_blank">
                      Start a Project
                    </Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
