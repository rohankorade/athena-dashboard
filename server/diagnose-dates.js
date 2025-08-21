// server/diagnose-dates.js

const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');

// --- CONFIGURATION ---
// IMPORTANT: Update this path to the specific folder you want to check
const VAULT_SYNC_PATH = 'D:/UPSC/Leviathan/Database/13_Op_Ed_Log';

// Finds all .md files recursively in a directory
async function findMarkdownFiles(dir) {
    let files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            files = files.concat(await findMarkdownFiles(fullPath));
        } else if (item.isFile() && item.name.endsWith('.md')) {
            files.push(fullPath);
        }
    }
    return files;
}

// Main diagnostic function
async function diagnoseDates() {
    console.log('--- Starting Date Diagnosis ---');
    let problemFiles = 0;

    try {
        const allFiles = await findMarkdownFiles(VAULT_SYNC_PATH);
        console.log(`Scanning ${allFiles.length} markdown files...`);

        for (const filePath of allFiles) {
            const fileContent = await fs.readFile(filePath, 'utf8');
            const parsedMatter = matter(fileContent);

            const dateValue = parsedMatter.data.date;

            // Check if the date exists and if it's a valid date object
            if (!dateValue || isNaN(new Date(dateValue).getTime())) {
                const relativePath = path.relative(VAULT_SYNC_PATH, filePath);
                console.log(`\n[INVALID DATE] in file: ${relativePath}`);
                console.log(`  -> Found value: "${dateValue}"`);
                problemFiles++;
            }
        }

        console.log('\n--- Diagnosis Complete ---');
        if (problemFiles > 0) {
            console.log(`Found ${problemFiles} file(s) with invalid dates. Please correct them.`);
        } else {
            console.log('✅ All files have valid dates!');
        }

    } catch (error) {
        console.error('\n❌ An error occurred during diagnosis:', error);
    }
}

diagnoseDates();