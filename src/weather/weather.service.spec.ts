import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import axios from 'axios';

// Le decimos a Jest: "reemplaza el modulo axios completo con un mock"
// Esto evita que se haga la llamada HTTP real a OpenWeatherMap
jest.mock('axios');

// Casteamos axios como un objeto mockeado para tener autocompletado de jest
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService', () => {
  let service: WeatherService;

  beforeEach(async () => {
    // Creamos un modulo de testing de NestJS con solo WeatherService
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeatherService],
    }).compile();

    service = module.get<WeatherService>(WeatherService);

    // Limpiamos los mocks entre cada test para que no se contaminen
    jest.clearAllMocks();
  });

  describe('getWeather', () => {
    it('should return temperature and description', async () => {
      // Preparamos la respuesta falsa que "devolveria" la API
      // Esto simula la estructura real de la respuesta de OpenWeatherMap
      mockedAxios.get.mockResolvedValue({
        data: {
          main: { temp: 15 },
          weather: [{ description: 'clear sky' }],
        },
      });

      const result = await service.getWeather();

      // Verificamos que axios.get fue llamado con la URL correcta
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('api.openweathermap.org'),
      );

      // Verificamos que el resultado tiene la forma correcta
      expect(result).toEqual({
        temp: 15,
        description: 'clear sky',
      });
    });

    it('should propagate errors when API fails', async () => {
      // Simulamos que la API devuelve un error (servidor caido, etc.)
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      // Verificamos que el error se propaga (no se atrapa aqui)
      // El que decide que hacer con el error es quien llama a getWeather()
      await expect(service.getWeather()).rejects.toThrow('Network Error');
    });
  });
});
