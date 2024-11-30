import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { ChefHat, Users2 } from "lucide-react"

export default function Staff() {
    return (
        <section className="py-20 px-4 md:px-8 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Users2 className="h-6 w-6 text-primary" />
                    <h2 className="text-3xl md:text-4xl font-bold text-center">
                        Meet Our Team
                    </h2>
                </div>
                <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                    Dedicated professionals committed to making your stay exceptional
                </p>

                {/* Team Photo */}
                <div className="mb-16 relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
                    <Image
                        src="/people/crew_1.jpeg"
                        alt="Hotel Alvers Staff"
                        fill
                        className="object-cover"
                    />
                </div>

                {/* Featured Staff */}
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <ChefHat className="h-6 w-6 text-primary" />
                            <h3 className="text-2xl md:text-3xl font-bold">
                                Meet Our Head Chef
                            </h3>
                        </div>
                    </div>

                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="grid md:grid-cols-2">
                                <div className="relative h-[300px] md:h-full">
                                    <Image
                                        src="/people/herbert.jpeg"
                                        alt="Chef Herbert"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-6 md:p-8 flex flex-col justify-center">
                                    <h4 className="text-2xl font-bold mb-2">Chef Herbert</h4>
                                    <p className="text-gray-600 mb-4">Head Chef</p>
                                    <p className="text-gray-600 mb-4">
                                        With a breadth of culinary experience, Chef Herbert brings
                                        the perfect blend of traditional Ugandan flavors and unique skills in authentic
                                        Indian cuisine to Hotel Alvers. His passion for cooking and
                                        dedication to quality has made our restaurant a favorite among
                                        guests and locals alike.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                                            Ugandan Cuisine
                                        </span>
                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                                            Indian Specialties
                                        </span>
                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                                            International Menu
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
} 