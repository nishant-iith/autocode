#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AutoCode...\n');

// Create necessary directories
const directories = [
  'server/workspaces',
  'server/logs'
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Copy environment file if it doesn't exist
const envPath = path.join(__dirname, 'server', '.env');
const envExamplePath = path.join(__dirname, 'server', '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env file from template');
}

console.log('\n🎉 AutoCode setup complete!');
console.log('\nNext steps:');
console.log('1. Run "npm run install:all" to install dependencies');
console.log('2. Run "npm run dev" to start the development server');
console.log('3. Open http://localhost:3000 in your browser');
console.log('\nHappy coding! 🎯');