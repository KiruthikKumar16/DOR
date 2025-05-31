export interface RecommendationRequest {
  destination: string;
  date: string;
  occasion: string;
  vibe: string;
}

// Define the structure of a single Outfit
interface Outfit {
  top: string;
  topColor?: string;
  bottom: string;
  bottomColor?: string;
  shoes: string;
  shoesColor?: string;
  accessories: string[];
  accessoriesColor?: string;
  outerwear?: string;
  outerwearColor?: string;
}

export interface OutfitRecommendationResponse {
  outfits: Outfit[];
  weather: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  culturalNotes: string;
  imageUrl: string;
  destination: string;
  date: string;
  occasion: string;
  vibe: string;
}

export async function getOutfitRecommendation(data: RecommendationRequest) {
  try {
    console.log('Sending recommendation request:', data);
    
    const response = await fetch('/api/recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData?.error || `Failed to get outfit recommendation: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in getOutfitRecommendation:', error);
    throw error;
  }
} 