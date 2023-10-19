
//@ts-check
// -----------------------------
const externals= ['omni-sockets', 'omni-client-services', 'gpt-tokenizer', 'omni-shared', '../../../src/utils/omni-utils.js'];
const build_fix = true;
// -----------------------------
// -----------------------------
// -----------------------------
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path')

const ESM_REQUIRE_SHIM = `
await(async()=>{let{dirname:e}=await import("path"),{fileURLToPath:i}=await import("url");if(typeof globalThis.__filename>"u"&&(globalThis.__filename=i(import.meta.url)),typeof globalThis.__dirname>"u"&&(globalThis.__dirname=e(globalThis.__filename)),typeof globalThis.require>"u"){let{default:a}=await import("module");globalThis.require=a.createRequire(import.meta.url)}})();
`;

/** Tell esbuild to add the shim to emitted JS. */
const shimBanner = {
  "js": ESM_REQUIRE_SHIM
};

const entryPoints = ['./extension.js'];
const format= "esm";
const platform= "node";
const outfile= '../server/extension.js';
const loader= {  '.node': 'binary',};
const metafile= true;
const bundle = true;

const buildOptions = {
  entryPoints,
  format,
  platform,
  outfile,
  external: externals,
  loader,
  metafile,
  bundle
};

const buildOptions_fix_require = {...buildOptions, target: 'esnext', banner: shimBanner};
const buildOptions_nofix = {...buildOptions, target: 'es2020'};

if (build_fix) build(buildOptions_fix_require); else build(buildOptions_nofix);

async function build(build_option) {

  const result = await esbuild.build(build_option);

  // Log some summary information
  const { inputs } = result.metafile;
  const inputCount = Object.keys(inputs).length;
  //@ts-ignore
  const totalInputBytes = Object.values(result.metafile.inputs).reduce((sum, input) => sum + input.bytes, 0);

  console.log(`Total input files: ${inputCount}`);
  console.log(`Total input bytes: ${totalInputBytes.toLocaleString()}`);

  // Log some summary information about the outputs
  const { outputs } = result.metafile;
  const outputCount = Object.keys(outputs).length;
  //@ts-ignore
  const totalOutputBytes = Object.values(result.metafile.outputs).reduce((sum, output) => sum + output.bytes, 0);

  console.log(`Total output files: ${outputCount}`);
  console.log(`Total output bytes: ${totalOutputBytes.toLocaleString()}`);

  if (result.metafile) {
    console.log("Saving metadata to ./metafile.json");
    await fs.promises.writeFile('./metafile.json', JSON.stringify(result.metafile));
  }
}