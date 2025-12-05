const ivm = require('isolated-vm');
try {
    const isolate = new ivm.Isolate({ memoryLimit: 8 });
    const context = isolate.createContextSync();
    const jail = context.global;
    jail.setSync('global', jail.derefInto());
    console.log('isolated-vm is working correctly');
} catch (e) {
    console.error('isolated-vm failed:', e);
}
