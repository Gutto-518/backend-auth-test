import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WeatherService {
  async getWeather() {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=LaPaz&appid=7310522e21822a4f35c517dfe36b694c&units=metric`
    );

    return {
      temp: response.data.main.temp,
      description: response.data.weather[0].description,
    };
  }
}
