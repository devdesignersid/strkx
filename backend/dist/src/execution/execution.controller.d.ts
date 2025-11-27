import { ExecutionService } from './execution.service';
import { ExecuteCodeDto } from './dto/execute-code.dto';
export declare class ExecutionController {
    private readonly executionService;
    constructor(executionService: ExecutionService);
    execute(executeCodeDto: ExecuteCodeDto): Promise<{
        passed: boolean;
        results: any[];
    }>;
}
