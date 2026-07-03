import re

with open('sim_worker.js', 'r') as f:
    content = f.read()

# Replace the complex decompression block with simple original code
old_block = """// Load WASM: try compressed version first (5.8MB vs 40MB), fallback to original
(async function loadWasm() {
    try {
        if (typeof DecompressionStream !== 'undefined') {
            const gzResp = await fetch('lib.wasm.gz');
            if (gzResp.ok) {
                const reader = gzResp.body.pipeThrough(new DecompressionStream('gzip')).getReader();
                const chunks = [];
                let totalSize = 0;
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    totalSize += value.length;
                }
                const merged = new Uint8Array(totalSize);
                let offset = 0;
                for (const chunk of chunks) {
                    merged.set(chunk, offset);
                    offset += chunk.length;
                }
                const result = await WebAssembly.instantiate(merged.buffer, go.importObject);
                mod = result.module;
                inst = result.instance;
                await go.run(inst);
                return;
            }
        }
    } catch(e) {
        console.warn('Compressed WASM load failed, falling back to original:', e);
    }
    // Fallback: original 40MB WASM
    WebAssembly.instantiateStreaming(fetch("lib.wasm"), go.importObject).then(
        async result => {
            mod = result.module;
            inst = result.instance;
            await go.run(inst);
        }
    );
})();"""

new_block = """WebAssembly.instantiateStreaming(fetch("lib.wasm"), go.importObject).then(
\tasync result => {
\t\tmod = result.module;
\t\tinst = result.instance;
\t\tawait go.run(inst);
\t}
);"""

content = content.replace(old_block, new_block)

with open('sim_worker.js', 'w') as f:
    f.write(content)

print("Done")
