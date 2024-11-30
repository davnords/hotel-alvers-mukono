import {
  Clock,
  Wifi,
  Bug,
  ShowerHead,
  Car,
  UtensilsCrossed,
  Shirt,
  Shield,
  PhoneCall,
  SquareParking,
} from "lucide-react"

const conveniences = [
  {
    icon: Clock,
    title: "24/7 Front Desk",
    description: "Round-the-clock service and assistance",
  },
  {
    icon: Wifi,
    title: "Free Wi-Fi",
    description: "High-speed internet throughout the hotel",
  },
  {
    icon: Bug,
    title: "Mosquito Protection",
    description: "Nets and evening spraying service available",
  },
  {
    icon: ShowerHead,
    title: "Hot Water",
    description: "24/7 hot water in all rooms",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurant",
    description: "Local and international cuisine",
  },
  {
    icon: Shirt,
    title: "Laundry Service",
    description: "Laundry available with ironing",
  },
  {
    icon: Shield,
    title: "Security",
    description: "24/7 personnel and secure gate",
  },
  {
    icon: SquareParking,
    title: "Free Parking",
    description: "Secure on-site parking",
  },
  {
    icon: PhoneCall,
    title: "Room Service",
    description: "Available during restaurant hours",
  },
]

export default function Conveniences() {
  return (
    <section className="py-20 px-4 md:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          For Your Convenience
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Everything you need for a comfortable stay at Hotel Alvers
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
          {conveniences.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 