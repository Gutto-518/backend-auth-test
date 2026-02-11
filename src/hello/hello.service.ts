import { Injectable } from '@nestjs/common';

@Injectable()
export class HelloService {
  getHello(userName: string): { message: string } {
    return { message: `Hello World, ${userName}!` };
  }
}