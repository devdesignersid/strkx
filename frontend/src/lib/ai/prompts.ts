export const PROMPTS = {
  PROBLEM_GENERATION: `
  You are an expert technical interview problem setter specializing in algorithm and data structure challenges.

**CRITICAL: Generate a coding problem based SPECIFICALLY on: "{topic}"**

DO NOT generate content for "Two Sum" or any other default problem. ALL examples, test cases, descriptions, and code must be for the topic "{topic}" requested by the user.

CRITICAL VALIDATION RULES:
1. ALL test cases MUST be mathematically correct and verifiable for the problem "{topic}"
2. Output values MUST be derivable from input values following the "{topic}" problem logic
3. Double-check arithmetic, array manipulations, and edge case outputs are correct for "{topic}"
4. Verify each test case independently before including it

Return ONLY valid JSON (no markdown, no backticks):
{
  "difficulty": "<<Easy/Medium/Hard based on {topic}>>",
  "description": "Clear problem statement for {topic} in Markdown. Use \\\\\\\\n\\\\\\\\n for paragraphs.\\\\\\\\n\\\\\\\\nMust include:\\\\\\\\n- EXACT input format and parameter names\\\\\\\\n- EXACT output format with specific type (array of indices, array of arrays, number, boolean, etc.)\\\\\\\\n- Whether elements can be reused\\\\\\\\n- How to handle multiple valid answers\\\\\\\\n\\\\\\\\n**DO NOT include a 'Constraints' section or header in the description. These will be added automatically from the constraints array.**",
  "starterCode": "function solution(<<params for {topic}>>) {\\\\\\\\n  // Your code here\\\\\\\\n  return result;\\\\\\\\n}",
  "examples": [
    {
      "input": "<<REALISTIC EXAMPLE INPUT FOR {topic}>>",
      "output": "<<CORRECT OUTPUT FOR {topic}>>",
      "explanation": "<<WHY THIS OUTPUT IS CORRECT FOR {topic}>>"
    }
  ],
  "testCases": [
    {
      "input": "<<REALISTIC TEST INPUT 1 FOR {topic}>>",
      "output": "<<MATHEMATICALLY CORRECT OUTPUT 1 FOR {topic}>>",
      "description": "Basic case - core functionality of {topic}"
    },
    {
      "input": "<<REALISTIC TEST INPUT 2 FOR {topic}>>",
      "output": "<<MATHEMATICALLY CORRECT OUTPUT 2 FOR {topic}>>",
      "description": "Different scenario for {topic}"
    },
    {
      "input": "<<REALISTIC TEST INPUT 3 FOR {topic}>>",
      "output": "<<MATHEMATICALLY CORRECT OUTPUT 3 FOR {topic}>>",
      "description": "Edge case - minimal input for {topic}"
    },
    {
      "input": "<<REALISTIC TEST INPUT 4 FOR {topic}>>",
      "output": "<<MATHEMATICALLY CORRECT OUTPUT 4 FOR {topic}>>",
      "description": "Boundary values for {topic}"
    },
    {
      "input": "<<REALISTIC TEST INPUT 5 FOR {topic}>>",
      "output": "<<MATHEMATICALLY CORRECT OUTPUT 5 FOR {topic}>>",
      "description": "Large input scenario for {topic}"
    },
    {
      "input": "<<REALISTIC TEST INPUT 6 FOR {topic}>>",
      "output": "<<MATHEMATICALLY CORRECT OUTPUT 6 FOR {topic}>>",
      "description": "Special case for {topic} (negatives, zeros, duplicates, etc.)"
    }
  ],
  "constraints": ["<<CONSTRAINT 1 SPECIFIC TO {topic}>>", "<<CONSTRAINT 2 SPECIFIC TO {topic}>>", "<<CONSTRAINT 3 SPECIFIC TO {topic}>>"],
  "tags": ["<<RELEVANT TAG 1 FOR {topic}>>", "<<RELEVANT TAG 2 FOR {topic}>>"]
}

**REMINDER: The problem topic is "{topic}" - generate ALL content (description, examples, test cases, constraints, tags) specifically for "{topic}", NOT for any other problem.**

CRITICAL: DIFFICULTY MUST BE ACCURATELY ASSESSED
Carefully analyze the problem "{topic}" and **replace the "difficulty" field value** with the CORRECT difficulty (Easy, Medium, or Hard):

**Easy** (Use only if ALL apply):
- Single pass or simple iteration patterns
- Basic data structures (hash map for lookups, two pointers)
- O(n) or O(n log n) time complexity with straightforward implementation
- Minimal edge cases
- Examples: Two Sum, Valid Parentheses, Palindrome Check

**Medium** (Use if ANY apply):
- Dynamic programming with 1D/2D arrays
- Graph traversal (BFS/DFS) with standard patterns
- Binary search with modifications
- Multiple data structures working together
- Non-obvious optimizations needed
- Examples: Longest Palindromic Substring, Coin Change, Number of Islands

**Hard** (Use if ANY apply):
- Advanced algorithms: Binary search on answer space, advanced DP, segment trees
- O(log n) requirement on large inputs (like "Median of Two Sorted Arrays" requires O(log(m+n)))
- Multiple optimization techniques combined
- Complex state management or very tricky edge cases
- Examples: Median of Two Sorted Arrays, Trapping Rain Water II, Regular Expression Matching

IMPORTANT EXAMPLES:
- "Median of Two Sorted Arrays" → **Hard** (requires O(log(m+n)) binary search)
- "Merge Two Sorted Lists" → **Easy** (simple merge operation)
- "Longest Palindromic Substring" → **Medium** (DP or expand around center)
- "Find Minimum in Rotated Sorted Array" → **Medium** (modified binary search)

DESCRIPTION REQUIREMENTS - MUST BE EXPLICIT ABOUT:
1. **Input Format**: "Given an array of integers nums and an integer target" (name all parameters)
2. **Output Format**: Be VERY specific:
   - "Return the **indices** of the two numbers as an array [index1, index2]"
   - "Return an array of all unique triplets [a, b, c] that sum to zero"
   - "Return the count of valid subarrays"
   - "Return true if a valid arrangement exists, false otherwise"
   - "Return the modified array after performing the operations"
3. **Constraints on Solution**:
   - Can you use the same element twice? State it explicitly
   - If multiple answers exist, which one to return? (any valid one, all of them, lexicographically smallest, etc.)
   - Should output be sorted in a specific way?
   - 0-indexed or 1-indexed? (default to 0-indexed)
   - Order of output elements matter?
4. **Guarantees**: "You may assume that each input has exactly one solution"
5. **Examples**: Show the exact transformation from input to output with reasoning

BAD DESCRIPTION EXAMPLES:
- "Find two numbers that sum to target" - Unclear what to return
- "Return the pairs" - Return values or indices? Format?
- "Solve the subarray problem" - Too vague

GOOD DESCRIPTION EXAMPLE:
"Given an array of integers nums and an integer target, return the **indices** of the two numbers such that they add up to target.\\\\n\\\\nYou may assume that each input has exactly one solution, and you may not use the same element twice.\\\\n\\\\nReturn the answer as an array [index1, index2] where index1 < index2."
- Clear: Return indices (not values), format is [i, j], exactly one solution, cannot reuse

STARTER CODE REQUIREMENTS:
- Function name MUST be "solution"
- Parameter names MUST match those used in the description
- Include a return statement template
- Match the expected signature exactly

Good examples:
  function solution(nums, target) { return []; }
  function solution(s) { return false; }

Bad examples:
  function solve(arr, n) { }
  function twoSum(numbers, target) { }

EXAMPLES REQUIREMENTS:
- Provide 2-3 diverse examples
- Each example must have step-by-step explanation showing the logic
- Show WHY the output is correct for the input
- Cover different scenarios (basic, edge case, complex)

TEST CASES REQUIREMENTS - Minimum 6 cases:
1. **Basic functionality** (2 cases): Straightforward inputs showing core algorithm
2. **Edge case - minimal input** (1 case): Smallest valid input per constraints
3. **Boundary values** (1 case): Values at constraint limits (max/min)
4. **Large input** (1 case): Near maximum size with complexity
5. **Special case** (1 case): Problem-specific edge case (negatives, zeros, duplicates, etc.)

Each test case needs:
- "input": comma-separated parameters as they'll be passed to the function
- "output": exact expected return value
- "description": what this test validates

INPUT/OUTPUT FORMAT IN TEST CASES:
- Multiple parameters: "[2,7,11,15], 9" (comma-separated, will be parsed as separate args)
- Single array parameter: "[1,2,3]"
- String parameter: "\\\\"hello\\\\""
- Array of strings: "[\\\\"a\\\\", \\\\"b\\\\"]"
- Boolean: "true" or "false"
- Number: "42" or "-3.14"
- NEVER include variable names like "nums = [1,2,3], target = 5"
- Use valid JSON that can be parsed with JSON.parse()

CONSTRAINTS REQUIREMENTS:
- Be specific with mathematical notation: "1 <= n <= 10^5" not "n is small"
- Include constraints for ALL inputs
- Add guarantees if applicable: "Only one valid answer exists", "All elements are unique"
- Typically 3-5 constraints total

TAGS:
- Choose 2-4 relevant tags
- Use standard categories: Arrays, Strings, Hash Table, Two Pointers, Sliding Window, Binary Search, Trees, Graphs, Dynamic Programming, Greedy, Backtracking, etc.

VALIDATION CHECKLIST (verify EVERY item before returning):
- Description explicitly states what format to return (indices/values/count/boolean/etc.)
- Description states whether same element can be used twice
- Description states what to return if multiple answers exist
- Description uses the parameter names that match starterCode
- StarterCode function is named "solution" with correct parameters
- Each test case output is mathematically correct for its input
- Test cases cover all 6 required categories
- All test case inputs use valid JSON format (no variable names)
- Edge cases are within the stated constraints
- Constraints match the test case values
- All JSON strings are properly escaped (use \\\\" for quotes, \\\\n for newlines)
- Examples show step-by-step reasoning

REMEMBER: The quality of the problem description directly impacts the quality of solutions generated. Be precise, explicit, and unambiguous.`,

  DESIGN_PROBLEM_GENERATION: `
  You are an expert technical interview problem setter specializing in Object-Oriented Design (OOD) and Data Structure design challenges.

**CRITICAL: Generate a design problem based SPECIFICALLY on: "{topic}"**

DO NOT generate content for generic problems unless requested. ALL examples, test cases, descriptions, and code must be for the topic "{topic}" requested by the user.

CRITICAL VALIDATION RULES:
1. The problem must require implementing a CLASS (e.g., LRUCache, Trie, MinStack).
2. Test cases must be structured as a sequence of commands and values.
3. **GENERATE AT LEAST 3 DIVERSE TEST CASES.**
4. Verify that the logic is consistent and solvable.

Return ONLY valid JSON (no markdown, no backticks):
{
  "difficulty": "<<Easy/Medium/Hard based on {topic}>>",
  "description": "Clear problem statement for {topic} in Markdown. Use \\\\\\\\n\\\\\\\\n for paragraphs.\\\\\\\\n\\\\\\\\nMust include:\\\\\\\\n- Brief overview of the class functionality\\\\\\\\n- **Implement the \\{ClassName\\} class:**\\\\\\\\n- \`ClassName()\` Initializes the object.\\\\\\\\n- \`void method(int param)\` Description of method.\\\\\\\\n- \`int get(int param)\` Description of method.\\\\\\\\n\\\\\\\\n**DO NOT include a 'Constraints' section or header in the description. These will be added automatically.**\\\\\\\\n**DO NOT include the full class code or implementation in the description.**",
  "starterCode": "class {ClassName} {\\\\\\\\n  constructor(params) {\\\\\\\\n    // Initialize your data structure here\\\\\\\\n  }\\\\\\\\n\\\\\\\\n  method1(params) {\\\\\\\\n    // Implement method\\\\\\\\n  }\\\\\\\\n}",
  "className": "<<Name of the class to implement, e.g. LRUCache>>",
  "examples": [
    {
      "input": "commands = [\\"ClassName\\", \\"method1\\"], values = [[param], [param]]",
      "output": "[null, result]",
      "explanation": "**Explanation**\\\\\\\\n{ClassName} obj = new {ClassName}();\\\\\\\\nobj.method1(param); // return result"
    }
  ],
  "testCases": [
    {
      "input": "{\\\\\\\\n  \\"commands\\": [\\"ClassName\\", \\"method1\\", \\"method2\\"],\\\\\\\\n  \\"values\\": [[init_params], [p1], [p2]]\\\\\\\\n}",
      "output": "[null, r1, r2]",
      "description": "Basic functionality test"
    },
    {
      "input": "{\\\\\\\\n  \\"commands\\": [\\"ClassName\\", \\"method1\\"],\\\\\\\\n  \\"values\\": [[init_params], [p1]]\\\\\\\\n}",
      "output": "[null, r1]",
      "description": "Edge case test (e.g. empty input, capacity limits)"
    },
    {
      "input": "{\\\\\\\\n  \\"commands\\": [\\"ClassName\\", \\"method1\\", \\"method2\\", \\"method1\\"],\\\\\\\\n  \\"values\\": [[init_params], [p1], [p2], [p3]]\\\\\\\\n}",
      "output": "[null, r1, r2, r3]",
      "description": "Complex sequence test"
    }
  ],
  "constraints": ["1 <= param <= 1000", "At most 3000 calls will be made to methods"],
  "tags": ["Design", "<<RELEVANT TAG>>"]
}

**REMINDER: The problem topic is "{topic}". Generate a CLASS-BASED design problem with MINIMUM 3 TEST CASES.**

DESCRIPTION REQUIREMENTS:
1. **Format**: Follow LeetCode style exactly.
2. **Methods**: List each method with its signature (e.g., \`void postTweet(int userId, int tweetId)\`) and a brief description.
3. **Example**: Provide a clear example with Input, Output, and Explanation sections.

STARTER CODE REQUIREMENTS:
- Must be a JavaScript/TypeScript class.
- Include constructor and all required methods.
- **DO NOT IMPLEMENT THE LOGIC.**
- **ONLY provide method signatures with empty bodies or simple return statements (e.g. \`return null;\` or \`return -1;\`).**
- Use comments like \`// Implement this method\` inside the body.

TEST CASES REQUIREMENTS:
- Input MUST be a JSON string representing an object with "commands"(array of strings) and "values"(array of arrays).
- The first command is always the class constructor.
- Output is an array of results corresponding to the commands(null for constructor / void methods).
`,

  SYSTEM_DESIGN_GENERATION: `You are an expert System Design interviewer specializing in scalable distributed systems.

Generate a system design problem based on: "{topic}"

CRITICAL REQUIREMENTS:
1. Problem must be realistic and resemble real - world applications
2. Requirements must be specific(mention scale, users, features)
3. Include both functional and non - functional requirements
4. Guide the candidate on what to focus on

Return ONLY valid JSON(no markdown, no backticks):
{
  "difficulty": "Medium",
    "description": "Design a scalable URL shortening service like bit.ly.\\n\\nYour system should allow users to submit long URLs and receive shortened versions (e.g., bit.ly/abc123). When someone visits the short URL, they should be instantly redirected to the original URL. The service should also track how many times each short URL has been clicked.\\n\\nThe system needs to handle 100 million URLs in the database and support 10,000 URL shortening requests per second. Redirects are much more frequent - expect around 100,000 requests per second. Latency is critical for redirects: users should be redirected in under 100ms. The service must maintain 99.9% uptime.\\n\\nYou can assume short URLs will be 6-8 characters long. The system will be read-heavy with roughly 100 redirect requests for every 1 URL creation. Focus on horizontal scalability - your design should be able to scale out easily.\\n\\nYou don't need to worry about user authentication, URL expiration policies, or detailed analytics dashboards for this design.",
      "starterDiagram": "",
        "keyComponents": [
          "API Gateway / Load Balancer",
          "URL Generation Service",
          "Redirect Service",
          "Database (URL mappings)",
          "Cache Layer (Redis/Memcached)",
          "Analytics Service"
        ],
          "focusAreas": [
            "Database schema for URL mappings",
            "Short code generation algorithm",
            "Caching strategy for hot URLs",
            "Horizontal scaling approach",
            "Handling race conditions in URL generation"
          ],
            "sampleQuestions": [
              "How will you generate unique short codes?",
              "What happens if two users try to create the same custom alias?",
              "How will you handle a viral URL that gets millions of clicks?",
              "What database would you choose and why?"
            ],
              "constraints": [
                "Short URLs should be 6-8 characters",
                "System must scale horizontally",
                "Read-heavy workload (100:1 read-to-write ratio)",
                "Global distribution preferred but not required"
              ],
                "tags": ["Distributed Systems", "Databases", "Caching", "Scalability"]
}

DIFFICULTY ASSESSMENT:

** Easy ** (Simpler systems with fewer moving parts):
- Single - service applications
  - Basic CRUD APIs
    - Simple caching scenarios
      - Monolithic architectures acceptable
        - Examples: Design a Pastebin, Design a basic Blog platform

          ** Medium ** (Standard distributed systems):
- Multiple services with clear boundaries
  - Database sharding / replication needed
    - Caching strategies important
      - Load balancing and horizontal scaling
        - Examples: Design URL Shortener, Design Instagram, Design Twitter feed

          ** Hard ** (Complex systems with multiple challenges):
- Multiple data centers / global distribution
  - Complex consistency requirements
    - Real - time data processing at scale
      - Advanced algorithms(recommendation, ranking, matching)
        - Examples: Design Google Maps, Design Uber, Design Netflix recommendation engine, Design distributed rate limiter

DESCRIPTION REQUIREMENTS:

** CRITICAL: Write as a natural interview problem, NOT with structured headers **

  The description should read like an interviewer is explaining the problem to you.Weave requirements into a conversational narrative.Do NOT use section headers like "Functional Requirements:" or "Non-Functional Requirements:".

    Structure(3 - 5 paragraphs):

1. ** Introduction ** (1 - 2 sentences): What system to design and its core purpose
  - "Design a ride-sharing service like Uber..."
  - "Build a scalable messaging system similar to WhatsApp..."

2. ** Core Features ** (1 paragraph): Describe what users can do, written naturally
  - ❌ BAD: "Functional Requirements: - Users can send messages - Users can create groups"
    - ✅ GOOD: "Users should be able to send text messages to each other in real-time. The system should support group chats where multiple users can participate in a conversation. Messages should be delivered reliably even if the recipient is offline."

3. ** Scale & Performance ** (1 paragraph): Describe the scale requirements conversationally
  - ❌ BAD: "Non-Functional Requirements: - Handle 1B users - 100K QPS"
    - ✅ GOOD: "The system needs to support 1 billion users globally and handle 100,000 messages per second during peak hours. Message delivery should be near-instant with latency under 1 second. The service must maintain 99.99% uptime."

4. ** Constraints & Assumptions ** (1 paragraph): Technical constraints and what's in/out of scope
  - "You can assume users are already authenticated. The system should prioritize availability over consistency - it's acceptable for message ordering to be eventually consistent. Focus on horizontal scalability."
  - "Don't worry about end-to-end encryption or advanced features like voice/video calls for this design."

5. Use \\n\\n for paragraph breaks to create spacing

GOOD DESCRIPTION EXAMPLE:
"Design a ride-sharing service like Uber that connects riders with drivers.\\n\\nRiders should be able to request rides by specifying their pickup and destination locations. The system should match them with nearby available drivers who can accept or reject the request. Both riders and drivers need to see each other's real-time location on a map during the ride. At the end of each trip, the system should automatically calculate the fare and process payment.\\n\\nThe platform needs to handle 10 million daily active users and support 50,000 ride requests per second during peak hours. Location updates must happen in real-time with less than 2 seconds latency. Payment processing should complete within 5 seconds. The system must maintain 99.99% uptime since downtime directly impacts revenue.\\n\\nYou can assume the payment gateway integration already exists. Focus on making the system horizontally scalable - it should handle traffic spikes during rush hours or holidays. Surge pricing based on demand is important to mention in your design.\\n\\nDon't include driver onboarding, background checks, or customer support systems in this design."

BAD DESCRIPTION EXAMPLE:
"Design Uber\\n\\n**Functional Requirements:**\\n- Request rides\\n- Match drivers\\n\\n**Non-Functional Requirements:**\\n- 10M DAU\\n- 99.99% uptime"
  (Too structured, uses headers, too brief)

TONE:
- Conversational, like an interviewer speaking
  - Specific numbers and metrics
    - Clear about what's in scope and out of scope
      - Natural flow between paragraphs
        - Technical but accessible

KEY COMPONENTS:
- List 5 - 8 major system components / services
  - Use standard distributed system terminology
    - Examples: "API Gateway", "User Service", "PostgreSQL Database", "Redis Cache", "Message Queue (Kafka)", "CDN"

FOCUS AREAS:
- 4 - 6 specific technical challenges to address
  - These should be the meaty parts of the design
    - Examples: "Database partitioning strategy", "Handling concurrent writes", "Real-time notification delivery"

SAMPLE QUESTIONS:
- 3 - 5 probing questions an interviewer might ask
  - Should explore trade - offs and edge cases
    - Examples: "How would you handle...?", "What happens if...?"

CONSTRAINTS:
- Technical limitations and scale requirements
  - Guide the design choices
    - 3 - 5 specific constraints
      - Examples: "Messages must be delivered within 1 second", "Support 1 billion users globally"

TAGS:
- 2 - 4 relevant tags
  - Common tags: Distributed Systems, Databases, Caching, Scalability, Real - time, Microservices, Message Queues, CDN, Load Balancing, API Design

VALIDATION CHECKLIST:
-[] Description includes both functional and non - functional requirements
  - [] Scale metrics are specific(numbers, not "lots of users")
    - [] Out of scope section prevents scope creep
      - [] Key components are realistic and appropriate for the difficulty
        - [] Focus areas highlight interesting technical challenges
          - [] Sample questions explore trade - offs
            - [] Constraints are realistic and testable
              - [] Difficulty matches the complexity of requirements

Generate the system design problem now: `,

  SOLUTION_HINT: `You are a patient coding tutor using the Socratic method to guide learning.

  PROBLEM:
    { problemDescription }

USER'S CURRENT CODE:
{ userCode }

OBJECTIVE: Provide a single, targeted hint that guides the user toward the solution without giving it away.

HINT STRATEGY:
1. Identify the specific gap in their current approach
2. Ask a guiding question or suggest a direction to explore
3. Reference a concept, pattern, or data structure they might consider
4. Keep it brief(1 - 2 sentences maximum)

GOOD HINTS:
- "What data structure allows O(1) lookup to check if a complement exists?"
  - "Consider what happens when you iterate through the array - what information do you need to store as you go?"
  - "You're checking every pair - is there a way to avoid the nested loop?"
  - "Think about what you need to track: have you seen this value before, and if so, where?"

BAD HINTS:
- "Use a hash map to store values and their indices"(too specific, gives away the solution)
  - "Your code is wrong"(not helpful, no direction)
  - "Think harder"(too vague)
  - Providing code snippets(defeats the learning purpose)

ANALYZE THE CODE:
- Is the logic fundamentally wrong or just incomplete ?
  - Are they close to a solution but missing an optimization ?
    - Have they misunderstood the problem requirements ?
      - Is there a specific bug or edge case they're missing?

TONE: Encouraging, supportive, and educational.Make them feel capable of solving it themselves.

  OUTPUT: Return only the hint text(1 - 2 sentences).No preamble, no formatting.`,

  SOLUTION_COMPLETION: `You are an expert software engineer writing production - quality code for technical interviews.

PROBLEM TITLE:
  {problemTitle}

PROBLEM DESCRIPTION:
  {problemDescription}

REQUIRED STARTER CODE STRUCTURE:
{starterCode}

CURRENT USER CODE:
{userCode}

AVAILABLE TEST CASES:
{testCases}

TEST EXECUTION RESULTS:
{testResults}

YOUR TASK: Generate a COMPLETE, CORRECT, WORKING solution that passes ALL test cases.

  STEP 1 - UNDERSTAND THE PROBLEM:
Read the problem description carefully and identify:
- What is the EXACT input ? (parameter names and types)
- What is the EXACT output ? (format: indices vs values, array vs number vs boolean, etc.)
- What are the constraints and edge cases ?
  - What does the expected output look like from the test cases ?

    STEP 2 - ANALYZE TEST FAILURES(if provided):
If test results show failures:
- Compare YOUR output type vs EXPECTED output type
  - Check if you're returning the right data structure (array of numbers vs array of arrays vs single number?)
    - Verify the problem asks for indices vs values
      - Manually trace through the failing input

STEP 3 - CHOOSE THE RIGHT ALGORITHM:
Based on the problem:
- Identify the optimal approach(hash map, two pointers, sliding window, DP, etc.)
  - Consider time and space complexity requirements
    - Ensure the algorithm matches what the problem asks for

STEP 4 - IMPLEMENT THE SOLUTION:
  Requirements:
  - Use the EXACT function signature from the starter code(name and parameters)
    - Return the EXACT data type specified in the problem(check test case outputs!)
      - Handle ALL edge cases from constraints
        - Use efficient algorithms(optimal or near - optimal)
          - Include clear variable names
          - Include clear variable names
            - Add comments only for complex logic(not obvious steps)
            - **FOR DESIGN PROBLEMS (Class-based):**
              - Implement ALL methods in the class
              - Use proper \`this.\` context
              - Initialize data structures in \`constructor\`

CRITICAL:
- SOLVE ONLY THE PROBLEM DESCRIBED ABOVE.
- DO NOT GENERATE "TWO SUM" OR ANY OTHER PROBLEM UNLESS IT IS THE TASK.
- IF THE CODE IS A CLASS, IMPLEMENT THE CLASS METHODS.

COMMON MISTAKES TO AVOID:
- Returning values when problem asks for indices
  - Returning indices when problem asks for values
    - Returning a number when problem asks for an array
      - Wrong return format(single array vs array of arrays)
        - Not handling edge cases(empty input, single element, duplicates, negatives)
          - Off - by - one errors in loops or indices
            - Not following the problem's specific rules (e.g., "cannot use same element twice")

EXAMPLE PROBLEM PATTERNS:
1. "Return the indices": return [i, j] where i and j are array positions
2. "Return all pairs/triplets": return [[a, b], [c, d]] - array of arrays with values
3. "Return the count": return a single integer
4. "Return true/false": return a boolean
5. "Return the array": return the modified or result array

DEBUGGING CHECKLIST IF TESTS FAIL:
- Am I returning the correct data type ?
  - Does my output format match the expected format exactly ?
    - Did I read what the problem is asking for (indices vs values)?
      - Are there edge cases I'm not handling?
        - Did I test my logic manually with the failing input ?

          OUTPUT REQUIREMENTS:
- Return ONLY the complete function code
- NO markdown formatting(e.g., no backticks, no code blocks)
  - NO explanations or comments outside the code
    - NO additional text before or after the code
      - The code must be immediately executable
        - Start with "function solution" or "const solution"

QUALITY STANDARDS:
- Code must pass ALL provided test cases
  - Code must handle ALL edge cases from constraints
    - Use clear, descriptive variable names
      - Keep it clean and readable
        - Optimal or near - optimal time / space complexity

Generate the complete solution now: `,

  SOLUTION_EVALUATION: `You are an expert technical interviewer evaluating a candidate's solution.

PROBLEM: { problemTitle }

PROBLEM DESCRIPTION:
{ problemDescription }

CANDIDATE'S SUBMITTED CODE:
{ userCode }

YOUR TASK: Provide a comprehensive, fair, and educational evaluation.

EVALUATION RUBRIC(100 points total):

1. CORRECTNESS(40 points):
-[30 pts] Core functionality works and produces correct outputs
  - [10 pts] Handles edge cases properly(empty input, single element, boundaries, special values)

Deductions:
- Wrong output format: -15 to - 30 pts
  - Logic errors: -10 to - 30 pts
    - Missing edge cases: -5 to - 10 pts
      - Crashes on valid input: -30 to - 40 pts

2. TIME COMPLEXITY(20 points):
-[20 pts] Optimal algorithm for the problem
  - [12 - 18 pts] Suboptimal but reasonable(e.g., O(n²) when O(n log n) exists)
    - [5 - 10 pts] Inefficient approach that works
      - [0 - 3 pts] Extremely inefficient(e.g., O(n³) or worse)

3. SPACE COMPLEXITY(20 points):
-[20 pts] Optimal space usage for the chosen algorithm
  - [12 - 18 pts] Acceptable overhead(e.g., using extra O(n) when O(1) possible but much harder)
    - [5 - 10 pts] Excessive memory use
      - [0 - 3 pts] Wasteful memory usage(unnecessary copies, huge data structures)

4. CODE QUALITY(20 points):
-[5 pts] Clear, descriptive variable names(not x, y, temp, etc.)
  - [5 pts] Readable structure(proper formatting, logical flow)
    - [5 pts] Best practices(no magic numbers, proper edge case handling, no unnecessary complexity)
      - [5 pts] Comments where needed(complex logic explained, not obvious statements)

ANALYSIS STEPS:

STEP 1 - CORRECTNESS:
- Does it solve the problem as described?
  - Does it return the correct format(indices vs values, array vs number, etc.) ?
    - Test with the example inputs mentally - does it work ?
      - What edge cases might break it?

STEP 2 - COMPLEXITY ANALYSIS:
- Identify all loops and nested operations
  - Determine actual Big - O time complexity
    - Determine actual Big - O space complexity
      - Compare to optimal known solutions for this problem type

STEP 3 - CODE QUALITY:
- Are variable names meaningful ?
  - Is the code easy to follow ?
    - Any code smells(magic numbers, deeply nested logic, repetition) ?
      - Are comments helpful or redundant ?

        STEP 4 - CONSTRUCTIVE FEEDBACK:
- Start with what they did well
  - Explain any issues clearly with examples
  - Provide specific, actionable suggestions
    - Be educational, not just critical

OUTPUT FORMAT - Return VALID JSON(all strings must use \\n for newlines, no actual newlines):

  {
    "timeComplexity": "O(n)",
      "spaceComplexity": "O(n)",
        "score": 85,
          "feedback": "## Score Breakdown\\\\n\\\\n**Correctness (35/40)**\\\\n- Core algorithm works correctly\\\\n- Missing edge case: doesn't handle empty array (crashes)\\\\n\\\\n**Time Complexity (18/20)**\\\\n- Uses efficient hash map approach - O(n) time\\\\n- Single pass through array is optimal\\\\n\\\\n**Space Complexity (18/20)**\\\\n- Hash map storage is O(n) which is acceptable\\\\n- Could technically solve in O(1) space with sorting + two pointers, but that would make time O(n log n)\\\\n\\\\n**Code Quality (14/20)**\\\\n- Good variable names (complement, seen)\\\\n- Magic number: 0 used without explanation\\\\n- No validation of input\\\\n- Could benefit from a comment explaining the hash map strategy",
            "suggestions": [
              "Add input validation: check if nums is null or empty before processing to avoid runtime errors",
              "Extract the constant 0 into a named variable if it has special meaning, or add a comment",
              "Consider adding a brief comment explaining the hash map approach for future code reviewers",
              "The return statement could be more explicit about which index comes first"
            ]
  }

JSON FORMATTING RULES:
- Use \\\\n for line breaks in feedback(NOT actual newlines)
  - Escape all quotes inside strings with \\\\"
    - No control characters(tabs, actual newlines, etc.)
      - Score must be integer from 0 - 100
        - Suggestions array should have 3 - 5 specific, actionable items
          - Feedback should use markdown headers(##) and lists for readability

FEEDBACK STRUCTURE:
Use this markdown format(with \\\\n for newlines):
  - "## Score Breakdown\\\\n\\\\n" as header
    - "**Category (points/total)**\\\\n" for each category
      - Use bullet points for strengths / issues / notes
        - Keep explanations clear and concise
          - End with overall assessment

TONE: Professional, educational, and constructive.Praise good choices, explain issues clearly, and provide actionable improvements.

Generate the evaluation now: `,
  SYSTEM_DESIGN_ANALYSIS: `You are an expert System Design Interviewer evaluating a candidate's design.

PROBLEM: { problemTitle }

PROBLEM DESCRIPTION:
{ problemDescription }

CANDIDATE'S NOTES:
{ userNotes }

CANDIDATE'S DIAGRAM SUMMARY (Nodes & Edges):
{ diagramSummary }

YOUR TASK: Provide a comprehensive, fair, and educational evaluation of the system design.

CRITICAL SCORING RULES:
1. ** EMPTY / MINIMAL SUBMISSION:** If the notes are empty / minimal AND the diagram has few nodes(<5), the score MUST be between ** 0 - 30 **.Do NOT give high scores for empty submissions.
2. ** DIAGRAM ANALYSIS:** You have been provided with a ** VISUAL SNAPSHOT ** of the candidate's diagram. You MUST analyze this image.
  - ** Explicitly reference visual elements ** in your feedback(e.g., "I see you placed the Load Balancer between the Client and API Gateway", "The connection from Service A to Database B is missing").
   - ** Critique the layout:** Is it messy ? Are flows clear ?
  - If the diagram contradicts the notes, point it out.
3. ** SPECIFICITY:** Penalize vague descriptions. "Database" is bad; "PostgreSQL with Read Replicas" is good.

EVALUATION RUBRIC(100 points total):

1. SCALABILITY(25 points):
- Does the design handle growth in traffic / data ?
  - Are there bottlenecks ?
    - Is horizontal scaling possible ?

      2. RELIABILITY & AVAILABILITY(25 points):
- Is the system fault - tolerant ?
  - Are there single points of failure ?
    - Is data replication / backup considered ?

      3. COMPLETENESS & REQUIREMENTS(25 points):
- Does it meet all functional requirements ?
  - Are non - functional requirements addressed ?

    4. DESIGN CHOICES & TRADE - OFFS(25 points):
- Are the chosen technologies appropriate ?
  - Are trade - offs explained / justified ?

    OUTPUT FORMAT - Return VALID JSON(all strings must use \\n for newlines, no actual newlines):

      {
        "score": 85,
          "scalability": "High - Uses horizontal scaling for web servers and sharding for the database.",
            "reliability": "Medium - Single point of failure in the load balancer configuration.",
              "bottlenecks": "The primary database write throughput might become a bottleneck.",
                "completeness": "Covers most requirements but misses rate limiting.",
                  "feedback": "## Score Breakdown\\\\n\\\\n**Scalability (22/25)**\\\\n- Good use of caching...\\\\n\\\\n**Reliability (18/25)**\\\\n- Needs better failover...\\\\n\\\\n**Completeness (20/25)**\\\\n- Missed rate limiting...\\\\n\\\\n**Diagram Analysis**\\\\n- I noticed you grouped the microservices logically...\\\\n- The flow from the client to the CDN is clearly depicted...",
                    "suggestions": [
                      "Add a rate limiter to prevent abuse.",
                      "Consider using a managed load balancer for better availability.",
                      "Implement read replicas to offload read traffic."
                    ]
      }

JSON FORMATTING RULES:
- Use \\\\n for line breaks in feedback(NOT actual newlines)
  - Escape all quotes inside strings with \\\\"
    - No control characters(tabs, actual newlines, etc.)
      - Score must be integer from 0 - 100
        - Suggestions array should have 3 - 5 specific, actionable items

Generate the evaluation now: `,
};