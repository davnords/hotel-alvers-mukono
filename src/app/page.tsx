import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Mail, Check, Copy } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import PhoneButton from "@/components/PhoneButton";
import Location from "@/components/Location";


const hotelImages = [
  "/hotel/picture-1.jpg",
  "/hotel/picture-2.jpg",
  "/hotel/picture-3.jpg",
  "/hotel/picture-4.jpg",
];

export default function Home() {

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hotel/front.jpg"
            alt="Hotel Alvers"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">Hotel Alvers</h1>
          <p className="text-xl md:text-2xl mb-8">Your Luxury Haven in Mukono, Kampala</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            
            <PhoneButton />
            {/* <Button
              size="lg"
              variant="outline"
              className="bg-white text-black hover:bg-gray-100 transition-all duration-200"
              
            >
              <Mail className="mr-2 h-5 w-5" />
              Email Us
            </Button> */}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Welcome to Hotel Alvers
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Experience unparalleled luxury in the heart of Mukono, Uganda. The hotel is located in the centre of Mukono Town, which is situated c. 21km east of Central Kampala. Our hotel combines
            modern comfort with traditional African hospitality to create an unforgettable
            stay for our guests.
          </p>
        </div>
      </section>

      {/* Image Carousel */}
      <section className="py-20 px-4 md:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Experience Our Hotel
          </h2>
          <Carousel className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {hotelImages.map((image, index) => (
                <CarouselItem key={index}>
                  <Card>
                    <CardContent className="p-0 aspect-video relative">
                      <Image
                        src={image}
                        alt={`Hotel Image ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* Location Section */}
      <Location />
    </main>
  );
}
