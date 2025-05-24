import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getOutfitRecommendation(
  weather: string,
  occasion: string,
  style: string,
  bodyType: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Given the following parameters, suggest an outfit:
    Weather: ${weather}
    Occasion: ${occasion}
    Style: ${style}
    Body Type: ${bodyType}
    
    Please provide a detailed outfit recommendation that matches these criteria.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting outfit recommendation:', error);
    throw new Error('Failed to generate outfit recommendation');
  }
}

export async function generateOutfitImage(description: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const prompt = `Generate a realistic image of this outfit: ${description}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text(); // This will return the image URL or base64 data
  } catch (error) {
    console.error('Error generating outfit image:', error);
    throw new Error('Failed to generate outfit image');
  }
} 