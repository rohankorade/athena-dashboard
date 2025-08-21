// server/sync.js
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const matter = require('gray-matter');
const Note = require('./models/Note');

// --- 1. CONFIGURATION ---
// IMPORTANT: Update this path to the specific folder you want to sync
const VAULT_SYNC_PATH = 'D:/UPSC/Leviathan/Database/13_Op_Ed_Log';
const MONGO_URI = 'mongodb://localhost:27017/upscDashboard';

// --- 2. ATHENA ID GENERATOR (JavaScript Version) ---
class AthenaIdGenerator {
    constructor() {
        this.lastTimestamp = BigInt(0);
        this.counter = 0;
    }

    generate() {
        const timestamp = process.hrtime.bigint();

        if (timestamp === this.lastTimestamp) {
            this.counter++;
        } else {
            this.lastTimestamp = timestamp;
            this.counter = 0;
        }

        const tsHex = this.lastTimestamp.toString(16).padStart(16, '0');
        const counterHex = this.counter.toString(16).padStart(4, '0');
        const randomHex = crypto.randomBytes(6).toString('hex');

        return `${tsHex}-${counterHex}-${randomHex}`;
    }
}
const idGenerator = new AthenaIdGenerator();


// --- 3. CORE LOGIC ---

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

// Main sync function
async function syncVault() {
    console.log('--- Starting Vault Sync ---');

    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        const allFiles = await findMarkdownFiles(VAULT_SYNC_PATH);
        console.log(`Found ${allFiles.length} markdown files to process.`);

        for (const filePath of allFiles) {
            const relativePath = path.relative(VAULT_SYNC_PATH, filePath);
            console.log(`Processing: ${relativePath}`);

            const fileContent = await fs.readFile(filePath, 'utf8');
            const parsedMatter = matter(fileContent);

            // Explicitly convert date string to a UTC Date object to avoid timezone issues.
            if (parsedMatter.data.date) {
                parsedMatter.data.date = new Date(parsedMatter.data.date + ' 00:00:00 UTC');
            }

            let athena_id = parsedMatter.data.athena_id;
            let title = '';

            // Smart Title Logic: Prefer H1, fallback to filename
            const content_trimmed = parsedMatter.content.trim();
            const h1_match = content_trimmed.match(/^#\s+(.*)/);
            if (h1_match && h1_match[1]) {
                title = h1_match[1];
            } else {
                title = path.basename(filePath, '.md');
            }

            // If no ID exists, generate one and write it back to the file
            if (!athena_id) {
                athena_id = idGenerator.generate();
                parsedMatter.data.athena_id = athena_id;

                const newContent = matter.stringify(parsedMatter.content, parsedMatter.data);
                await fs.writeFile(filePath, newContent, 'utf8');
                console.log(`  -> Added new athena_id: ${athena_id}`);
            }

            // Prepare the document for MongoDB
            const noteDocument = {
                _id: athena_id,
                title: title,
                filePath: relativePath,
                isRead: parsedMatter.data.isRead || false, // Set default if missing
                frontmatter: parsedMatter.data
            };

            // Update or insert (upsert) the note in the database
            await Note.findByIdAndUpdate(athena_id, noteDocument, { upsert: true, new: true });
        }

        console.log(`\n✅ Sync complete! Processed ${allFiles.length} files.`);

    } catch (error) {
        console.error('\n❌ An error occurred during sync:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

// Run the sync
syncVault();