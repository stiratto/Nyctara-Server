import { Test, TestingModule } from '@nestjs/testing';
import { ImageOptimizerService } from './image-optimizer.service';

describe('ImageOptimizerService', () => {
  let service: ImageOptimizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageOptimizerService],
    }).compile();

    service = module.get<ImageOptimizerService>(ImageOptimizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
