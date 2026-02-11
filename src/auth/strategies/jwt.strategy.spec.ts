import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user data for valid payload', async () => {
      const payload = { sub: '123', email: 'test@example.com' };
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test',
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(authService.validateUser).toHaveBeenCalledWith('123');
      expect(result).toEqual({ userId: '123', email: 'test@example.com' });
    });

    it('should throw UnauthorizedException if validateUser throws', async () => {
      const payload = { sub: '123', email: 'test@example.com' };

      mockAuthService.validateUser.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.validateUser).toHaveBeenCalledWith('123');
    });

    it('should handle different user IDs', async () => {
      const payload = { sub: '999', email: 'another@example.com' };
      const mockUser = {
        id: '999',
        email: 'another@example.com',
        password: 'hashed',
        name: 'Another',
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result.userId).toBe('999');
      expect(result.email).toBe('another@example.com');
    });
  });
});