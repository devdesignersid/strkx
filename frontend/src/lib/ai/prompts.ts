export const PROMPTS = {
  PROBLEM_GENERATION: `
You are an expert technical interview problem setter.
Generate a coding problem based on the following title/topic: "{topic}".

Return the result in JSON format with the following structure:
{
  "description": "Markdown description of the problem. Use proper paragraphs with double newlines. Include a clear problem statement.",
  "examples": [
    { "input": "[-1,0,1,2,-1,-4]", "output": "[[-1,-1,2],[-1,0,1]]", "explanation": "..." }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "tags": ["tag1", "tag2"]
}

IMPORTANT:
1. The description should be in valid Markdown.
2. Use double newlines (\\n\\n) for paragraph breaks to ensure correct rendering.
3. Do NOT include Examples or Constraints in the "description" field; they will be added automatically.
4. Keep the description clear, concise, and professional (LeetCode style).
5. For "input" and "output" fields in examples, provide ONLY the raw JSON value (e.g., "[1,2,3]" or "5"). Do NOT include variable names (e.g., "nums = [1,2,3]" is WRONG).
`,
  SOLUTION_HINT: `
You are a helpful coding tutor. The user is stuck on a problem.
Problem: {problemDescription}
User's Code:
{userCode}

Provide a small, progressive hint to help them move forward without giving away the full solution.
Keep it short (1-2 sentences).
`,
  SOLUTION_COMPLETION: `
You are an expert coding assistant.
Problem: {problemDescription}
Current Code/Starter Code:
{userCode}

Generate the **FULL COMPLETE SOLUTION CODE** for this problem.
1. Use the provided starter code signature exactly.
2. Implement the solution inside the function.
3. Return the COMPLETE code (signature + body).
4. Do NOT return just the body. Return the whole valid file content.
5. Do NOT use markdown formatting (no \`\`\`).
`,
  SOLUTION_EVALUATION: `
Analyze the following solution for the problem: "{problemTitle}".
Code:
{userCode}

Evaluate for:
1. Time Complexity
2. Space Complexity
3. Code Quality/Readability
4. Correctness (potential edge cases)

Return JSON:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "score": 8, // 1-10
  "feedback": "Markdown feedback. Use \\n for newlines. Do NOT use literal newlines.",
  "suggestions": ["suggestion 1", "suggestion 2"]
}

IMPORTANT:
1. Return VALID JSON.
2. Escape all newlines in strings (use \\n).
3. Do not include control characters.
`,
};
