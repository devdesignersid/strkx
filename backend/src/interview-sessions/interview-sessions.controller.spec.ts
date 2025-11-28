import { Test, TestingModule } from '@nestjs/testing';
import { InterviewSessionsController } from './interview-sessions.controller';

describe('InterviewSessionsController', () => {
  let controller: InterviewSessionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewSessionsController],
    }).compile();

    controller = module.get<InterviewSessionsController>(InterviewSessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
