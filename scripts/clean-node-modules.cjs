const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');
const removeNodeModules = (directory) => {
  fs.rmSync(path.join(directory, 'node_modules'), {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 100,
  });
};

removeNodeModules(rootDir);

if (fs.existsSync(packagesDir)) {
  for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removeNodeModules(path.join(packagesDir, entry.name));
    }
  }
}
