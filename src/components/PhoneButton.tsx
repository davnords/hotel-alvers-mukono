'use client'

import React from 'react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { Button } from './ui/button';
import { toast } from "sonner"
import { Check, Phone } from 'lucide-react';
import { WhatsApp } from '@/assets/icons';

interface PhoneButtonProps {
    number: string;
    whatsapp?: boolean;
}

function PhoneButton({ number, whatsapp }: PhoneButtonProps) {
    const [hasCopied, setHasCopied] = useState(false);

    const copyPhoneNumber = async () => {
        await navigator.clipboard.writeText(number);
        setHasCopied(true);
        toast.success('Phone number copied!')
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleClick = () => {
        if (whatsapp) {
            window.open(`https://wa.me/${number.replace(/\s+/g, '')}`, '_blank');
        } else {
            copyPhoneNumber();
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="lg"
                        className={`${whatsapp ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white text-black hover:bg-gray-300'}`}
                        onClick={handleClick}
                    >
                        {whatsapp ? (
                            <WhatsApp className="mr-2 h-5 w-5" />
                        ) : hasCopied ? (
                            <Check className="mr-2 h-5 w-5 text-green-600" />
                        ) : (
                            <Phone className="mr-2 h-5 w-5" />
                        )}
                        {number}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{whatsapp ? 'Click to open WhatsApp' : 'Click to copy phone number'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default PhoneButton