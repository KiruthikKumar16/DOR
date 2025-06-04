# Destination Outfit Recommender

A smart outfit recommendation system that helps you pack the perfect clothes for your next trip. Get personalized outfit suggestions based on your destination, weather conditions, and personal style.

## Features

- 🌍 **Destination-Based Recommendations**: Get outfit suggestions tailored to your travel destination's culture and climate
- 🌤️ **Weather-Aware**: Real-time weather integration ensures your outfits are suitable for current conditions
- 👔 **Occasion-Specific**: Different outfit recommendations for various events and activities
- 👤 **Personalized Style**: Recommendations based on your body type, preferences, and measurements
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌙 **Dark Mode Support**: Comfortable viewing in any lighting condition

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Google Gemini AI for outfit recommendations and image generation
- **Weather API**: OpenWeatherMap for real-time weather data

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL database
- Google Cloud Platform account (for Gemini AI and OAuth)
- OpenWeatherMap API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/destination_outfit_recommender"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Weather API
OPENWEATHER_API_KEY="your-openweather-api-key"
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/destination-outfit-recommender.git
   cd destination-outfit-recommender
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
destination-outfit-recommender/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── lib/              # Utility functions
├── components/            # Shared components
├── context/              # React context providers
├── lib/                  # Shared utilities
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## Key Features Implementation

### Outfit Recommendations
- Uses Gemini AI to generate personalized outfit recommendations
- Considers destination, weather, occasion, and personal style
- Generates AI images of recommended outfits

### User Profiles
- Stores user preferences and measurements
- Tracks saved outfits and recommendations
- Manages wardrobe items

### Weather Integration
- Real-time weather data for destinations
- Adjusts recommendations based on current conditions
- Supports multiple weather parameters (temperature, precipitation, etc.)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Google Gemini AI](https://ai.google.dev/)
- [OpenWeatherMap](https://openweathermap.org/) 