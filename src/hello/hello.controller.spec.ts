import { Test, TestingModule } from '@nestjs/testing';
import { HelloController } from './hello.controller';
import { HelloService } from './hello.service';

describe('HelloController', () => {
  let controller: HelloController;
  let service: HelloService;

  const mockHelloService = {
    getHello: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HelloController],
      providers: [
        {
          provide: HelloService,
          useValue: mockHelloService,
        },
      ],
    }).compile();

    controller = module.get<HelloController>(HelloController);
    service = module.get<HelloService>(HelloService);

    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return hello message with user email', () => {
      const mockRequest = {
        user: {
          email: 'test@example.com',
          userId: '123',
        },
      };

      const expectedResult = { message: 'Hello World, test@example.com!' };
      mockHelloService.getHello.mockReturnValue(expectedResult);

      const result = controller.getHello(mockRequest);

      expect(service.getHello).toHaveBeenCalledWith('test@example.com');
      expect(service.getHello).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should work with different user emails', () => {
      const mockRequest = {
        user: {
          email: 'another@example.com',
          userId: '456',
        },
      };

      const expectedResult = { message: 'Hello World, another@example.com!' };
      mockHelloService.getHello.mockReturnValue(expectedResult);

      const result = controller.getHello(mockRequest);

      expect(service.getHello).toHaveBeenCalledWith('another@example.com');
      expect(result).toEqual(expectedResult);
    });
  });
});