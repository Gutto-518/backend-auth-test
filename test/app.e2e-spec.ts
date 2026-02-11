import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App E2E Tests', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // ✅ IMPORTANTE: Habilitar validación global en tests E2E
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

      it('should return 401 if user already exists', () => {
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
      it('should login with valid credentials', () => {
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
          });
      });

      it('should return 401 with invalid credentials', () => {
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

      it('should return hello message with valid token', () => {
        return request(app.getHttpServer())
          .get('/hello')
          .set('Authorization', `Bearer ${accessToken}`)
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