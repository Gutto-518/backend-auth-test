import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { HelloService } from './hello.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';

@Controller('hello')
export class HelloController {
  constructor(private helloService: HelloService) {}

  @Get()
  @UseGuards(JwtAuthGuard) // Protege esta ruta
  getHello(@Request() req) {
    return this.helloService.getHello(req.user.email);
  }
}