"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Copy, RotateCcw, Sparkles, Zap, Car, TrendingUp, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

export default function AIAssistantPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showWelcome, setShowWelcome] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }, [input])

    const handleSend = async (messageText = input) => {
        if (!messageText.trim() || isLoading) return

        setShowWelcome(false)
        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: messageText.trim(),
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        if (textareaRef.current) textareaRef.current.style.height = "auto"
        setIsLoading(true)

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    conversationHistory: messages.slice(-10), // Increased context window
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to get response")
            }

            const data = await response.json()

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply,
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            console.error("Error:", error)
            toast.error("Failed to get AI response. Please try again.")

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I apologize, but I encountered an error. Please try asking your question again.",
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content)
        toast.success("Copied to clipboard!")
    }

    const clearConversation = () => {
        setMessages([])
        setShowWelcome(true)
        toast.success("Conversation cleared")
    }

    const regenerateResponse = async () => {
        if (messages.length < 2) return

        // Find last user message
        const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
        if (!lastUserMessage) return

        // Remove last assistant message
        setMessages((prev) => prev.slice(0, -1))

        // Trigger loading state and resend request (without adding user message again)
        setIsLoading(true)
        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: lastUserMessage.content,
                    conversationHistory: messages.slice(0, -2).slice(-10),
                }),
            })

            if (!response.ok) throw new Error("Failed to get response")
            const data = await response.json()

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply,
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            toast.error("Failed to regenerate response")
            setIsLoading(false)
        } finally {
            setIsLoading(false)
        }
    }

    const suggestions = [
        { label: "Today's Revenue", icon: TrendingUp, query: "How much revenue did we make today?" },
        { label: "Fleet Status", icon: Car, query: "What is the status of my vehicle fleet?" },
        { label: "Pending Deposits", icon: CreditCard, query: "Show me all pending deposits" },
        { label: "Recent Bookings", icon: Zap, query: "List the last 5 bookings" },
    ]

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-black text-white relative font-sans">

            {/* Main Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto py-6 md:py-10 space-y-6">

                    {/* Welcome / Empty State */}
                    {showWelcome && messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 animate-in fade-in zoom-in duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 rounded-full" />
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center relative shadow-2xl border border-white/10">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                    Sedulous AI
                                </h1>
                                <p className="text-white/50 max-w-md">
                                    Your intelligent business assistant. Connected to your live data.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                                {suggestions.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(item.query)}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                                    >
                                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                            <item.icon className="w-5 h-5 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white/90 text-sm">{item.label}</p>
                                            <p className="text-xs text-white/40 truncate max-w-[180px]">{item.query}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages List */}
                    {messages.map((msg, idx) => (
                        <div
                            key={msg.id}
                            className={`flex gap-4 md:gap-6 ${msg.role === "assistant" ? "bg-transparent" : ""} p-2 md:p-0 animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className="shrink-0 flex flex-col relative items-end">
                                {msg.role === "assistant" ? (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/20 border border-white/10">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                        <User className="w-4 h-4 text-white/70" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-2 overflow-hidden">
                                <div className="prose prose-invert max-w-none">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-semibold text-sm text-white/90">
                                            {msg.role === "assistant" ? "Sedulous AI" : "You"}
                                        </span>
                                        <span className="text-xs text-white/30">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="text-sm md:text-[15px] leading-7 text-white/80 whitespace-pre-wrap font-light tracking-wide">
                                        {msg.content}
                                    </div>
                                </div>

                                {msg.role === "assistant" && (
                                    <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-white/40 hover:text-white"
                                            onClick={() => copyMessage(msg.content)}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-white/40 hover:text-white"
                                            onClick={regenerateResponse}
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex gap-4 md:gap-6">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0 animate-pulse">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex items-center gap-1 h-8">
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* Input Floating Bar */}
            <div className="p-4 md:p-6 bg-black/50 backdrop-blur-lg border-t border-white/5 absolute bottom-0 left-0 right-0 z-10 w-full">
                <div className="max-w-3xl mx-auto relative">
                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearConversation}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 text-white/50 hover:text-white rounded-full px-4"
                        >
                            + New Chat
                        </Button>
                    )}

                    <div className="relative flex items-end gap-2 bg-[#1a1a1a] p-2 rounded-3xl border border-white/10 focus-within:border-white/20 transition-colors shadow-2xl">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me about anything..."
                            className="bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-white/40 min-h-[44px] max-h-[200px] py-3 px-4 resize-none flex-1 font-light"
                            rows={1}
                        />
                        <Button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            size="icon"
                            className={`h-10 w-10 rounded-full shrink-0 transition-all duration-300 ${input.trim()
                                ? "bg-white text-black hover:bg-white/90"
                                : "bg-white/10 text-white/30 hover:bg-white/20"}`}
                        >
                            <Send className="w-4 h-4" />
                        </Button>

                    </div>
                    <p className="text-[10px] text-white/30 text-center mt-3 font-light">
                        Sedulous AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    )
}
