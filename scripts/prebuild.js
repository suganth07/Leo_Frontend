#!/usr/bin/env node

/**
 * Pre-build script to ensure all dependencies are resolved correctly
 * This script can help with module resolution issues on different platforms
 */

const fs = require('fs');
const path = require('path');

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function verifyModules() {
  const libPath = path.join(__dirname, '..', 'src', 'lib');
  const requiredModules = [
    'data-processor.ts',
    'optimized-api.ts',
    'image-utils.ts',
    'env-debug.ts',
    'config-manager.ts',
    'utils.ts'
  ];

  console.log('Verifying lib modules...');
  console.log('Looking in:', libPath);
  
  let allExist = true;
  for (const module of requiredModules) {
    const modulePath = path.join(libPath, module);
    if (checkFileExists(modulePath)) {
      console.log(`✓ ${module} exists`);
    } else {
      console.error(`✗ ${module} missing at ${modulePath}`);
      allExist = false;
    }
  }

  if (allExist) {
    console.log('All required modules found!');
  } else {
    console.error('Some modules are missing!');
    process.exit(1);
  }
}

// Verify TypeScript config
function verifyTsConfig() {
  const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
  if (checkFileExists(tsConfigPath)) {
    console.log('✓ tsconfig.json exists');
    
    try {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
      if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
        console.log('✓ Path aliases configured');
      } else {
        console.warn('⚠ Path aliases not found in tsconfig.json');
      }
    } catch (error) {
      console.error('✗ Error reading tsconfig.json:', error.message);
    }
  } else {
    console.error('✗ tsconfig.json missing');
    process.exit(1);
  }
}

console.log('Running pre-build verification...');
verifyModules();
verifyTsConfig();
console.log('Pre-build verification completed successfully!');
