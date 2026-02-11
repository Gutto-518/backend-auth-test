import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    service.clearUsers();
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and return access token', async () => {
      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      mockJwtService.sign.mockReturnValue('fake-jwt-token');

      const result = await service.signup(signupDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: signupDto.email,
        sub: expect.any(String),
      });
      expect(result).toEqual({ accessToken: 'fake-jwt-token' });
    });

    it('should throw UnauthorizedException if user already exists', async () => {
      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockJwtService.sign.mockReturnValue('fake-jwt-token');

      await service.signup(signupDto);

      await expect(service.signup(signupDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.signup(signupDto)).rejects.toThrow(
        'User already exists',
      );
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockJwtService.sign.mockReturnValue('fake-jwt-token');
      await service.signup(signupDto);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('login-jwt-token');

      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await service.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(result).toEqual({ accessToken: 'login-jwt-token' });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockJwtService.sign.mockReturnValue('fake-jwt-token');
      await service.signup(signupDto);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid userId', async () => {
      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
  
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      let capturedUserId: string = '';
      mockJwtService.sign.mockImplementation((payload) => {
        capturedUserId = payload.sub;
        return 'fake-jwt-token';
      });
  
      await service.signup(signupDto);
  
      const user = await service.validateUser(capturedUserId);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(signupDto.email);
      expect(user.name).toBe(signupDto.name);
      expect(user.id).toBe(capturedUserId);
    });
  
    it('should throw UnauthorizedException if user not found', async () => {
      await expect(service.validateUser('nonexistent-id')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser('nonexistent-id')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('clearUsers', () => {
    it('should clear all users', async () => {
      const signupDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockJwtService.sign.mockReturnValue('fake-jwt-token');
      await service.signup(signupDto);

      service.clearUsers();

      await expect(service.validateUser('any-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});