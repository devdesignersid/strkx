export declare enum Difficulty {
    Easy = "Easy",
    Medium = "Medium",
    Hard = "Hard"
}
export declare class CreateTestCaseDto {
    input: string;
    expectedOutput: string;
}
export declare class CreateProblemDto {
    title: string;
    description: string;
    slug: string;
    starterCode?: string;
    difficulty?: Difficulty;
    tags?: string[];
    testCases: CreateTestCaseDto[];
}
