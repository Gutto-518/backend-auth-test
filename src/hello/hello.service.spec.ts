import { Test, TestingModule } from '@nestjs/testing';
import { HelloService } from './hello.service';

describe('HelloService', () => {
  let service: HelloService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HelloService],
    }).compile();

    service = module.get<HelloService>(HelloService);
  });

  describe('getHello', () => {
    it('should return hello message with user name', () => {
      const result = service.getHello('John Doe');
      expect(result).toEqual({ message: 'Hello World, John Doe!' });
    });

    it('should return hello message with empty name', () => {
      const result = service.getHello('');
      expect(result).toEqual({ message: 'Hello World, !' });
    });
  });
});