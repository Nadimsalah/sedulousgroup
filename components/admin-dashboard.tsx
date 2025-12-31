"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { LayoutDashboard, Users, Calendar, UserCircle, CreditCard, FileText, Settings, HelpCircle, LogOut, Search, Bell, MapPin, Phone, TrendingUp, TrendingDown, ExternalLink, Car, Navigation, Menu, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LineChart, Line, ResponsiveContainer } from 'recharts'

const vehicleLocations = [
  { id: 1, lat: 51.505, lng: -0.09, car: "Range Rover Evoque", reg: "P 1234 CK", customer: "Rian Donovan", phone: "089765340927", date: "25 December, 2024", status: "Rental" },
  { id: 2, lat: 51.515, lng: -0.1, car: "Honda CR-V 1.5L", reg: "P 3252 DK", customer: "Tio Pandawa", phone: "089765340927", date: "30 December, 2024", status: "Rental" },
  { id: 3, lat: 51.51, lng: -0.08, car: "New Vellfire", reg: "D 3849 K", customer: "Sulistyowati", phone: "089765340927", date: "28 December, 2024", status: "Rental" },
]

export function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard")
  const [selectedVehicle, setSelectedVehicle] = useState(vehicleLocations[0])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Car, label: "Cars", href: "/admin/cars" },
    { icon: FileText, label: "Stories", href: "/admin/stories" },
    { icon: Users, label: "Drivers", href: "/admin/drivers" },
    { icon: Calendar, label: "Booking", href: "/admin/booking" },
    { icon: UserCircle, label: "Customer", href: "/admin/customers" },
    { icon: CreditCard, label: "Payment", href: "/admin/payments" },
    { icon: FileText, label: "Report", href: "/admin/reports" },
  ]

  const bottomNavItems = [
    { icon: Settings, label: "Settings", href: "/admin/settings" },
    { icon: HelpCircle, label: "Help & Support", href: "/admin/support" },
  ]

  const customerData = [
    { value: 15 },
    { value: 18 },
    { value: 12 },
    { value: 22 },
    { value: 19 },
    { value: 23 },
    { value: 20 },
  ]

  const orderData = [
    { value: 12 },
    { value: 15 },
    { value: 14 },
    { value: 18 },
    { value: 16 },
    { value: 19 },
    { value: 20 },
  ]

  const incomeData = [
    { value: 2500 },
    { value: 2200 },
    { value: 2400 },
    { value: 2100 },
    { value: 1900 },
    { value: 2100 },
    { value: 2000 },
  ]

  const expensesData = [
    { value: 350 },
    { value: 380 },
    { value: 400 },
    { value: 420 },
    { value: 410 },
    { value: 430 },
    { value: 425 },
  ]

  const chartDataMap: Record<string, any[]> = {
    Customer: customerData,
    Order: orderData,
    Income: incomeData,
    Expenses: expensesData,
  }

  const stats = [
    { label: "Customer", value: 20, change: -8, color: "red" },
    { label: "Order", value: 20, change: 12, color: "green" },
    { label: "Income", value: "$2,000", change: -24, color: "red" },
    { label: "Expenses", value: "$425", change: 19, color: "green" },
  ]

  const schedule = [
    { model: "R. R. Evoque", reg: "P 1234 CK", w2: "Rian Don...", w2Color: "bg-purple-500" },
    { model: "CR-V 1.5L", reg: "P 3252 DK", w1: "Tio Pandawa", w1Color: "bg-blue-500" },
    { model: "New Vellfire", reg: "D 3849 K", w2: "Sulistyowati", w2Color: "bg-purple-500" },
    { model: "New Almaz RS", reg: "DK 433 ZZ", w4: "Bobby Marwan", w4Color: "bg-blue-500" },
    { model: "Alphard G", reg: "AG 808 NN", w1: "Herman", w1Color: "bg-blue-500" },
  ]

  const orders = [
    {
      id: "RENT002",
      car: "Range Rover Evoque",
      reg: "P 1234 CK",
      customer: "Rian Donovan",
      phone: "089765340927",
      dueDate: "25 December, 2024",
      status: "In use",
    },
    {
      id: "RENT003",
      car: "Honda CR-V 1.5L Turbo",
      reg: "P 3252 DK",
      customer: "Tio Pandawa",
      phone: "089765340927",
      dueDate: "30 December, 2024",
      status: "In use",
    },
  ]

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[220px] bg-gray-950 text-white flex-col p-4 shrink-0">
        {/* Logo */}
        <div className="mb-8 px-4 py-2">
          <Image
            src="/images/dna-group-logo.png"
            alt="Sedulous Group Ltd"
            width={140}
            height={45}
            className="w-auto h-10"
          />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setActiveNav(item.label)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeNav === item.label
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                  : "text-gray-400 hover:bg-gray-900 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="space-y-1 pt-4 border-t border-gray-800">
          {bottomNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-red-400 transition-all w-full">
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 w-[280px] bg-gray-950 text-white flex flex-col p-4 z-50 transform transition-transform duration-300 lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-8">
          <Image
            src="/images/dna-group-logo.png"
            alt="Sedulous Group Ltd"
            width={120}
            height={40}
            className="w-auto h-8"
          />
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                setActiveNav(item.label)
                setIsMobileMenuOpen(false)
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeNav === item.label
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                  : "text-gray-400 hover:bg-gray-900 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="space-y-1 pt-4 border-t border-gray-800">
          {bottomNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-900 hover:text-red-400 transition-all w-full">
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 lg:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">Tuesday, 15 December 2024</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">Sami Hamdan</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-200"></div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Tracer Map */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900">Tracer Map</h2>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search vehicles..."
                    className="pl-10 w-full sm:w-60 lg:w-80 bg-gray-50 border-gray-200 text-sm"
                  />
                </div>
              </div>
              <div className="relative h-[300px] sm:h-[350px] lg:h-[400px] bg-gradient-to-br from-green-50 via-blue-50 to-gray-100 rounded-xl overflow-hidden border border-gray-200">
                {/* Map Background with Streets */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* River */}
                  <path d="M 0 180 Q 200 150, 400 180 T 800 180" fill="none" stroke="#93C5FD" strokeWidth="30" opacity="0.3"/>
                  
                  {/* Parks */}
                  <circle cx="520" cy="100" r="60" fill="#86EFAC" opacity="0.2"/>
                  <circle cx="200" cy="300" r="45" fill="#86EFAC" opacity="0.2"/>
                  
                  {/* Roads */}
                  <line x1="0" y1="120" x2="800" y2="120" stroke="#E5E7EB" strokeWidth="3"/>
                  <line x1="0" y1="280" x2="800" y2="280" stroke="#E5E7EB" strokeWidth="3"/>
                  <line x1="250" y1="0" x2="250" y2="400" stroke="#E5E7EB" strokeWidth="3"/>
                  <line x1="550" y1="0" x2="550" y2="400" stroke="#E5E7EB" strokeWidth="3"/>
                </svg>

                {/* Map Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <button className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                </div>

                {/* Vehicle Markers */}
                {vehicleLocations.map((vehicle, index) => {
                  const x = 150 + index * 200
                  const y = 120 + (index % 2) * 150
                  
                  return (
                    <div
                      key={vehicle.id}
                      className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                      style={{ left: `${x}px`, top: `${y}px` }}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="relative">
                        <div className="absolute -inset-2 bg-red-500 rounded-full animate-ping opacity-20"></div>
                        <div className="relative bg-red-500 text-white p-2 lg:p-3 rounded-full shadow-lg">
                          <Car className="h-4 w-4 lg:h-5 lg:w-5" />
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-3 lg:p-4 max-w-[calc(100%-2rem)] sm:max-w-md w-full z-20">
                  <button 
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      const currentIndex = vehicleLocations.indexOf(selectedVehicle)
                      const nextIndex = (currentIndex + 1) % vehicleLocations.length
                      setSelectedVehicle(vehicleLocations[nextIndex])
                    }}
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex items-start gap-3 lg:gap-4">
                    <div className="relative w-24 h-20 lg:w-32 lg:h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src="/luxury-car-sleek-design.png"
                        alt={selectedVehicle.car}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-xs lg:text-sm truncate">{selectedVehicle.car}</h3>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium shrink-0">
                          {selectedVehicle.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 lg:mb-3">Reg. Number: {selectedVehicle.reg}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-gradient-to-br from-red-500 to-purple-600"></div>
                        <span className="text-xs lg:text-sm font-medium text-gray-900 truncate">{selectedVehicle.customer}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 gap-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span className="truncate">{selectedVehicle.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" />
                          <span className="whitespace-nowrap text-xs">{selectedVehicle.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900">Statistic</h2>
                <select className="text-xs border border-gray-200 rounded-lg px-2 lg:px-3 py-1.5">
                  <option>Pass 7 Day</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-3 lg:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">{stat.label}</span>
                      <span
                        className={`flex items-center gap-0.5 text-xs font-medium ${
                          stat.change > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stat.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(stat.change)}%
                      </span>
                    </div>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="mt-2 h-8 lg:h-12 bg-white rounded overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartDataMap[stat.label]}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={stat.change > 0 ? "#22c55e" : "#ef4444"}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <button className="text-xs text-gray-500 underline mt-2">For Details</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule and Orders Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Schedule */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900">Schedule</h2>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button className="px-2 lg:px-3 py-1 text-xs rounded-md text-gray-600 hover:bg-white">Day</button>
                  <button className="px-2 lg:px-3 py-1 text-xs rounded-md bg-gray-900 text-white">Week</button>
                  <button className="px-2 lg:px-3 py-1 text-xs rounded-md text-gray-600 hover:bg-white">Month</button>
                </div>
              </div>
              <div className="overflow-x-auto -mx-4 lg:mx-0 px-4 lg:px-0">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-gray-600 font-medium text-xs lg:text-sm">Car Model</th>
                      <th className="text-center py-3 px-2 text-gray-600 font-medium text-xs lg:text-sm">W1</th>
                      <th className="text-center py-3 px-2 text-gray-600 font-medium text-xs lg:text-sm">W2</th>
                      <th className="text-center py-3 px-2 text-gray-600 font-medium text-xs lg:text-sm">W3</th>
                      <th className="text-center py-3 px-2 text-gray-600 font-medium text-xs lg:text-sm">W4</th>
                      <th className="text-center py-3 px-2 text-gray-600 font-medium text-xs lg:text-sm">W5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-gray-900 text-xs lg:text-sm">{row.model}</p>
                            <p className="text-xs text-gray-500">{row.reg}</p>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2">
                          {row.w1 && (
                            <div className={`${row.w1Color} text-white text-xs px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg inline-block`}>
                              {row.w1}
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3 px-2">
                          {row.w2 && (
                            <div className={`${row.w2Color} text-white text-xs px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg inline-block`}>
                              {row.w2}
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3 px-2"></td>
                        <td className="text-center py-3 px-2">
                          {row.w4 && (
                            <div className={`${row.w4Color} text-white text-xs px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg inline-block`}>
                              {row.w4}
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3 px-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Orders */}
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900">Orders</h2>
                <button className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  See All
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <div className="flex gap-2 mb-4 overflow-x-auto">
                <button className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg font-medium whitespace-nowrap">
                  On going
                </button>
                <button className="px-3 py-1.5 text-gray-600 text-xs rounded-lg hover:bg-gray-100 whitespace-nowrap">
                  Next 5 days
                </button>
              </div>
              <div className="space-y-3 lg:space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl p-3 lg:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900 text-sm">{order.id}</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Due Date: {order.dueDate}</p>
                    <div className="mb-3">
                      <p className="font-medium text-gray-900 text-xs lg:text-sm">{order.car}</p>
                      <p className="text-xs text-gray-500">Reg. Number: {order.reg}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0"></div>
                        <span className="text-xs text-gray-700 truncate">{order.customer}</span>
                      </div>
                      <button className="text-xs text-gray-600 hover:text-gray-900 shrink-0">
                        <Phone className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
