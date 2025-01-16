import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import 'dotenv/config';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;
const currentCharacter = process.env.CHARACTER || 'terrence';

// Serve static files from the static directory
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Helper function to load character config
async function loadCharacterConfig(character) {
    const configPath = path.join(__dirname, 'output', character, 'config.json');
    console.log(`[loadCharacterConfig] Reading from ${configPath}`);
    try {
        const configData = await fs.readFile(configPath, 'utf8');
        console.log('Config data for', character, ':', configData.substring(0, 100) + '...');
        const config = JSON.parse(configData);
        const characterInfo = {
            id: character,
            name: config.name || character,
            birthDate: config.birthDate || null,
            type: config.type || 'unknown'
        };
        console.log(`[loadCharacterConfig] Processed ${character}:`, characterInfo);
        return characterInfo;
    } catch (error) {
        console.error(`[loadCharacterConfig] Error loading ${character}:`, error);
        return null;
    }
}

// Helper function to load available characters
async function loadAvailableCharacters() {
    const outputDir = path.join(__dirname, 'output');
    console.log(`[loadAvailableCharacters] Scanning ${outputDir}`);
    try {
        const dirs = await fs.readdir(outputDir, { withFileTypes: true });
        const dirNames = dirs.filter(d => d.isDirectory()).map(d => d.name);
        console.log(`[loadAvailableCharacters] Found directories:`, dirNames);
        
        const characters = [];
        for (const dirName of dirNames) {
            const config = await loadCharacterConfig(dirName);
            if (config) {
                characters.push(config);
            }
        }
        
        console.log(`[loadAvailableCharacters] Returning ${characters.length} characters:`, 
            characters.map(c => `${c.id}(${c.name})`));
        return characters;
    } catch (error) {
        console.error('[loadAvailableCharacters] Error:', error);
        return [];
    }
}

// API endpoints
app.get('/api/characters', async (req, res) => {
    console.log('[/api/characters] Request received');
    try {
        const characters = await loadAvailableCharacters();
        console.log('[/api/characters] Sending response:', {
            count: characters.length,
            characters: characters.map(c => ({
                id: c.id,
                name: c.name,
                birthDate: c.birthDate,
                type: c.type
            }))
        });
        res.json(characters);
    } catch (error) {
        console.error('[/api/characters] Error:', error);
        res.status(500).json({ error: 'Failed to load characters' });
    }
});

app.get('/api/timeline/:character?', async (req, res) => {
    const character = req.params.character || currentCharacter;
    console.log('Loading timeline for character:', character);
    try {
        const graphPath = path.join(__dirname, 'output', character, 'timeline_graph.json');
        const graphData = await fs.readFile(graphPath, 'utf8');
        res.json(JSON.parse(graphData));
    } catch (error) {
        console.error('Error reading timeline graph:', error);
        res.status(500).json({ error: 'Failed to load timeline graph' });
    }
});

app.get('/memory/:character/:memoryId', async (req, res) => {
    const character = req.params.character;
    try {
        const graphPath = path.join(__dirname, 'output', character, 'timeline_graph.json');
        const timelineData = JSON.parse(await fs.readFile(graphPath, 'utf8'));
        const characterConfig = await loadCharacterConfig(character);

        const memory = timelineData.nodes.find(node => node.key === req.params.memoryId);

        if (memory) {
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>${characterConfig.name} - ${memory.attributes.name}</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 10px;
                            font-family: 'Consolas', 'Monaco', monospace;
                            font-size: 12px;
                            line-height: 1.4;
                            background: #000;
                            color: #fff;
                        }
                        .memory-meta {
                            margin-top: 10px;
                            opacity: 0.7;
                        }
                    </style>
                </head>
                <body>
                    <div>
                        <h3 class="memory-title">${memory.attributes.name}</h3>
                        <div class="memory-date">
                            ${new Date(memory.attributes.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                        <div class="memory-description">${memory.attributes.description}</div>
                        <div class="memory-meta">
                            Timeline: ${memory.attributes.timeline || 'main'}
                            ${memory.attributes.type ? ` • Type: ${memory.attributes.type}` : ''}
                        </div>
                    </div>
                </body>
                </html>
            `;
            res.send(html);
        } else {
            res.status(404).send('<html><body>Memory not found</body></html>');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('<html><body>Internal server error</body></html>');
    }
});

// Root endpoint can come after static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Current character: ${currentCharacter}`);
});