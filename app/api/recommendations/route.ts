import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

interface RecommendationRequest {
  destination: string;
  date: string; // Format: DD/MM/YY
  occasion: string;
  style: string;
}

// Initialize Gemini AI with the correct API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry API calls with longer delays
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 5000  // Start with 5 seconds
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      if (retries >= maxRetries) throw error;
      
      // Check if it's a rate limit error
      if (error?.status === 429) {
        const retryAfter = error?.errorDetails?.[0]?.retryDelay || delay;
        console.log(`Rate limited. Retrying in ${retryAfter}ms...`);
        await wait(parseInt(retryAfter));
        retries++;
        delay *= 2; // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
}

// Fallback recommendations for when API is rate limited
const fallbackRecommendations = {
  casual: {
    outfit: {
      top: "Light cotton t-shirt or casual shirt",
      bottom: "Comfortable jeans or chinos",
      shoes: "Sneakers or casual loafers",
      accessories: ["Watch", "Sunglasses", "Backpack"],
      outerwear: "Light jacket or hoodie"
    },
    culturalNotes: "For casual outings in Vellore, comfortable and modest clothing is recommended. Light, breathable fabrics are ideal for the warm climate. While casual wear is acceptable in most places, avoid revealing clothing out of respect for local customs."
  },
  formal: {
    outfit: {
      top: "Formal shirt or blouse",
      bottom: "Tailored pants or skirt",
      shoes: "Formal shoes or heels",
      accessories: ["Watch", "Minimal jewelry", "Professional bag"],
      outerwear: "Blazer or formal jacket"
    },
    culturalNotes: "For formal occasions in Vellore, conservative business attire is appropriate. Men typically wear formal shirts with pants, while women often choose sarees or formal western wear. Maintain a professional appearance while respecting local cultural norms."
  },
  wedding: {
    outfit: {
      top: "Elegant blouse or kurta",
      bottom: "Saree or lehenga",
      shoes: "Formal footwear",
      accessories: ["Traditional jewelry", "Clutch bag", "Dupatta"],
      outerwear: "Shawl or stole"
    },
    culturalNotes: "For weddings in Vellore, traditional attire is highly recommended. Women often wear sarees or lehengas in bright colors, while men typically wear kurta-pajamas or formal suits. Avoid black or white as they are associated with mourning."
  }
};

// Helper function to clean JSON response
function cleanJsonResponse(text: string): string {
  // Remove markdown code block syntax
  return text.replace(/```json\n?|\n?```/g, '').trim();
}

// Helper function to get random style variations
function getRandomStyleVariation(style: string): string {
  const variations: { [key: string]: string[] } = {
    casual: ['relaxed', 'smart casual', 'urban casual', 'beach casual', 'street casual'],
    formal: ['business formal', 'evening formal', 'semi-formal', 'cocktail', 'black tie'],
    traditional: ['ethnic', 'cultural', 'heritage', 'folk', 'indigenous'],
    // Add more styles as needed
    aesthetic: ['minimalist aesthetic', 'dark academia aesthetic', 'light academia aesthetic', 'cottagecore aesthetic'],
    sporty: ['athletic', 'athleisure', 'performance wear'],
    minimal: ['简约风格', 'simple and clean', 'basic minimalist'], // Example: Including a non-English term might challenge the model or introduce variety if handled.
    cool: ['effortlessly cool', 'trendy', 'chic'],
    elegant: ['sophisticated', 'graceful', 'refined'],
    bohemian: ['boho-chic', 'free-spirited', 'hippie-inspired']
  };
  const baseStyle = style.toLowerCase();
  const styleList = variations[baseStyle] || [baseStyle];
  return styleList[Math.floor(Math.random() * styleList.length)];
}

// Helper function to get random request variations
function getRandomRequestVariation(): string {
  const variations = [
    "Provide three distinct outfit recommendations for the user's trip.",
    "Suggest three alternative outfits for the specified destination and occasion.",
    "Generate three new and unique clothing combinations based on the trip details.",
    "Propose three different style interpretations for the user's requested vibe.",
    "Create three varied outfit recommendations considering the weather and cultural context."
  ];
  return variations[Math.floor(Math.random() * variations.length)];
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Get request body
    const body: RecommendationRequest = await request.json();
    const { destination, date, occasion, style } = body;

    // 3. Get user profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!user?.profile) {
      return new NextResponse('User profile not found', { status: 404 });
    }

    // 4. Fetch weather data
    const weatherResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/weather?destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`
    );
    
    if (!weatherResponse.ok) {
      return new NextResponse('Failed to fetch weather data', { status: 500 });
    }

    const weatherData = await weatherResponse.json();

    // 5. Prepare prompt for Gemini to generate multiple outfits
    const vibe = getRandomStyleVariation(style);
    const requestVariation = getRandomRequestVariation(); 
    
    const prompt = `${requestVariation} 
    Trip details: destination ${destination}, date ${date}, occasion ${occasion}, vibe ${vibe}. Weather: ${weatherData.condition}, temperature ${weatherData.temperature}°C, precipitation ${weatherData.precipitation}.

IMPORTANT INSTRUCTIONS:
1. Provide exactly three distinct outfit recommendations.
2. For each outfit, keep each clothing item description to 3-4 words maximum.
3. Include color in each recommendation.
4. Be specific but concise for each outfit.
5. Consider the local culture and weather for all recommendations.
6. Ensure the three suggested outfits are clearly different from each other.

Please provide a brief cultural note (maximum 25 words) about local dress customs and any important considerations, relevant to all outfits.

    Format the response as a JSON object with the following structure:
    {
  "outfits": [  // Array of outfits
    {
      "top": "color + type (3-4 words)",
      "bottom": "color + type (3-4 words)",
      "shoes": "color + type (3-4 words)",
      "accessories": ["color + type (3-4 words)", "color + type (3-4 words)"],
      "outerwear": "color + type (3-4 words)"
    },
    // ... second outfit ...
    // ... third outfit ...
  ],
  "culturalNotes": "brief cultural note (max 25 words)"
}`;

    try {
      // 6. Get recommendations from Gemini with retry logic
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 1.0,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024, // Keep token limit reasonable
        }
      });
      
      const result = await retryWithBackoff(async () => {
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        return response;
      });
      
    const response = await result.response;
      const cleanedText = cleanJsonResponse(response.text());
      const recommendation = JSON.parse(cleanedText);

      // 7. Return complete recommendation with multiple outfits
    return NextResponse.json({
        outfits: recommendation.outfits, // Return the array of outfits
        culturalNotes: recommendation.culturalNotes,
      weather: weatherData
    });
    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError);
      // Consider a fallback here that provides at least one generic outfit
       return new NextResponse('Failed to generate recommendations. Please try again in a few minutes.', { status: 429 });
    }

  } catch (error) {
    console.error('Error generating recommendation:', error);
    return new NextResponse('Failed to generate recommendation', { status: 500 });
  }
} 