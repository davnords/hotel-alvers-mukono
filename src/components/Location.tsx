'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

function Location() {
  return (
    <section className="py-20 px-4 md:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
          Our Location
        </h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Find Us in Mukono</h3>
            <p className="text-gray-600">
              Located in the vibrant city of Mukono, Hotel Alvers is easily accessible
              and situated close to major attractions.
            </p>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Hotel Alvers, Mukono, Kampala, Uganda</span>
            </div>
            <Button 
              className="mt-4"
              onClick={() => window.open('https://www.google.com/maps/dir//Mukono/@0.3461167,32.683486,28708m/data=!3m2!1e3!4b1!4m8!4m7!1m0!1m5!1m1!1s0x177dc6ff9e791edd:0x5e1ae79dddd82203!2m2!1d32.765888!2d0.3461171?entry=ttu&g_ep=EgoyMDI0MTEyNC4xIKXMDSoASAFQAw%3D%3D', '_blank')}
            >
              <MapPin className="mr-2 h-5 w-5" />
              Get Directions
            </Button>
          </div>
          <div className="aspect-square w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15953.843461646919!2d32.765888!3d0.3461171!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177dc6ff9e791edd%3A0x5e1ae79dddd82203!2sMukono!5e0!3m2!1sen!2sug!4v1710337559276!5m2!1sen!2sug"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale hover:grayscale-0 transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Location