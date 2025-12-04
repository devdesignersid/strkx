
import { Injectable } from '@nestjs/common';

@Injectable()
export class DriverGenerator {
    generate(className: string): string {
        return `
// --- START DRIVER ---
const results = [];
let instance;

try {
  // The first command is always the constructor
  const constructorCmd = commands[0];
  const constructorArgs = values[0];

  if (constructorCmd !== '${className}') {
    throw new Error(\`Expected constructor command '${className}', but got '\${constructorCmd}'\`);
  }

  instance = new ${className}(...constructorArgs);
  results.push(null); // Constructor returns null

  for (let i = 1; i < commands.length; i++) {
    const method = commands[i];
    const args = values[i];

    if (typeof instance[method] !== 'function') {
       throw new Error(\`Method '\${method}' not found on class '${className}'\`);
    }

    const result = instance[method](...args);
    results.push(result === undefined ? null : result);
  }
} catch (err) {
  // If an error occurs, push it to results or handle it?
  // For now, let's rethrow so the main execution loop catches it and marks the test case as failed.
  throw err;
}

// Assign to global result for the VM context to pick up
result = results;
// --- END DRIVER ---
`;
    }
}
