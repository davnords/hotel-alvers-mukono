import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, StarHalf } from "lucide-react"

const testimonials = [
  {
    name: "David Nordström",
    role: "Tourist",
    avatar: "/people/david-nordstrom.png",
    quote: "Hotel Alvers exceeded all my expectations. The staff was incredibly attentive, and the rooms were immaculate. A true taste of Ugandan hospitality!",
    rating: 5,
  },
  {
    name: "David Nordström",
    role: "Tourist",
    avatar: "/people/david-nordstrom.png",
    quote: "The location is perfect for exploring Mukono, and the restaurant serves amazing local cuisine. I will definitely be returning on my next visit to Uganda.",
    rating: 4.5,
  },
  {
    name: "David Nordström",
    role: "Corporate Event Planner",
    avatar: "/people/david-nordstrom.png",
    quote: "We hosted our company retreat here and it was fantastic. The conference facilities are top-notch and the service is impeccable.",
    rating: 5,
  },
]

const RatingStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {[...Array(Math.floor(rating))].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
      {rating % 1 !== 0 && (
        <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      )}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="py-20 px-4 md:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
          What Our Guests Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <RatingStars rating={testimonial.rating} />
                <blockquote className="mt-4 text-gray-600 italic">
                &quot;{testimonial.quote}&quot;
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 