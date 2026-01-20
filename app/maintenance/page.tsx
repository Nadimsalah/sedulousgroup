import Image from "next/image"
import { Wrench, Clock, Mail, Phone } from "lucide-react"

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-black flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Glassmorphic Card */}
                <div className="liquid-glass border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
                            <Image
                                src="/images/dna-group-logo.png"
                                alt="Sedulous Group Ltd"
                                width={200}
                                height={67}
                                className="relative h-16 w-auto"
                                priority
                            />
                        </div>
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full animate-pulse"></div>
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center backdrop-blur-xl">
                                <Wrench className="h-12 w-12 text-red-400 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 bg-gradient-to-r from-white via-white to-red-400 bg-clip-text text-transparent">
                        Under Maintenance
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-white/70 text-center mb-8 leading-relaxed">
                        We're currently performing scheduled maintenance to improve your experience.
                        We'll be back online shortly.
                    </p>

                    {/* Status */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="relative">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                            </div>
                            <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wider">
                                Maintenance in Progress
                            </span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-white/60">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Expected completion: Soon</span>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
                        <p className="text-white/60 text-center text-sm mb-4">
                            Need immediate assistance? Contact us:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <a
                                href="tel:02033552561"
                                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                    <Phone className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white/50 mb-0.5">Call us</p>
                                    <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                                        020 3355 2561
                                    </p>
                                </div>
                            </a>

                            <a
                                href="mailto:info@sedulousgroupltd.co.uk"
                                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                    <Mail className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white/50 mb-0.5">Email us</p>
                                    <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                                        info@sedulousgroupltd.co.uk
                                    </p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-center text-white/40 text-xs">
                            Thank you for your patience and understanding
                        </p>
                    </div>
                </div>

                {/* Animated Background Elements */}
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
            </div>
        </div>
    )
}
