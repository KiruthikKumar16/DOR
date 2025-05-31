import axios from 'axios';

export interface WeatherData {
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
  error?: string;
}

async function tryLocationFormat(location: string, apiKey: string): Promise<WeatherData | null> {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`
    );
    return {
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
  } catch (error) {
    return null;
  }
}

export async function getWeatherData(location: string): Promise<WeatherData> {
  if (!process.env.OPENWEATHER_API_KEY) {
    throw new Error('Weather API key not configured');
  }

  // Try different location formats
  const locationFormats = [
    location, // Original format
    location.split(',')[0], // Just the city name
    location.split(',')[0] + ',IN', // City, Country code
    location.split(',')[0] + ',India', // City, Country name
  ];

  for (const format of locationFormats) {
    const result = await tryLocationFormat(format, process.env.OPENWEATHER_API_KEY);
    if (result) {
      return result;
    }
  }

  // If all formats fail, return error with helpful message
  return {
    temperature: 0,
    feelsLike: 0,
    description: "Location not found",
    icon: "01d",
    humidity: 0,
    windSpeed: 0,
    city: location,
    country: "",
    dateTime: new Date().toISOString(),
    precipitation: 0,
    error: `Could not find weather data for "${location}". For smaller cities, try using the nearest major city.`
  };
} 