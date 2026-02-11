import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HelloModule } from './hello/hello.module';

@Module({
  imports: [AuthModule, HelloModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}