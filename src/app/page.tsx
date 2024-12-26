import Image from "next/image";
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
import Testimonials from "@/components/Testimonials";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coffee, Hotel, Warehouse } from "lucide-react";
import Conveniences from "@/components/Conveniences";
import Staff from "@/components/Staff";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const roomImages = [
  "/rooms/room_2.jpeg",
  "/rooms/room_4.jpeg",
  "/rooms/room_3.jpeg",
  "/rooms/room_5.jpeg",
];

const foodImages = [
  "/hotel/restaurant_2.jpeg",
  "/food/picture-1.jpeg",
  "/food/picture-2.jpeg",
  "/food/picture-3.jpeg",
  "/food/picture-4.jpeg",
];

const facilityImages = [
  "/hotel/flower.jpeg",
  "/hotel/front_gate.jpeg",
  "/hotel/front.jpg",
];

export default function Home() {

  return (
    <>
      <Navbar />
      <main className="min-h-screen w-full overflow-x-hidden">
        {/* Hero Section */}
        <section id="hero" className="relative h-[80vh] flex items-center justify-center">
          <div className="absolute inset-0 z-0">
            <Image
              src="/hotel/hotel_front_wide.jpeg"
              alt="Hotel Alvers"
              fill
              className="object-cover brightness-50"
              priority
            />
          </div>
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-4">Hotel Alvers</h1>
            <p className="text-xl md:text-2xl mb-8">Your Tranquil Haven in Mukono, Kampala</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PhoneButton number="+256 782 353140" />
              <PhoneButton number="+256 752 601770" whatsapp />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-4 md:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Welcome to Hotel Alvers
            </h2>
            <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
              Experience unparalleled service in the heart of Mukono, Uganda. The hotel is located in the centre of Mukono Town, which is situated c. 21km east of Central Kampala. Our hotel combines
              modern comfort with traditional African hospitality to create an unforgettable
              stay for our guests.
            </p>
          </div>
        </section>

        {/* Experience Section */}
        <section id="experience" className="py-20 px-4 md:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Experience Our Hotel
            </h2>

            <Tabs defaultValue="rooms" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="rooms" className="flex items-center gap-2">
                  <Hotel className="h-4 w-4" />
                  <span className="hidden sm:inline">Rooms & Suites</span>
                  <span className="sm:hidden">Rooms</span>
                </TabsTrigger>
                <TabsTrigger value="dining" className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  <span className="hidden sm:inline">Restaurant & Bar</span>
                  <span className="sm:hidden">Dining</span>
                </TabsTrigger>
                <TabsTrigger value="facilities" className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  <span className="hidden sm:inline">Facilities</span>
                  <span className="sm:hidden">More</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="rooms">
                <div className="space-y-4">
                  <p className="text-center text-gray-600 mb-8">
                    Enjoy luxurious rooms and suites designed for your comfort, complete with mosquito nets. On request, our staff ensures a bug-free evening for a peaceful stay.
                  </p>
                  <Carousel className="w-full max-w-4xl mx-auto">
                    <CarouselContent>
                      {roomImages.map((image, index) => (
                        <CarouselItem key={index}>
                          <Card>
                            <CardContent className="p-0 aspect-video relative">
                              <Image
                                src={image}
                                alt={`Room Image ${index + 1}`}
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
              </TabsContent>

              <TabsContent value="dining">
                <div className="space-y-4">
                  <p className="text-center text-gray-600 mb-8">
                    Indulge in a culinary journey at our restaurant and bar, where we serve a delightful blend of local Ugandan flavors and international cuisine. Whether you’re craving traditional dishes crafted with authentic ingredients or global favorites prepared to perfection, our menu offers something for everyone.
                  </p>
                  <Carousel className="w-full max-w-4xl mx-auto">
                    <CarouselContent>
                      {foodImages.map((image, index) => (
                        <CarouselItem key={index}>
                          <Card>
                            <CardContent className="p-0 aspect-video relative">
                              <Image
                                src={image}
                                alt={`Food Image ${index + 1}`}
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
              </TabsContent>

              <TabsContent value="facilities">
                <div className="space-y-4">
                  <p className="text-center text-gray-600 mb-8">
                    Explore our modern amenities including conference rooms and beautiful gardens
                  </p>
                  <Carousel className="w-full max-w-4xl mx-auto">
                    <CarouselContent>
                      {facilityImages.map((image, index) => (
                        <CarouselItem key={index}>
                          <Card>
                            <CardContent className="p-0 aspect-video relative">
                              <Image
                                src={image}
                                alt={`Facility Image ${index + 1}`}
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
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Conveniences Section */}
        <section id="conveniences">
          <Conveniences />
        </section>

        {/* Location Section */}
        <section id="location">
          <Location />
        </section>

        {/* Testimonials Section */}
        <section id="testimonials">
          <Testimonials />
        </section>

        {/* Staff Section */}
        <section id="staff">
          <Staff />
        </section>

        {/* Add this section before Footer */}
        <section id="history" className="py-20 px-4 md:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Our DNA and History
            </h2>

            <div className="space-y-8 text-gray-600">
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">Welcome to our Hotel</h3>
                <p className="mb-4">
                  Hotel Alvers in Mukono is a family owned hotel in the heart of Africa. We have a proud heritage and derive our influences both from northern Europe and southern Uganda. With us you can experience a true African experience in a chill, safe and calm setting. To ensure that our customers receive sustainable and good quality produce, our food is mostly locally farmed products from our own farm in Ssezibwa east of Mukono.
                </p>
                <p className="mb-4">
                  At the farm we grow our own vegetables and rear pigs, cows, chickens and local fish. Our skilled team is our biggest asset and together we are eager to give our guests a peaceful and stress free stay. Our restaurant and staff serves to all your needs. As we have a conference hall we also arrange meetings or big banquets.
                </p>
                <p>
                  Hotel Alvers also has a broad network of reliable partners used to international clients such as car, four wheel safari vans rentals with driver, safari lodges and so on. We can suggest an itinerary depending on the length of your stay.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">Our History</h3>
                <p className="mb-4">
                  The hotel has been expanding step by step. The name of the hotel is to honour the legacy of Anders &quot;Nille&quot; Alvers, a dear friend from Sweden that lived many years in Uganda and other countries in Africa. He was married to a Kenyan that now lives in Sweden and work for the UN. He had a very big heart. The generosity of him and his family is the reason that we could start some business 25 years ago that we then have managed to develop step by step. Sadly he passed away at a much to young age.
                </p>
                <p className="mb-4">
                  We have many international clients and friends and travel frequently to learn more how to make the stay with us pleasant and easy.
                </p>
                <p className="mb-4">
                  Next to our farm in Ssezibwa we have also developed a resort, <Link className="font-bold" href={'https://www.riversidewoodsresort.com/'}>Riverside Woods</Link>, that has a very nice nature around it with a famous waterfall and forest. Here you can enjoy walks in the nature, take a bicycle tour, enjoy a sunset barbecue or just relax with a nice view of the valley.
                </p>
                <p className="font-medium text-gray-900">
                  We look forward to seeing you!
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
