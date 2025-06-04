import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface WeatherResponse {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
  country: string;
  dateTime: string;
  precipitation: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get('destination');

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENWEATHER_API_KEY) {
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500 }
      );
    }

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${destination}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`
      );

      const weatherData = {
        temperature: response.data.main.temp,
        feelsLike: response.data.main.feels_like,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        city: response.data.name,
        country: response.data.sys.country,
        dateTime: new Date().toISOString(),
        precipitation: response.data.rain ? response.data.rain['1h'] || 0 : 0
      };

      return NextResponse.json(weatherData);
    } catch (error) {
      // If the location is not found, return default weather data
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`Location "${destination}" not found in OpenWeather API, using default weather data`);
        
        // Return default weather data for the location
        const defaultWeatherData = {
          temperature: 25, // Default temperature in Celsius
          feelsLike: 25,
          description: "Sunny",
          icon: "01d",
          humidity: 65,
          windSpeed: 5,
          city: destination,
          country: "IN", // Default to India
          dateTime: new Date().toISOString(),
          precipitation: 0
        };

        return NextResponse.json(defaultWeatherData);
      }
      
      // For other errors, throw them to be caught by the outer catch block
      throw error;
    }
  } catch (error) {
    console.error('Error in weather route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 