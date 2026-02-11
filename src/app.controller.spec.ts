import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  const mockAppService = {
    getHello: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);

    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined();
    });
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const expectedResult = 'Hello World!';
      mockAppService.getHello.mockReturnValue(expectedResult);

      const result = appController.getHello();

      expect(appService.getHello).toHaveBeenCalled();
      expect(appService.getHello).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedResult);
    });

    it('should call appService.getHello', () => {
      mockAppService.getHello.mockReturnValue('Test');

      appController.getHello();

      expect(appService.getHello).toHaveBeenCalled();
    });
  });
});