
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionService } from './execution.service';
import { DriverGenerator } from './driver-generator';
import { PrismaService } from '../prisma/prisma.service';

describe('ExecutionService (Design Problems)', () => {
    let service: ExecutionService;
    let driverGenerator: DriverGenerator;

    const mockPrismaService = {
        problem: {
            findFirst: jest.fn(),
        },
        submission: {
            create: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExecutionService,
                DriverGenerator,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<ExecutionService>(ExecutionService);
        driverGenerator = module.get<DriverGenerator>(DriverGenerator);
    });

    it('should generate correct driver script', () => {
        const className = 'LRUCache';
        const script = driverGenerator.generate(className);
        expect(script).toContain(`const constructorCmd = commands[0];`);
        expect(script).toContain(`if (constructorCmd !== '${className}')`);
        expect(script).toContain(`instance = new ${className}(...constructorArgs);`);
    });

    it('should execute a design problem correctly', async () => {
        const problem = {
            id: '1',
            slug: 'lru-cache',
            type: 'DESIGN',
            className: 'LRUCache',
            testCases: [
                {
                    id: 'tc1',
                    input: JSON.stringify({
                        commands: ['LRUCache', 'put', 'get'],
                        values: [[2], [1, 1], [1]],
                    }),
                    expectedOutput: JSON.stringify([null, null, 1]),
                },
            ],
        };

        mockPrismaService.problem.findFirst.mockResolvedValue(problem);

        const userCode = `
      class LRUCache {
        constructor(capacity) {
          this.capacity = capacity;
          this.cache = new Map();
        }
        get(key) {
          if (!this.cache.has(key)) return -1;
          const val = this.cache.get(key);
          this.cache.delete(key);
          this.cache.set(key, val);
          return val;
        }
        put(key, value) {
          if (this.cache.has(key)) {
            this.cache.delete(key);
          }
          this.cache.set(key, value);
          if (this.cache.size > this.capacity) {
            this.cache.delete(this.cache.keys().next().value);
          }
        }
      }
    `;

        const result = await service.execute({
            code: userCode,
            problemSlug: 'lru-cache',
            mode: 'run',
            language: 'javascript',
        }, { id: 'user-1' });

        expect(result.passed).toBe(true);
        expect(result.results[0].passed).toBe(true);
        expect(JSON.parse(result.results[0].actualOutput)).toEqual([null, null, 1]);
    });
});
