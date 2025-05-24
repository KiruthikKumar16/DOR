import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;

interface TestResult {
  status: 'not tested' | 'checked' | 'working' | 'failed';
  error: string | null;
  details?: any;
}

interface TestResults {
  weather: TestResult;
  recommendations: TestResult;
  imageGeneration: TestResult;
  environmentVariables: TestResult;
}

export async function GET() {
  const results: TestResults = {
    weather: { status: 'not tested', error: null },
    recommendations: { status: 'not tested', error: null },
    imageGeneration: { status: 'not tested', error: null },
    environmentVariables: { status: 'not tested', error: null }
  };

  try {
    // Check environment variables
    console.log('Checking environment variables...');
    if (!OPENWEATHER_API_KEY) {
      results.environmentVariables.error = 'OPENWEATHER_API_KEY is missing';
    }
    if (!GOOGLE_AI_KEY) {
      results.environmentVariables.error = 'GOOGLE_AI_KEY is missing';
    } else {
      results.environmentVariables.details = {
        keyLength: GOOGLE_AI_KEY.length,
        keyPrefix: GOOGLE_AI_KEY.substring(0, 4) + '...',
        keyPresent: true,
        keyFormat: GOOGLE_AI_KEY.startsWith('AI') ? 'Valid format' : 'Invalid format'
      };
    }
    results.environmentVariables.status = 'checked';

    // Test Weather API
    try {
      console.log('Testing Weather API...');
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) {
        throw new Error(`Weather API returned ${weatherResponse.status}`);
      }
      const weatherData = await weatherResponse.json();
      results.weather.status = 'working';
      results.weather.details = {
        temperature: weatherData.main.temp,
        city: weatherData.name
      };
    } catch (error) {
      console.error('Weather API Error:', error);
      results.weather.status = 'failed';
      results.weather.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test Gemini AI (for recommendations)
    try {
      console.log('Testing Gemini AI...');
      if (!GOOGLE_AI_KEY) {
        throw new Error('GOOGLE_AI_KEY is not set');
      }

      // Validate API key format
      if (!GOOGLE_AI_KEY.startsWith('AI')) {
        throw new Error('Invalid API key format. Key should start with "AI"');
      }

      // Test network connectivity first
      try {
        const testResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          headers: {
            'x-goog-api-key': GOOGLE_AI_KEY
          }
        });
        if (!testResponse.ok) {
          throw new Error(`API test failed with status ${testResponse.status}`);
        }
      } catch (networkError) {
        throw new Error(`Network error: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`);
      }

      const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent('Test message');
      const response = await result.response;
      results.recommendations.status = 'working';
      results.recommendations.details = {
        model: 'gemini-pro',
        responseLength: response.text().length
      };
    } catch (error) {
      console.error('Gemini AI Error:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      results.recommendations.status = 'failed';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Extract the core error message without the GoogleGenerativeAI wrapper
      const cleanError = errorMessage.replace('[GoogleGenerativeAI Error]: ', '');
      results.recommendations.error = cleanError;
      results.recommendations.details = {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        keyPresent: !!GOOGLE_AI_KEY,
        keyLength: GOOGLE_AI_KEY?.length || 0,
        keyFormat: GOOGLE_AI_KEY?.startsWith('AI') ? 'Valid format' : 'Invalid format',
        networkTest: error instanceof Error && error.message.includes('Network error') ? 'Failed' : 'Not tested'
      };
    }

    // Test Gemini Vision (for image generation)
    try {
      console.log('Testing Gemini Vision...');
      if (!GOOGLE_AI_KEY) {
        throw new Error('GOOGLE_AI_KEY is not set');
      }

      // Validate API key format
      if (!GOOGLE_AI_KEY.startsWith('AI')) {
        throw new Error('Invalid API key format. Key should start with "AI"');
      }

      const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
      const result = await model.generateContent('Test image generation');
      const response = await result.response;
      results.imageGeneration.status = 'working';
      results.imageGeneration.details = {
        model: 'gemini-pro-vision',
        responseLength: response.text().length
      };
    } catch (error) {
      console.error('Gemini Vision Error:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      results.imageGeneration.status = 'failed';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Extract the core error message without the GoogleGenerativeAI wrapper
      const cleanError = errorMessage.replace('[GoogleGenerativeAI Error]: ', '');
      results.imageGeneration.error = cleanError;
      results.imageGeneration.details = {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        keyPresent: !!GOOGLE_AI_KEY,
        keyLength: GOOGLE_AI_KEY?.length || 0,
        keyFormat: GOOGLE_AI_KEY?.startsWith('AI') ? 'Valid format' : 'Invalid format'
      };
    }

    return NextResponse.json({
      status: 'completed',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Overall Test Error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 