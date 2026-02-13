import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { WeatherService } from '../weather/weather.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
    private weatherService: WeatherService,
  ) {}

  async signup(signupDto: SignupDto): Promise<{ accessToken: string }> {
    const { email, password, name } = signupDto;
  
    const usersRef = this.firebaseService.firestore.collection('users');
  
    // 1️⃣ Verificar si el usuario ya existe
    const existingUser = await usersRef
      .where('email', '==', email)
      .get();
  
    if (!existingUser.empty) {
      throw new UnauthorizedException('User already exists');
    }
  
    // 2️⃣ Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // 3️⃣ Guardar en Firebase
    const userDoc = await usersRef.add({
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
    });
  
    // 4️⃣ Generar JWT
    const payload = { email, sub: userDoc.id };
  
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; weather: any }> {
    const { email, password } = loginDto;
  
    const usersRef = this.firebaseService.firestore.collection('users');
  
    const snapshot = await usersRef
      .where('email', '==', email)
      .get();
  
    if (snapshot.empty) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    const userDoc = snapshot.docs[0];
    const user = userDoc.data();
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
  
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    let weather: { temp: number; description: string } | null = null;
    try {
      weather = await this.weatherService.getWeather();
    } catch {
      // Si la API del clima falla, no bloqueamos el login
    }

    const payload = { email: user.email, sub: userDoc.id };
  
    return {
      accessToken: this.jwtService.sign(payload),
      weather,
    };
  }
  
  async findById(id: string) {
    const doc = await this.firebaseService.firestore
      .collection('users')
      .doc(id)
      .get();
  
    if (!doc.exists) return null;
  
    return { id: doc.id, ...doc.data() };
  }
}