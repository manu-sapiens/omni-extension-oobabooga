const esbuild = require('esbuild');
const fs = require('fs');

/*
const { commonjs } = require("@hyrious/esbuild-plugin-commonjs");


const buildOptions_plugin = {
  entryPoints: ['./extension.js'],
  bundle: true,
  outfile: '../server/extension.js',
  format: 'esm',
  platform: 'node',
  target: 'es2020',
  external: ['mercs_rete'], // Add other options as needed
  loader: {
    '.node': 'binary',
  },  
  metafile: true,
  plugins: [commonjs()],
};
*/
const ESM_REQUIRE_SHIM = `
await(async()=>{let{dirname:e}=await import("path"),{fileURLToPath:i}=await import("url");if(typeof globalThis.__filename>"u"&&(globalThis.__filename=i(import.meta.url)),typeof globalThis.__dirname>"u"&&(globalThis.__dirname=e(globalThis.__filename)),typeof globalThis.require>"u"){let{default:a}=await import("module");globalThis.require=a.createRequire(import.meta.url)}})();
`;

/** Tell esbuild to add the shim to emitted JS. */
const shimBanner = {
  "js": ESM_REQUIRE_SHIM
};

const buildOptions_fix = {
      format: "esm",
      target: "esnext",
      platform: "node",
      banner: shimBanner,
      bundle : true,
      entryPoints: ['./extension.js'],
      outfile: '../server/extension.js',
      external: ['mercs_rete'],
      loader: {
        '.node': 'binary',
      },  
      metafile: true,
    };

const buildOptions_good = {
  entryPoints: ['./extension.js'],
  bundle: true,
  outfile: '../server/extension.js',
  format: 'esm',
  platform: 'node',
  target: 'es2020',
  external: ['mercs_rete'], // Add other options as needed
  loader: {
    '.node': 'binary',
  },  
  metafile: true,
};



const result = esbuild.build(buildOptions_fix).then((result) => 
{
  console.log('\n--------------\nBuild completed successfully!\n');

  // Log some summary information
  const { inputs } = result.metafile;
  const inputCount = Object.keys(inputs).length;
  const totalInputBytes = Object.values(result.metafile.inputs).reduce((sum, input) => sum + input.bytes, 0);

  console.log(`Total input files: ${inputCount}`);
  console.log(`Total input bytes: ${totalInputBytes.toLocaleString()}`);

  // Log some summary information about the outputs
  const { outputs } = result.metafile;
  const outputCount = Object.keys(outputs).length;
  const totalOutputBytes = Object.values(result.metafile.outputs).reduce((sum, output) => sum + output.bytes, 0);

  console.log(`Total output files: ${outputCount}`);
  console.log(`Total output bytes: ${totalOutputBytes.toLocaleString()}`);

  // Additional analysis or logging as needed

}).catch(() => {
  console.error('Build failed');
});