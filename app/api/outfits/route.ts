import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";
import { Outfit as PrismaOutfit } from '@prisma/client'; // Import the actual Outfit model type from Prisma

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Define interfaces for the expected request body for POST
interface PostOutfitRequestBody {
    name?: string; // Make name optional
    destination: string;
    date: string; // Expect ISO string or similar
    occasion: string;
    vibe?: string | null; // Make vibe optional and nullable
    weather: any; // Expect weather object/string, will stringify
    outfit: any; // Expect outfit structure object, will stringify
    imageUrl?: string | null; // Make imageUrl optional and nullable
    culturalNotes?: string | null; // Make culturalNotes optional and nullable
}

// Define interfaces for the structure of weather and outfit data after parsing JSON
interface ParsedWeatherData {
    temperature?: number;
    condition?: string;
    // Add other weather properties as needed
}

interface ParsedOutfitStructure {
    top: string;
    bottom: string;
    shoes: string;
    accessories?: string[];
    outerwear?: string;
    // Add other outfit part properties as needed
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = session.user as SessionUser;
    const body: PostOutfitRequestBody = await request.json(); // Type the body
    console.log('POST /api/outfits request body:', body);
    let { name, destination, date, occasion, vibe, weather, outfit, imageUrl, culturalNotes } = body;

    // Generate a default name if name is missing
    if (!name) {
       const parsedOutfit = typeof outfit === 'object' ? outfit : JSON.parse(outfit);
       const topItem = parsedOutfit?.top ? parsedOutfit.top.split(',')[0].trim() : 'Outfit'; // Use part of the top item as a fallback
       name = `${occasion || ''} ${topItem} for ${destination || ''}`.trim();
       if (name === '') name = 'New Outfit';
    }

    // Validate required fields (excluding name as we now generate it)
    if (!destination || !date || !occasion || !outfit) {
      return new NextResponse('Missing required fields: destination, date, occasion, or outfit', { status: 400 });
    }

    // Simple validation for nested objects before stringifying
    if (typeof weather !== 'string' && typeof weather !== 'object') {
         return new NextResponse('Invalid weather data format', { status: 400 });
    }
    if (typeof outfit !== 'string' && typeof outfit !== 'object') {
        return new NextResponse('Invalid outfit data format', { status: 400 });
    }

    const savedOutfit = await prisma.outfit.create({
      data: {
        userId: user.id,
        name: name,
        destination,
        date: new Date(date),
        occasion,
        vibe,
        // Store weather and outfit as JSON strings if they are objects
        weather: typeof weather === 'object' ? JSON.stringify(weather) : (weather as string), // Cast to string for safety
        outfit: typeof outfit === 'object' ? JSON.stringify(outfit) : (outfit as string),   // Cast to string for safety
        imageUrl,
        culturalNotes,
        isPublic: false
      } as any // Use any as a last resort for create data if types are too complex
    });

    return NextResponse.json(savedOutfit);
  } catch (error) {
    console.error('Error saving outfit:', error);
    // Provide a more specific error message based on Prisma error code if possible (P2002 for unique constraints, P2003 for foreign keys)
    if (error instanceof Error) {
        // Generic error message for now, could refine based on error.message or error.code
        return new NextResponse(`Failed to save outfit: ${error.message}`, { status: 500 });
    }
    return new NextResponse('Failed to save outfit', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = session.user as SessionUser;
    // Explicitly type outfits as array of PrismaOutfit to match findMany return
    const outfits: PrismaOutfit[] = await prisma.outfit.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      // include: {
      //   items: true // Uncomment if including items
      // }
    });

    // Parse the JSON fields (weather and outfit) if they are stored as JSON strings
    const formattedOutfits = outfits.map(outfit => {
        const currentOutfit = outfit as PrismaOutfit; // Explicitly cast to PrismaOutfit
        let parsedWeather: ParsedWeatherData | string | null = null;
        try {
            // Attempt to parse weather if it's a non-empty string and looks like JSON
            if (typeof currentOutfit.weather === 'string' && currentOutfit.weather.length > 0 && (currentOutfit.weather.startsWith('{') || currentOutfit.weather.startsWith('[')) && (currentOutfit.weather.endsWith('}') || currentOutfit.weather.endsWith(']'))) {
                parsedWeather = JSON.parse(currentOutfit.weather);
            } else {
                parsedWeather = currentOutfit.weather; // Keep as is if not a string or empty
            }
        } catch (e) {
            console.error('Failed to parse weather JSON for outfit', currentOutfit.id, e);
            parsedWeather = currentOutfit.weather; // Keep as string/null if parsing fails
        }

        let parsedOutfit: ParsedOutfitStructure | string | null = null;
         try {
            // Attempt to parse outfit structure if it's a non-empty string and looks like JSON
             if (typeof currentOutfit.outfit === 'string' && currentOutfit.outfit.length > 0 && (currentOutfit.outfit.startsWith('{') || currentOutfit.outfit.startsWith('[')) && (currentOutfit.outfit.endsWith('}') || currentOutfit.outfit.endsWith(']'))) {
                parsedOutfit = JSON.parse(currentOutfit.outfit);
            } else {
                parsedOutfit = currentOutfit.outfit; // Keep as is if not a string or empty
            }
        } catch (e) {
            console.error('Failed to parse outfit JSON for outfit', currentOutfit.id, e);
             parsedOutfit = currentOutfit.outfit; // Keep as string/null if parsing fails
        }

        return {
            ...currentOutfit,
            weather: parsedWeather,
            outfit: parsedOutfit,
        };
    });

    return NextResponse.json(formattedOutfits);
  } catch (error) {
    console.error('Error fetching outfits:', error);
     if (error instanceof Error) {
        return new NextResponse(`Failed to fetch outfits: ${error.message}`, { status: 500 });
    }
    return new NextResponse('Failed to fetch outfits', { status: 500 });
  }
} 