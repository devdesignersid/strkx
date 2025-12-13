import { Injectable } from '@nestjs/common';
import { STRUCTURE_DEFINITIONS, GENERIC_HELPERS } from './definitions/structures';

@Injectable()
export class HydrationService {

    generateWrapper(
        userCode: string,
        inputTypes: string[],
        returnType: string | null
    ): string {
        // 1. Identify required structures (handling nested types like ListNode[])
        const requiredStructures = new Set<string>();

        const addStructure = (type: string) => {
            if (type.endsWith('[]')) {
                addStructure(type.slice(0, -2));
            } else if (STRUCTURE_DEFINITIONS[type]) {
                requiredStructures.add(type);
            }
        };

        // Check input types
        inputTypes.forEach(type => addStructure(type));

        // Check return type
        if (returnType) {
            addStructure(returnType);
        }

        // 2. Inject Definitions and Helpers
        let definitionsCode = '';
        let helpersCode = '';

        requiredStructures.forEach(structName => {
            const def = STRUCTURE_DEFINITIONS[structName];
            definitionsCode += def.definition + '\n';
            helpersCode += def.hydrationHelper + '\n' + def.dehydrationHelper + '\n';
        });

        // Inject Generic Helpers
        helpersCode += GENERIC_HELPERS.hydrate + '\n' + GENERIC_HELPERS.dehydrate + '\n';

        // 3. Generate Argument Hydration Logic
        const hydrationLogic = inputTypes.map((type, index) => {
            // Always try to hydrate, __hydrate handles primitives gracefully
            return `if (args[${index}] !== undefined) args[${index}] = __hydrate(args[${index}], '${type}');`;
        }).join('\n');

        // 4. Generate Result Dehydration Logic
        // For void return types (in-place modification), capture the modified first argument
        let dehydrationLogic = '';
        if (returnType === 'void' && inputTypes.length > 0) {
            // In-place modification - return the dehydrated first argument
            dehydrationLogic = `
            global.result = __dehydrate(args[0], '${inputTypes[0]}');
      `;
        } else if (returnType && returnType !== 'void') {
            dehydrationLogic = `
            global.result = __dehydrate(global.result, '${returnType}');
      `;
        }

        // 5. Find function name (heuristic)
        let functionName = 'solution';
        // Strip comments to avoid false positives
        const cleanCode = userCode.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');

        let match = cleanCode.match(/var\s+(\w+)\s*=/);
        if (!match) match = cleanCode.match(/function\s+(\w+)\s*\(/);
        if (!match) match = cleanCode.match(/const\s+(\w+)\s*=/);
        if (!match) match = cleanCode.match(/let\s+(\w+)\s*=/);
        if (match && match[1]) functionName = match[1];

        // 6. Construct Final Script
        return `
      ${definitionsCode}
      ${helpersCode}
      
      ${userCode}

      try {
        const functionName = '${functionName}';

        if (typeof eval(functionName) === 'function') {
            const args = global.args || [];
            
            try {
                ${hydrationLogic}
            } catch (hError) {
                console.error('Hydration failed:', hError);
                throw hError;
            }
            
            // Execute
            const fn = eval(functionName);
            global.result = fn(...args);
            
            // Dehydrate Result
            try {
                ${dehydrationLogic}
            } catch (dError) {
                console.error('Dehydration failed:', dError);
                throw dError;
            }
        } else {
            throw new Error('Function ' + functionName + ' not found');
        }
      } catch (e) {
        console.error('Error in wrapper:', e);
        throw e;
      }
    `;
    }
}
