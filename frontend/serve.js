const { execSync } = require('child_process');
const path = require('path');
const distPath = path.join(__dirname, 'dist');
process.argv = ['node', 'serve.js', '-s', distPath, '-l', '5173'];
require('serve/build/main.js');
