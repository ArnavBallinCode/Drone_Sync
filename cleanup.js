#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function cleanupJsonFiles() {
    try {
        const paramsDir = path.join(__dirname, 'public', 'params');

        if (!fs.existsSync(paramsDir)) {
            console.log('Params directory does not exist');
            return;
        }

        const jsonFiles = glob.sync(path.join(paramsDir, '*.json'));

        jsonFiles.forEach(file => {
            try {
                fs.unlinkSync(file);
            } catch (err) {
                console.error(`Error deleting ${file}:`, err.message);
            }
        });

        console.log(`Cleaned up ${jsonFiles.length} JSON files from params directory`);
    } catch (error) {
        console.error('Error during cleanup:', error.message);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Cleaning up...');
    cleanupJsonFiles();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Cleaning up...');
    cleanupJsonFiles();
    process.exit(0);
});

// If called directly, clean up
if (require.main === module) {
    cleanupJsonFiles();
}

module.exports = { cleanupJsonFiles };
