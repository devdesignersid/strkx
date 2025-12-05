const ivm = require('isolated-vm');

async function run() {
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    const context = isolate.createContextSync();
    const jail = context.global;
    jail.setSync('global', jail.derefInto());

    // Setup console.log capture
    jail.setSync('log', new ivm.Reference((...args) => {
        console.log('IVM Log:', ...args);
    }));

    const setupScript = isolate.compileScriptSync(`
    const console = {
        log: (...args) => log.apply(undefined, args),
    };
  `);
    setupScript.runSync(context);

    // Mock input args
    const args = [[2, 7, 11, 15], 9];
    jail.setSync('args', new ivm.ExternalCopy(args).copyInto());

    const userCode = `
function solution(nums, target) {
  return [0, 1];
}
`;

    const wrapper = `
    var result;
    ${userCode}
    
    try {
        if (typeof solution === 'function') {
            global.result = solution(...args);
            console.log('Calculated result:', JSON.stringify(global.result));
        }
    } catch(e) { throw e; }
    
    global.result;
    `;

    try {
        const script = isolate.compileScriptSync(wrapper);
        const scriptResult = await script.run(context);
        console.log('Script return value:', scriptResult);

        try {
            const globalResultRef = context.global.getSync('result');
            console.log('Global result ref:', globalResultRef);
            if (globalResultRef) {
                console.log('Global result value:', await globalResultRef.copy());
            }
        } catch (e) {
            console.log('Failed to get global result:', e.message);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
