#!/usr/bin/env node
// Universal launcher script for the Reconciliation app
// This script detects the OS and runs the appropriate command

const { exec, spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Reconciliation App...');
console.log(`📱 Platform: ${os.platform()} ${os.arch()}`);

// Check if Node.js is available
function checkNode() {
    return new Promise((resolve, reject) => {
        exec('node --version', (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Node.js is not installed. Please install Node.js first.');
                reject(error);
            } else {
                console.log(`✅ Node.js version: ${stdout.trim()}`);
                resolve(stdout.trim());
            }
        });
    });
}

// Check if npm is available
function checkNpm() {
    return new Promise((resolve, reject) => {
        exec('npm --version', (error, stdout, stderr) => {
            if (error) {
                console.error('❌ npm is not available. Please check your Node.js installation.');
                reject(error);
            } else {
                console.log(`✅ npm version: ${stdout.trim()}`);
                resolve(stdout.trim());
            }
        });
    });
}

// Install dependencies if needed
function installDependencies() {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync('node_modules')) {
            console.log('📦 Installing dependencies...');
            const install = spawn('npm', ['install'], { 
                stdio: 'inherit',
                shell: true 
            });
            
            install.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Dependencies installed successfully');
                    resolve();
                } else {
                    console.error('❌ Failed to install dependencies');
                    reject(new Error(`npm install failed with code ${code}`));
                }
            });
        } else {
            console.log('✅ Dependencies already installed');
            resolve();
        }
    });
}

// Start the development server
function startDevServer() {
    console.log('🌐 Starting development server on http://localhost:1000...');
    console.log('📝 Press Ctrl+C to stop the server');
    
    const dev = spawn('npm', ['run', 'dev'], { 
        stdio: 'inherit',
        shell: true 
    });
    
    dev.on('close', (code) => {
        console.log(`\n👋 Development server stopped with code ${code}`);
    });
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping development server...');
        dev.kill('SIGINT');
        process.exit(0);
    });
}

// Main execution
async function main() {
    try {
        await checkNode();
        await checkNpm();
        await installDependencies();
        startDevServer();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
