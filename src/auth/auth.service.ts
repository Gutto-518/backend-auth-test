import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './interfaces/user.interface';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  // Almacenamiento en memoria (mock de base de datos)
  private users: User[] = [];

  constructor(private jwtService: JwtService) {}

  async signup(signupDto: SignupDto): Promise<{ accessToken: string }> {
    const { email, password, name } = signupDto;

    // Verificar si el usuario ya existe
    const existingUser = this.users.find(user => user.email === email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user: User = {
      id: Date.now().toString(), // ID simple para el ejemplo
      email,
      password: hashedPassword,
      name,
    };

    this.users.push(user);

    // Generar token JWT
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;

    // Buscar el usuario
    const user = this.users.find(user => user.email === email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generar token JWT
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async validateUser(userId: string): Promise<User> {
    const user = this.users.find(user => user.id === userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  // Método auxiliar para testing (poder limpiar usuarios)
  clearUsers(): void {
    this.users = [];
  }
}