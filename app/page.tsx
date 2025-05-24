import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Sparkles, Shirt, User } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-8 md:py-16 lg:py-24 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-6xl/none">
                  Perfect Outfits for Every Destination
                </h1>
                <p className="max-w-[600px] text-muted-foreground text-sm md:text-lg lg:text-xl">
                  Get personalized clothing recommendations based on your destination, weather, and occasion. Travel
                  with confidence and style.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="w-full min-[400px]:w-auto">
                  <Link href="/recommendation">Get Recommendation</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full min-[400px]:w-auto">
                  <Link href="/wardrobe">Go to Wardrobe</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-[250px] md:h-[350px] w-full overflow-hidden rounded-xl bg-background">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 opacity-20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shirt className="h-20 w-20 md:h-32 md:w-32 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-8 md:py-16 lg:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
              <p className="max-w-[900px] text-muted-foreground text-sm md:text-lg lg:text-xl/relaxed">
                Our intelligent system considers multiple factors to recommend the perfect outfit for your trip.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-4 md:gap-6 py-8 md:py-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-4 md:p-6 text-center">
              <MapPin className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              <h3 className="text-lg md:text-xl font-bold">Destination</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                We consider local culture and typical dress codes for your destination.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-4 md:p-6 text-center">
              <Calendar className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              <h3 className="text-lg md:text-xl font-bold">Weather</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Real-time weather forecasts ensure you're prepared for any conditions.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-4 md:p-6 text-center">
              <Sparkles className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              <h3 className="text-lg md:text-xl font-bold">Occasion</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Different events call for different attire. We've got you covered.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-4 md:p-6 text-center">
              <User className="h-8 w-8 md:h-12 md:w-12 text-primary" />
              <h3 className="text-lg md:text-xl font-bold">Personal Style</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Your profile helps us tailor recommendations to your body type and preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-8 md:py-16 lg:py-24 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                Ready to pack smarter?
              </h2>
              <p className="max-w-[600px] text-muted-foreground text-sm md:text-lg lg:text-xl/relaxed">
                Create your profile and get personalized outfit recommendations for your next trip.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg" className="w-full min-[400px]:w-auto">
                <Link href="/signup">Create Account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full min-[400px]:w-auto">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
