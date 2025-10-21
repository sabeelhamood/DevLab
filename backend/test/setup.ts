import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { CacheService } from '../src/shared/cache/cache.service';

let app: INestApplication;
let moduleFixture: TestingModule;
let dataSource: DataSource;
let cacheService: CacheService;

beforeAll(async () => {
  moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  dataSource = moduleFixture.get<DataSource>(DataSource);
  cacheService = moduleFixture.get<CacheService>(CacheService);
});

afterAll(async () => {
  if (dataSource) {
    await dataSource.destroy();
  }
  if (app) {
    await app.close();
  }
  if (moduleFixture) {
    await moduleFixture.close();
  }
});

beforeEach(async () => {
  // Clear database before each test
  if (dataSource) {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  }

  // Clear cache before each test
  if (cacheService) {
    await cacheService.flushAll();
  }
});

export { app, moduleFixture, dataSource, cacheService };
