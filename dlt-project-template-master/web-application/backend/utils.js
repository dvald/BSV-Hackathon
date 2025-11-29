#!/usr/bin/env node

/**
 * Utility script for BSV Verifiable Credentials System
 * Helps generate keys, DIDs, and test credentials
 */

const { PrivateKey } = require('@bsv/sdk');
const crypto = require('crypto');

// Colors for console output
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
    log('='.repeat(60), 'cyan');
    log(`  ${message}`, 'bright');
    log('='.repeat(60), 'cyan');
    console.log('');
}

function section(message) {
    console.log('');
    log(`→ ${message}`, 'blue');
    log('-'.repeat(60), 'blue');
}

// Command handlers
const commands = {
    // Generate a new private key
    'generate-key': () => {
        header('Generate New Private Key');
        
        const privateKey = PrivateKey.fromRandom();
        const publicKey = privateKey.toPublicKey();
        
        section('Private Key (HEX)');
        log(privateKey.toHex(), 'green');
        
        section('Public Key (HEX)');
        log(publicKey.toString(), 'yellow');
        
        section('DID (did:bsv:)');
        log(`did:bsv:${publicKey.toString()}`, 'cyan');
        
        console.log('');
        log('⚠️  IMPORTANT: Keep your private key secure!', 'red');
        log('   Never share it or commit it to version control.', 'red');
        console.log('');
    },

    // Generate a wallet seed
    'generate-seed': () => {
        header('Generate Wallet Seed');
        
        const seed = crypto.randomBytes(32).toString('hex');
        
        section('Wallet Seed (for BSV_WALLET_SEED in .env)');
        log(seed, 'green');
        
        console.log('');
        log('⚠️  IMPORTANT: Keep this seed extremely secure!', 'red');
        log('   It controls access to your BSV wallet.', 'red');
        console.log('');
    },

    // Generate session/JWT secrets
    'generate-secrets': () => {
        header('Generate Security Secrets');
        
        const sessionSecret = crypto.randomBytes(32).toString('hex');
        const jwtSecret = crypto.randomBytes(32).toString('hex');
        
        section('Session Secret (for SESSION_SECRET in .env)');
        log(sessionSecret, 'green');
        
        section('JWT Secret (for JWT_SECRET in .env)');
        log(jwtSecret, 'yellow');
        
        console.log('');
    },

    // Generate a complete test user
    'generate-user': () => {
        header('Generate Test User');
        
        const privateKey = PrivateKey.fromRandom();
        const publicKey = privateKey.toPublicKey();
        const did = `did:bsv:${publicKey.toString()}`;
        
        section('User Profile');
        console.log(`  Name: Test User ${crypto.randomBytes(2).toString('hex')}`);
        console.log(`  DID:  ${did}`);
        
        section('Private Key');
        log(privateKey.toHex(), 'green');
        
        section('Credential Request Example');
        const requestExample = {
            userDID: did,
            credentialType: 'DriversLicense',
            requestData: {
                name: 'John Doe',
                dateOfBirth: '1990-01-01',
                licenseNumber: `DL${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
                class: 'C',
                issueDate: '2020-01-01',
                expiryDate: '2025-01-01'
            }
        };
        log(JSON.stringify(requestExample, null, 2), 'cyan');
        
        console.log('');
    },

    // Generate a test issuer
    'generate-issuer': () => {
        header('Generate Test Issuer');
        
        const privateKey = PrivateKey.fromRandom();
        const publicKey = privateKey.toPublicKey();
        const did = `did:bsv:${publicKey.toString()}`;
        
        section('Issuer Profile');
        console.log(`  Name: Test Issuer Org`);
        console.log(`  DID:  ${did}`);
        
        section('Private Key (for approving credentials)');
        log(privateKey.toHex(), 'green');
        
        section('Approval Request Example');
        const approvalExample = {
            requestId: 'req_example_123',
            issuerPrivateKey: privateKey.toHex(),
            expirationDate: '2025-12-31T23:59:59Z'
        };
        log(JSON.stringify(approvalExample, null, 2), 'cyan');
        
        console.log('');
        log('⚠️  Store the private key securely to approve credentials!', 'yellow');
        console.log('');
    },

    // Generate sample credential types
    'sample-types': () => {
        header('Sample Credential Types');
        
        const types = [
            {
                name: 'DriversLicense',
                description: "Driver's license credential",
                fields: {
                    name: 'Full name of license holder',
                    dateOfBirth: 'Date of birth (YYYY-MM-DD)',
                    licenseNumber: 'License number',
                    class: 'License class (A, B, C, etc.)',
                    issueDate: 'Issue date (YYYY-MM-DD)',
                    expiryDate: 'Expiry date (YYYY-MM-DD)'
                }
            },
            {
                name: 'MedicalCertificate',
                description: 'Medical certificate credential',
                fields: {
                    patientName: 'Patient name',
                    diagnosis: 'Diagnosis or health status',
                    physician: 'Physician name',
                    hospitalName: 'Hospital or clinic name',
                    date: 'Certificate date (YYYY-MM-DD)',
                    validUntil: 'Valid until date (YYYY-MM-DD)'
                }
            },
            {
                name: 'EducationDegree',
                description: 'Education degree credential',
                fields: {
                    studentName: 'Student name',
                    degree: 'Degree name (Bachelor, Master, PhD, etc.)',
                    major: 'Major or field of study',
                    university: 'University name',
                    graduationDate: 'Graduation date (YYYY-MM-DD)',
                    gpa: 'Grade point average'
                }
            },
            {
                name: 'EmploymentVerification',
                description: 'Employment verification credential',
                fields: {
                    employeeName: 'Employee name',
                    position: 'Job position/title',
                    company: 'Company name',
                    startDate: 'Employment start date (YYYY-MM-DD)',
                    endDate: 'Employment end date (optional)',
                    status: 'Employment status (Active, Terminated, etc.)'
                }
            }
        ];
        
        types.forEach((type, index) => {
            section(`${index + 1}. ${type.name}`);
            log(type.description, 'yellow');
            console.log('');
            console.log('Fields:');
            Object.entries(type.fields).forEach(([key, desc]) => {
                console.log(`  • ${key}: ${desc}`);
            });
        });
        
        console.log('');
        log('You can create any custom credential type with any fields!', 'cyan');
        console.log('');
    },

    // Show help
    'help': () => {
        header('BSV Verifiable Credentials - Utility Tool');
        
        console.log('Available commands:');
        console.log('');
        
        const commandsList = [
            { cmd: 'generate-key', desc: 'Generate a new private key and DID' },
            { cmd: 'generate-seed', desc: 'Generate a wallet seed for BSV' },
            { cmd: 'generate-secrets', desc: 'Generate session and JWT secrets' },
            { cmd: 'generate-user', desc: 'Generate a complete test user profile' },
            { cmd: 'generate-issuer', desc: 'Generate a test issuer profile' },
            { cmd: 'sample-types', desc: 'Show sample credential types' },
            { cmd: 'help', desc: 'Show this help message' }
        ];
        
        const maxCmdLength = Math.max(...commandsList.map(c => c.cmd.length));
        
        commandsList.forEach(({ cmd, desc }) => {
            const padding = ' '.repeat(maxCmdLength - cmd.length + 2);
            log(`  node utils.js ${cmd}${padding}`, 'cyan');
            console.log(`  ${padding}→ ${desc}`);
            console.log('');
        });
        
        log('Examples:', 'yellow');
        console.log('  node utils.js generate-key');
        console.log('  node utils.js generate-user');
        console.log('');
    }
};

// Main
const command = process.argv[2] || 'help';

if (commands[command]) {
    commands[command]();
} else {
    log(`❌ Unknown command: ${command}`, 'red');
    console.log('');
    log('Run "node utils.js help" to see available commands.', 'yellow');
    console.log('');
    process.exit(1);
}
