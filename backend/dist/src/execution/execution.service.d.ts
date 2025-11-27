import { ExecuteCodeDto } from './dto/execute-code.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class ExecutionService {
    private prisma;
    constructor(prisma: PrismaService);
    execute(executeCodeDto: ExecuteCodeDto): Promise<{
        passed: boolean;
        results: any[];
    }>;
}
