'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Hotel,
    UtensilsCrossed,
    Users2,
    MapPin,
    Phone,
    ChevronDown,
    Check,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
    {
        title: "Rooms & Dining",
        icon: Hotel,
        href: "#experience",
    },
    {
        title: "Amenities",
        icon: UtensilsCrossed,
        href: "#conveniences",
    },
    {
        title: "Location",
        icon: MapPin,
        href: "#location",
    },
    {
        title: "Our Team",
        icon: Users2,
        href: "#staff",
    },

]

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)

    const [hasCopied, setHasCopied] = useState(false);
    const phoneNumber = "+256 782 353140";

    const copyPhoneNumber = async () => {
        await navigator.clipboard.writeText(phoneNumber);
        setHasCopied(true);
        toast.success('Phone number copied!')
        setTimeout(() => setHasCopied(false), 2000);
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const scrollToSection = (href: string) => {
        const element = document.querySelector(href)
        if (element) {
            const offset = 80 // Height of the navbar
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - offset

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
            })
        }
    }

    return (
        <header
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300",
                isScrolled
                    ? "bg-white/80 backdrop-blur-md shadow-sm"
                    : "bg-transparent"
            )}
        >
            <div className="max-w-6xl mx-auto px-4">
                <nav className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <a
                        href="#"
                        className={cn(
                            "font-bold text-lg transition-colors",
                            isScrolled ? "text-gray-900" : "text-white"
                        )}
                    >
                        Hotel Alvers
                    </a>

                    {/* Navigation Items */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Button
                                key={item.title}
                                variant="ghost"
                                className={cn(
                                    "flex items-center gap-2",
                                    isScrolled
                                        ? "text-gray-600 hover:text-gray-900"
                                        : "text-white/90 hover:text-white hover:bg-black"
                                )}
                                onClick={() => scrollToSection(item.href)}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Button>
                        ))}
                    </div>

                    {/* Contact Button */}
                    <Button
                        size="sm"
                        className={cn(
                            "hidden md:flex items-center gap-2",
                            !isScrolled && "bg-white text-gray-900 hover:bg-gray-100"
                        )}
                        onClick={copyPhoneNumber}
                    >
                        {hasCopied ? (
                            <Check className="h-4 w-4 text-green-600" />
                        ) : (
                            <Phone className="h-4 w-4" />
                        )}
                        Contact us
                    </Button>

                    {/* Mobile Menu Button */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "md:hidden",
                                    isScrolled ? "text-gray-600" : "text-white"
                                )}
                            >
                                <ChevronDown className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="top" className="pt-20">
                            <div className="flex flex-col gap-4">
                                {navItems.map((item) => (
                                    <Button
                                        key={item.title}
                                        variant="ghost"
                                        className="flex items-center gap-2 w-full justify-start"
                                        onClick={() => {
                                            scrollToSection(item.href)
                                        }}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.title}
                                    </Button>
                                ))}
                                <Button
                                    size="sm"
                                    className="flex items-center gap-2 w-full"
                                    onClick={copyPhoneNumber}
                                >
                                    {hasCopied ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Phone className="h-4 w-4" />
                                    )}
                                    Contact us
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </nav>
            </div>
        </header>
    )
}