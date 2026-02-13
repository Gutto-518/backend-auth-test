import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseService } from '../firebase/firebase.service';
import { WeatherService } from '../weather/weather.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockFirestore = {
    collection: jest.fn(),
  };

  const mockFirebaseService = {
    firestore: mockFirestore,
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockWeatherService = {
    getWeather: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: WeatherService, useValue: mockWeatherService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ========================
  // SIGNUP
  // ========================

  describe('signup', () => {
    it('should create user and return token', async () => {
      const dto = {
        email: 'test@test.com',
        password: '123456',
        name: 'Test',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true }),
        }),
        add: jest.fn().mockResolvedValue({ id: '123' }),
      });

      mockJwtService.sign.mockReturnValue('mocked_token');

      const result = await service.signup(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: dto.email,
        sub: '123',
      });

      expect(result).toEqual({
        accessToken: 'mocked_token',
      });
    });

    it('should throw if user already exists', async () => {
      const dto = {
        email: 'test@test.com',
        password: '123456',
        name: 'Test',
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: false }),
        }),
      });

      await expect(service.signup(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ========================
  // LOGIN
  // ========================

  describe('login', () => {
    it('should return token and weather', async () => {
      const dto = {
        email: 'test@test.com',
        password: '123456',
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: [
              {
                id: '123',
                data: () => ({
                  email: dto.email,
                  password: 'hashedPassword',
                }),
              },
            ],
          }),
        }),
      });

      mockJwtService.sign.mockReturnValue('login_token');
      mockWeatherService.getWeather.mockResolvedValue({
        temp: 25,
        description: 'clear sky',
      });

      const result = await service.login(dto);

      expect(result).toEqual({
        accessToken: 'login_token',
        weather: {
          temp: 25,
          description: 'clear sky',
        },
      });
    });

    it('should throw if user not found', async () => {
      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ empty: true }),
        }),
      });

      await expect(
        service.login({ email: 'x', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password invalid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: [
              {
                id: '123',
                data: () => ({
                  email: 'x',
                  password: 'hashedPassword',
                }),
              },
            ],
          }),
        }),
      });

      await expect(
        service.login({ email: 'x', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ========================
  // WEATHER FAILURE
  // ========================

  it('should not fail login if weather fails', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    mockFirestore.collection.mockReturnValue({
      where: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              id: '123',
              data: () => ({
                email: 'x',
                password: 'hashedPassword',
              }),
            },
          ],
        }),
      }),
    });

    mockJwtService.sign.mockReturnValue('token');
    mockWeatherService.getWeather.mockRejectedValue(
      new Error('Weather down'),
    );

    const result = await service.login({
      email: 'x',
      password: '123',
    });

    expect(result.accessToken).toBe('token');
    expect(result.weather).toBeNull();
  });

  // ========================
  // FIND BY ID
  // ========================

  describe('findById', () => {
    it('should return user if document exists', async () => {
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: '123',
            data: () => ({
              email: 'test@test.com',
              name: 'Test',
            }),
          }),
        }),
      });

      const result = await service.findById('123');

      expect(result).toEqual({
        id: '123',
        email: 'test@test.com',
        name: 'Test',
      });
    });

    it('should return null if document does not exist', async () => {
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: false,
          }),
        }),
      });

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
