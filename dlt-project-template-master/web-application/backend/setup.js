#!/usr/bin/env node

/**
 * Quick Setup Script for BSV Verifiable Credentials
 * Automates initial configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
    console.log('');
    log('='.repeat(70), 'cyan');
    log(`  ${message}`, 'bright');
    log('='.repeat(70), 'cyan');
    console.log('');
}

function section(message) {
    console.log('');
    log(`→ ${message}`, 'blue');
}

function success(message) {
    log(`✓ ${message}`, 'green');
}

function warning(message) {
    log(`⚠ ${message}`, 'yellow');
}

function error(message) {
    log(`✗ ${message}`, 'red');
}

function step(number, total, message) {
    log(`[${number}/${total}] ${message}`, 'cyan');
}

header('BSV Verifiable Credentials - Quick Setup');

const totalSteps = 6;
let currentStep = 0;

try {
    // Step 1: Check if .env exists
    currentStep++;
    step(currentStep, totalSteps, 'Checking configuration files...');
    
    const envPath = path.join(__dirname, '.env');
    const envExamplePath = path.join(__dirname, '.env.example');
    
    if (!fs.existsSync(envPath)) {
        if (fs.existsSync(envExamplePath)) {
            log('  Creating .env from .env.example...', 'yellow');
            
            let envContent = fs.readFileSync(envExamplePath, 'utf8');
            
            // Generate random secrets
            const walletSeed = crypto.randomBytes(32).toString('hex');
            const sessionSecret = crypto.randomBytes(32).toString('hex');
            const jwtSecret = crypto.randomBytes(32).toString('hex');
            
            // Replace placeholders
            envContent = envContent
                .replace('your-secure-seed-here-replace-me', walletSeed)
                .replace('your-session-secret-replace-me', sessionSecret)
                .replace('your-jwt-secret-replace-me', jwtSecret);
            
            fs.writeFileSync(envPath, envContent);
            success('Created .env file with generated secrets');
            warning('Review and update .env with your specific configuration');
        } else {
            warning('.env.example not found, creating basic .env');
            
            const basicEnv = `
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bsv-credentials
BSV_NETWORK=testnet
BSV_WALLET_SEED=${crypto.randomBytes(32).toString('hex')}
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}
`;
            fs.writeFileSync(envPath, basicEnv.trim());
            success('Created basic .env file');
        }
    } else {
        success('.env file already exists');
    }
    
    // Step 2: Check Node.js version
    currentStep++;
    step(currentStep, totalSteps, 'Checking Node.js version...');
    
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (majorVersion >= 16) {
        success(`Node.js ${nodeVersion} - OK`);
    } else {
        error(`Node.js ${nodeVersion} - Version 16 or higher required`);
        process.exit(1);
    }
    
    // Step 3: Install dependencies
    currentStep++;
    step(currentStep, totalSteps, 'Checking dependencies...');
    
    const packageJsonPath = path.join(__dirname, 'package.json');
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    
    if (fs.existsSync(packageJsonPath)) {
        if (!fs.existsSync(nodeModulesPath)) {
            log('  Installing dependencies...', 'yellow');
            try {
                execSync('npm install', { 
                    cwd: __dirname, 
                    stdio: 'inherit' 
                });
                success('Dependencies installed');
            } catch (err) {
                error('Failed to install dependencies');
                warning('Run "npm install" manually');
            }
        } else {
            success('Dependencies already installed');
        }
    } else {
        warning('package.json not found');
    }
    
    // Step 4: Check MongoDB
    currentStep++;
    step(currentStep, totalSteps, 'Checking MongoDB...');
    
    try {
        // Try to connect to MongoDB
        const { execSync: execSyncSilent } = require('child_process');
        const mongoCheck = execSyncSilent('mongosh --version', { 
            stdio: 'pipe' 
        }).toString();
        success('MongoDB client detected');
        warning('Make sure MongoDB server is running: systemctl start mongodb');
    } catch (err) {
        warning('MongoDB client not detected');
        log('  Install MongoDB or use a cloud instance (MongoDB Atlas)', 'yellow');
    }
    
    // Step 5: Create required directories
    currentStep++;
    step(currentStep, totalSteps, 'Creating directories...');
    
    const dirs = [
        path.join(__dirname, 'public'),
        path.join(__dirname, 'logs'),
        path.join(__dirname, 'uploads')
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            success(`Created ${path.basename(dir)}/ directory`);
        }
    });
    
    // Step 6: Summary
    currentStep++;
    step(currentStep, totalSteps, 'Setup complete!');
    
    console.log('');
    header('Next Steps');
    
    console.log('1. Review and update configuration:');
    log('   nano .env', 'cyan');
    console.log('');
    
    console.log('2. Start MongoDB (if not running):');
    log('   sudo systemctl start mongodb', 'cyan');
    log('   # Or use MongoDB Atlas for cloud hosting', 'yellow');
    console.log('');
    
    console.log('3. Build the project:');
    log('   npm run build', 'cyan');
    console.log('');
    
    console.log('4. Start the development server:');
    log('   npm run dev', 'cyan');
    console.log('');
    
    console.log('5. Open the demo in your browser:');
    log('   http://localhost:3000/credentials-demo.html', 'cyan');
    console.log('');
    
    header('Useful Utilities');
    
    console.log('Generate test users and issuers:');
    log('   node utils.js generate-user', 'cyan');
    log('   node utils.js generate-issuer', 'cyan');
    console.log('');
    
    console.log('View sample credential types:');
    log('   node utils.js sample-types', 'cyan');
    console.log('');
    
    console.log('Run tests:');
    log('   npm test', 'cyan');
    console.log('');
    
    header('Documentation');
    
    console.log('• Quick Start Guide: CREDENTIALS_QUICKSTART.md');
    console.log('• System Documentation: CREDENTIALS_SYSTEM_README.md');
    console.log('• API Documentation: http://localhost:3000/api-docs (when running)');
    console.log('');
    
    log('Setup completed successfully! 🚀', 'green');
    console.log('');
    
} catch (err) {
    console.error('');
    error('Setup failed with error:');
    console.error(err);
    process.exit(1);
}
