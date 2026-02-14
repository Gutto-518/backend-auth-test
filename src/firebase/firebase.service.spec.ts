import { Test, TestingModule } from '@nestjs/testing';

// =========================================================
// Mockeamos firebase-admin ANTES de importar FirebaseService
// =========================================================
// jest.mock() se "hoistea" automaticamente al inicio del archivo.
// Esto significa que cuando FirebaseService haga
// import * as admin from 'firebase-admin', recibira nuestro mock.
// =========================================================

// Usamos una variable mutable para controlar el estado de apps
let mockApps: any[] = [];

jest.mock('firebase-admin', () => {
  const mockFirestore = { collection: jest.fn() };
  return {
    // Usamos un getter para que lea mockApps dinamicamente
    get apps() {
      return mockApps;
    },
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn().mockReturnValue('mock-credential'),
    },
    firestore: jest.fn().mockReturnValue(mockFirestore),
  };
});

// Mockeamos el archivo de credenciales
// En CI no existira porque esta en .gitignore
jest.mock('../../serviceAccountKey.json', () => ({
  project_id: 'mock-project',
  private_key: 'mock-key',
  client_email: 'mock@mock.com',
}));

import { FirebaseService } from './firebase.service';
import * as admin from 'firebase-admin';

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockApps = []; // Reinicia el estado de apps

    const module: TestingModule = await Test.createTestingModule({
      providers: [FirebaseService],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
  });

  it('should initialize firebase app', () => {
    expect(admin.initializeApp).toHaveBeenCalledWith({
      credential: 'mock-credential',
    });
  });

  it('should have firestore instance', () => {
    expect(service.firestore).toBeDefined();
    expect(admin.firestore).toHaveBeenCalled();
  });

  it('should not re-initialize if app already exists', async () => {
    // Simulamos que ya hay una app inicializada
    mockApps = [{}];

    const module: TestingModule = await Test.createTestingModule({
      providers: [FirebaseService],
    }).compile();

    module.get<FirebaseService>(FirebaseService);

    // initializeApp se llamo 1 vez (del beforeEach), no 2
    expect(admin.initializeApp).toHaveBeenCalledTimes(1);
  });
});
