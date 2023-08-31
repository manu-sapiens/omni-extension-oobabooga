const { exec } = require('child_process');
const fs = require('fs');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

const dependencies = packageJson.dependencies || {};
const devDependencies = packageJson.devDependencies || {};

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      console.log(stdout);
      console.error(stderr);
      resolve();
    });
  });
}

(async () => {
  for (const [dep, version] of Object.entries(dependencies)) {
    console.log(`Updating ${dep}...`);
    await runCommand(`yarn remove ${dep}`);
    await runCommand(`yarn add ${dep}@${version}`);
  }

  for (const [dep, version] of Object.entries(devDependencies)) {
    console.log(`Updating ${dep} (dev dependency)...`);
    await runCommand(`yarn remove ${dep}`);
    await runCommand(`yarn add ${dep}@${version} --dev`);
  }

  await runCommand('yarn');
  await runCommand('yarn build');
})();
