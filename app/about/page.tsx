import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Calendar, Tag, Sparkles, User, Cloud, Shirt } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">About Destination Outfit Recommender</h1>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              Destination Outfit Recommender was created to solve the common problem of "what should I pack?" when
              traveling. Our mission is to help travelers pack efficiently and appropriately for their destinations,
              taking into account weather conditions, cultural norms, and personal style preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    Destination Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We analyze your destination to understand local culture, typical dress codes, and climate patterns
                    to ensure your outfits are appropriate and comfortable.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Cloud className="h-5 w-5 text-primary" />
                    </div>
                    Weather Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    We use real-time weather forecasts for your travel dates to recommend appropriate clothing layers
                    and accessories for the expected conditions.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    Occasion Matching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Whether you're attending a business meeting, wedding, or going on a casual sightseeing trip, we
                    recommend outfits that are appropriate for your specific activities.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    Personalization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Your profile information helps us tailor recommendations to your body type, style preferences, and
                    comfort needs for truly personalized suggestions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Benefits</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="bg-primary/10 p-2 rounded-full h-fit">
                  <Shirt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Pack Smarter, Not More</h3>
                  <p className="text-muted-foreground">
                    Our recommendations help you pack only what you need, avoiding overpacking while ensuring you have
                    appropriate clothing for all occasions.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <div className="bg-primary/10 p-2 rounded-full h-fit">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Look Your Best</h3>
                  <p className="text-muted-foreground">
                    Feel confident and comfortable in outfits that are stylish, appropriate for the setting, and suited
                    to your personal style preferences.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <div className="bg-primary/10 p-2 rounded-full h-fit">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Save Time Planning</h3>
                  <p className="text-muted-foreground">
                    Eliminate the stress and time spent deciding what to pack. Get instant recommendations based on data
                    and expertise.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Our Technology</h2>
            <p className="text-muted-foreground mb-4">
              Destination Outfit Recommender uses advanced algorithms that consider multiple factors:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Weather forecasting data for accurate temperature and precipitation predictions</li>
              <li>Cultural databases to understand local dress codes and customs</li>
              <li>Occasion-specific clothing recommendations based on industry standards</li>
              <li>Body type analysis to suggest flattering styles and fits</li>
              <li>Personal style preferences to ensure you feel comfortable and confident</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
