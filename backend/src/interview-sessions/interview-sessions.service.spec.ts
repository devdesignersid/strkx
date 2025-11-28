import { Test, TestingModule } from '@nestjs/testing';
import { InterviewSessionsService } from './interview-sessions.service';

describe('InterviewSessionsService', () => {
  let service: InterviewSessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InterviewSessionsService],
    }).compile();

    service = module.get<InterviewSessionsService>(InterviewSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
