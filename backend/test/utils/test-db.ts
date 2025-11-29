import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

export class TestDb {
  private container: StartedPostgreSqlContainer;
  private prisma: PrismaClient;

  async start() {
    this.container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('strkx_test')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    const databaseUrl = this.container.getConnectionUri();

    // Set env var for Prisma to use
    process.env.DATABASE_URL = databaseUrl;

    // Run migrations/push to set up schema
    // We use db push for speed in tests
    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  async stop() {
    await this.prisma?.$disconnect();
    await this.container?.stop();
  }

  async reset() {
    // Truncate all tables to ensure clean state between tests
    // Order matters if there are foreign keys, but CASCADE usually handles it
    const tablenames = await this.prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables.length > 0) {
      await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  }

  getPrisma() {
    return this.prisma;
  }
}
