import ivm from 'isolated-vm';
import { parentPort, workerData } from 'worker_threads';

const { code, context, timeout, memoryLimitMb } = workerData;

async function run() {
    const isolate = new ivm.Isolate({ memoryLimit: memoryLimitMb || 128 });
    const ivmContext = isolate.createContextSync();
    const jail = ivmContext.global;

    // Setup console.log capture early
    const logs: string[] = [];
    jail.setSync('log', new ivm.Reference((...args: any[]) => {
        logs.push(args.map(a => String(a)).join(' '));
    }));

    // Set up the global object
    jail.setSync('global', jail.derefInto());

    // Inject context variables
    if (context) {
        for (const [key, value] of Object.entries(context)) {
            if (typeof value === 'function') {
                // Functions need to be wrapped or ignored if not safe
            } else {
                try {
                    // Special handling for args: pass as string and parse inside
                    if (key === 'args') {
                        let jsonStr;
                        try {
                            jsonStr = JSON.stringify(value);
                        } catch (e) {
                            logs.push(`[Worker Internal] Failed to stringify args: ${e}`);
                            throw e;
                        }

                        try {
                            jail.setSync('__args_str', jsonStr);
                            ivmContext.evalSync(`
                                try {
                                    global.args = JSON.parse(global.__args_str); 
                                    delete global.__args_str;
                                } catch(e) {
                                    log('Error parsing args inside VM: ' + e.message);
                                }
                            `);
                        } catch (innerErr) {
                            logs.push(`[Worker Internal] Inner injection error: ${innerErr}`);
                        }
                    }
                    // For other arrays/objects, we need to be careful with references
                    else if (typeof value === 'object' && value !== null) {
                        jail.setSync(key, new ivm.ExternalCopy(value).copyInto());
                    } else {
                        jail.setSync(key, value);
                    }
                } catch (e) {
                    logs.push(`[Worker Internal] Failed to inject ${key}: ${e}`);
                }
            }
        }
    }

    // Redirect console methods to our log function
    // We compile a setup script to do this inside the isolate
    // IMPORTANT: We must stringify values INSIDE the VM before passing to host
    // because isolated-vm cannot transfer non-primitive values
    const setupScript = isolate.compileScriptSync(`
    const __safeStringify = (val) => {
        if (val === undefined) return 'undefined';
        if (val === null) return 'null';
        if (typeof val === 'string') return val;
        if (typeof val === 'number' || typeof val === 'boolean') return String(val);
        try {
            return JSON.stringify(val, null, 2);
        } catch (e) {
            return '[Circular or Non-Serializable Object]';
        }
    };
    const console = {
        log: (...args) => log.apply(undefined, args.map(__safeStringify)),
        error: (...args) => log.apply(undefined, ['[ERROR]', ...args.map(__safeStringify)]),
        warn: (...args) => log.apply(undefined, ['[WARN]', ...args.map(__safeStringify)]),
        info: (...args) => log.apply(undefined, ['[INFO]', ...args.map(__safeStringify)]),
    };
  `);
    setupScript.runSync(ivmContext);

    try {
        const script = isolate.compileScriptSync(code);
        const result = await script.run(ivmContext, { timeout: timeout || 1000 });

        // Try to get the 'result' variable if the script didn't return anything
        let finalResult = result;

        if (finalResult === undefined) {
            try {
                const resultRef = ivmContext.global.getSync('result');
                if (resultRef !== undefined) {
                    // If it's a reference, try to copy it out
                    if (typeof resultRef === 'object' && resultRef !== null) {
                        try {
                            // Try direct copy first (works for primitives and simple objects)
                            finalResult = await resultRef.copy();
                        } catch (e) {
                            // Fallback to JSON serialization inside context
                            const json = ivmContext.evalSync('JSON.stringify(global.result)');
                            if (json) finalResult = JSON.parse(json);
                        }
                    } else {
                        finalResult = resultRef;
                    }
                }
            } catch (e) {
                // Ignore if result is not defined
            }
        }

        parentPort?.postMessage({ success: true, result: finalResult, logs });
    } catch (error: any) {
        // Format error with sanitized stack trace
        const errorMessage = error.message || 'Unknown error';
        const stack = error.stack
            ? error.stack.split('\n').slice(0, 5).join('\n').replace(/at\s+.*?(\(|$)/g, 'at [sandbox] ')
            : '';
        logs.push(`[ERROR] ${errorMessage}`);
        if (stack && stack.trim()) logs.push(stack);
        parentPort?.postMessage({ success: false, error: errorMessage, logs });
    } finally {
        isolate.dispose();
    }
}

run();
