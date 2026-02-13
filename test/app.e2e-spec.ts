import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { FirebaseService } from './../src/firebase/firebase.service';
import { WeatherService } from './../src/weather/weather.service';
import * as bcrypt from 'bcrypt';

describe('App E2E Tests', () => {
  let app: INestApplication;
  let accessToken: string;

  // =========================================================
  // MOCK DE FIRESTORE
  // =========================================================
  // Simulamos una "base de datos" en memoria usando un Map.
  // Cada vez que el codigo hace collection('users').add(...),
  // en realidad guardamos en este Map.
  // Esto nos da persistencia DENTRO del test (signup crea,
  // login lee) sin necesitar Firebase real.
  // =========================================================
  const usersStore = new Map<string, any>();
  let idCounter = 1;

  const mockFirebaseService = {
    firestore: {
      collection: jest.fn().mockImplementation(() => ({
        // add() guarda un documento en nuestro Map
        add: jest.fn().mockImplementation(async (data: any) => {
          const id = `mock-id-${idCounter++}`;
          usersStore.set(id, { ...data });
          return { id };
        }),
        // where().get() busca en nuestro Map
        where: jest.fn().mockImplementation((field: string, _op: string, value: any) => ({
          get: jest.fn().mockImplementation(async () => {
            const docs: any[] = [];
            usersStore.forEach((userData, docId) => {
              if (userData[field] === value) {
                docs.push({
                  id: docId,
                  data: () => ({ ...userData }),
                });
              }
            });
            return {
              empty: docs.length === 0,
              docs,
            };
          }),
        })),
        // doc().get() busca por ID
        doc: jest.fn().mockImplementation((id: string) => ({
          get: jest.fn().mockImplementation(async () => {
            const data = usersStore.get(id);
            return {
              exists: !!data,
              id,
              data: () => (data ? { ...data } : undefined),
            };
          }),
        })),
      })),
    },
  };

  // =========================================================
  // MOCK DE WEATHER SERVICE
  // =========================================================
  // Simplemente retorna datos fijos del clima.
  // No necesitamos llamar a la API real de OpenWeatherMap.
  // =========================================================
  const mockWeatherService = {
    getWeather: jest.fn().mockResolvedValue({
      temp: 18,
      description: 'sunny',
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // =========================================================
      // overrideProvider: le dice a NestJS
      // "cuando alguien inyecte FirebaseService, usa mi mock"
      // Esto reemplaza el servicio REAL por nuestro mock
      // en TODA la aplicacion.
      // =========================================================
      .overrideProvider(FirebaseService)
      .useValue(mockFirebaseService)
      .overrideProvider(WeatherService)
      .useValue(mockWeatherService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Habilitar validacion global en tests E2E
    // (igual que en main.ts de produccion)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Limpiamos la "base de datos" en memoria antes de cada bloque
  beforeEach(() => {
    usersStore.clear();
    idCounter = 1;
    jest.clearAllMocks();

    // Re-configuramos el mock de weather para cada test
    mockWeatherService.getWeather.mockResolvedValue({
      temp: 18,
      description: 'sunny',
    });
  });

  describe('Root Endpoint', () => {
    describe('/ (GET)', () => {
      it('should return "Hello World!"', () => {
        return request(app.getHttpServer())
          .get('/')
          .expect(200)
          .expect((res) => {
            expect(res.text).toBe('Hello World!');
          });
      });
    });
  });

  describe('Authentication', () => {
    describe('/auth/signup (POST)', () => {
      it('should create a new user and return access token', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'testuser@example.com',
            password: 'password123',
            name: 'Test User',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('accessToken');
            expect(typeof res.body.accessToken).toBe('string');
            accessToken = res.body.accessToken;
          });
      });

      it('should return 401 if user already exists', async () => {
        // Primero creamos el usuario
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'testuser@example.com',
            password: 'password123',
            name: 'Test User',
          });

        // Intentamos crear el mismo usuario otra vez
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'testuser@example.com',
            password: 'password123',
            name: 'Test User',
          })
          .expect(401);
      });
    });

    describe('/auth/login (POST)', () => {
      it('should login with valid credentials', async () => {
        // Primero registramos al usuario
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'testuser@example.com',
            password: 'password123',
            name: 'Test User',
          });

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'testuser@example.com',
            password: 'password123',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('accessToken');
            expect(typeof res.body.accessToken).toBe('string');
            expect(res.body).toHaveProperty('weather');
          });
      });

      it('should return 401 with invalid credentials', async () => {
        // Primero registramos al usuario
        await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'testuser@example.com',
            password: 'password123',
            name: 'Test User',
          });

        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'testuser@example.com',
            password: 'wrongpassword',
          })
          .expect(401);
      });

      it('should return 401 with non-existent user', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'password123',
          })
          .expect(401);
      });
    });
  });

  describe('Protected Routes', () => {
    describe('/hello (GET)', () => {
      it('should return 401 without token', () => {
        return request(app.getHttpServer()).get('/hello').expect(401);
      });

      it('should return hello message with valid token', async () => {
        // Registramos un usuario para obtener un token valido
        const signupRes = await request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'testuser@example.com',
            password: 'password123',
            name: 'Test User',
          });

        const token = signupRes.body.accessToken;

        return request(app.getHttpServer())
          .get('/hello')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('Hello World');
            expect(res.body.message).toContain('testuser@example.com');
          });
      });

      it('should return 401 with invalid token', () => {
        return request(app.getHttpServer())
          .get('/hello')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });

      it('should return 401 with malformed authorization header', () => {
        return request(app.getHttpServer())
          .get('/hello')
          .set('Authorization', 'InvalidFormat')
          .expect(401);
      });
    });
  });

  describe('DTO Validation', () => {
    describe('/auth/signup (POST) - validation errors', () => {
      it('should return 400 with invalid email', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'invalid-email',
            password: 'password123',
            name: 'Test User',
          })
          .expect(400);
      });

      it('should return 400 with short password', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'test3@example.com',
            password: '123',
            name: 'Test User',
          })
          .expect(400);
      });

      it('should return 400 with missing fields', () => {
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            email: 'test4@example.com',
          })
          .expect(400);
      });
    });

    describe('/auth/login (POST) - validation errors', () => {
      it('should return 400 with invalid email', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'not-an-email',
            password: 'password123',
          })
          .expect(400);
      });

      it('should return 400 with missing password', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
          })
          .expect(400);
      });
    });
  });
});
