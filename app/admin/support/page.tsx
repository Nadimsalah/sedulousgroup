"use client"

import { useState, useEffect } from "react"
import {
  MessageSquare,
  Search,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Mail,
  Calendar,
  Send,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@supabase/supabase-js"

interface SupportTicket {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  subject: string
  message: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  admin_response: string | null
  booking_id: string | null
}

function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [responseText, setResponseText] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchQuery, statusFilter, priorityFilter])

  const loadTickets = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createAdminSupabase()
      const { data, error: fetchError } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        if (fetchError.code === "42P01") {
          setTickets([])
          setError("Support tickets table not found. Please create the table first.")
        } else {
          setError(fetchError.message)
        }
      } else {
        setTickets(data || [])
      }
    } catch (err) {
      setError("Failed to load support tickets")
    } finally {
      setIsLoading(false)
    }
  }

  const filterTickets = () => {
    let filtered = tickets
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }
    if (priorityFilter !== "all") {
      filtered = filtered.filter((t) => t.priority === priorityFilter)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.customer_name?.toLowerCase().includes(query) ||
          t.customer_email?.toLowerCase().includes(query) ||
          t.subject?.toLowerCase().includes(query) ||
          t.id?.toLowerCase().includes(query),
      )
    }
    setFilteredTickets(filtered)
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const supabase = createAdminSupabase()
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() }
      if (newStatus === "resolved" || newStatus === "closed") {
        updates.resolved_at = new Date().toISOString()
      }
      const { error: updateError } = await supabase.from("support_tickets").update(updates).eq("id", ticketId)
      if (updateError) throw updateError
      loadTickets()
    } catch (err) {
      setError("Failed to update ticket status")
    }
  }

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) return
    setIsSending(true)
    try {
      const supabase = createAdminSupabase()
      const { error: updateError } = await supabase
        .from("support_tickets")
        .update({
          admin_response: responseText,
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTicket.id)
      if (updateError) throw updateError
      setResponseText("")
      setShowDetailsDialog(false)
      loadTickets()
    } catch (err) {
      setError("Failed to send response")
    } finally {
      setIsSending(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/30"
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
      case "resolved":
        return "bg-green-500/10 text-green-500 border border-green-500/30"
      case "closed":
        return "bg-gray-500/10 text-gray-500 border border-gray-500/30"
      default:
        return "bg-gray-500/10 text-gray-500 border border-gray-500/30"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-500/10 text-green-500 border border-green-500/30"
      case "medium":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/30"
      case "high":
        return "bg-orange-500/10 text-orange-500 border border-orange-500/30"
      case "urgent":
        return "bg-red-500/10 text-red-500 border border-red-500/30"
      default:
        return "bg-gray-500/10 text-gray-500 border border-gray-500/30"
    }
  }

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Help & Support</h1>
            <p className="text-gray-400 mt-1">Manage customer support tickets and inquiries</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.open}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer, email, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black border-zinc-700 text-white placeholder-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "open", "in_progress", "resolved", "closed"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "bg-red-500 hover:bg-red-600" : "border-zinc-700 text-gray-300"}
                >
                  {status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
            <Button
              onClick={loadTickets}
              size="sm"
              variant="outline"
              className="border-zinc-700 bg-transparent"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">{error}</div>}

        {/* Tickets List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-red-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 mt-4">Loading tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <MessageSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No support tickets found</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition cursor-pointer"
                onClick={() => {
                  setSelectedTicket(ticket)
                  setShowDetailsDialog(true)
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{ticket.subject}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{ticket.message}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{ticket.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{ticket.customer_email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(ticket.id, "in_progress")
                          }}
                          className="text-yellow-400 cursor-pointer hover:bg-zinc-800"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(ticket.id, "resolved")
                          }}
                          className="text-green-400 cursor-pointer hover:bg-zinc-800"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusChange(ticket.id, "closed")
                          }}
                          className="text-gray-400 cursor-pointer hover:bg-zinc-800"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Close Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ticket Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Support Ticket Details</DialogTitle>
            <DialogDescription className="text-gray-400">Ticket #{selectedTicket?.id?.slice(0, 8)}</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6 mt-4">
              {/* Ticket Info */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status.replace("_", " ")}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority} priority
                </span>
                {selectedTicket.category && (
                  <span className="px-3 py-1 rounded-full text-xs bg-zinc-800 text-gray-300">
                    {selectedTicket.category}
                  </span>
                )}
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-800/50 rounded-lg">
                <div>
                  <Label className="text-gray-400">Customer Name</Label>
                  <p className="text-white font-medium">{selectedTicket.customer_name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Email</Label>
                  <p className="text-white">{selectedTicket.customer_email}</p>
                </div>
                {selectedTicket.customer_phone && (
                  <div>
                    <Label className="text-gray-400">Phone</Label>
                    <p className="text-white">{selectedTicket.customer_phone}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-400">Created</Label>
                  <p className="text-white">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Subject & Message */}
              <div>
                <Label className="text-gray-400">Subject</Label>
                <p className="text-white font-semibold text-lg">{selectedTicket.subject}</p>
              </div>
              <div>
                <Label className="text-gray-400">Message</Label>
                <p className="text-white bg-zinc-800/50 p-4 rounded-lg whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {/* Previous Response */}
              {selectedTicket.admin_response && (
                <div>
                  <Label className="text-gray-400">Previous Response</Label>
                  <p className="text-white bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedTicket.admin_response}
                  </p>
                </div>
              )}

              {/* Response Form */}
              <div>
                <Label className="text-gray-400">Send Response</Label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="bg-black border-zinc-700 text-white mt-1"
                  placeholder="Type your response to the customer..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-zinc-800">
                <Button
                  onClick={handleSendResponse}
                  disabled={!responseText.trim() || isSending}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? "Sending..." : "Send Response"}
                </Button>
                <Button
                  onClick={() => handleStatusChange(selectedTicket.id, "resolved")}
                  variant="outline"
                  className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="border-zinc-700">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
