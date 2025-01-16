#!/usr/bin/env node

import { Command } from 'commander';
import OpenAI from 'openai';
import path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import graphology from 'graphology';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Select Model
const MODEL = process.env.MODEL || 'gpt-4o-mini-2024-07-18';

// Initialize commander
const program = new Command();

const REQUIRED_CONFIG = {
  name: '',
  basePrompt: '',
  timelineCutoff: new Date().toISOString().split('T')[0],
  birthDate: null
};

const OPTIONAL_CONFIG = {
  type: 'human',
  biology: null,
  environment: null,
  culture: null,
  technology: null,
  physicalDescription: null,
  lifespan: null,
  notableEvents: [],
  abilities: [],
  goals: [],
  challenges: [],
  relationships: [],
  customAttributes: {},
  timelineStructure: 'linear',
  narrativeStyle: 'personal',
  transformPrompt: ''
};

async function promptToCharacterConfig(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ 
        role: "user", 
        content: `Generate a detailed character configuration in JSON format. The character should be unique and interesting.
The configuration must include:
- type (e.g., human, AI, alien, etc.)
- physicalDescription (detailed physical appearance)
- biology (species traits or characteristics)
- technology (tools, devices, or tech they use)
- notableEvents (array of significant life events)
- goals (array of personal objectives)
- challenges (array of obstacles or difficulties)
- characterName (a unique and fitting name)

${prompt}

Return ONLY a valid JSON object with no additional text or markdown formatting.`
      }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    
    // Clean up response - remove any assistant prefix or markdown
    const cleanedResponse = response.replace(/^\[Assistant\]:\s*/i, '')
                                  .replace(/^```json\s*/, '')
                                  .replace(/\s*```$/, '');
    
    try {
      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse initial response, retrying with different prompt...');
      // Retry with more explicit prompt
      const retryPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object with no additional text or markdown formatting. The response should start with "{" and end with "}".`;
      
      const retryCompletion = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: retryPrompt }],
        temperature: 0.8,
        max_tokens: 1000
      });
      
      const retryResponse = retryCompletion.choices[0].message.content;
      return JSON.parse(retryResponse);
    }
  } catch (error) {
    throw new Error(`Failed to generate character config: ${error.message}`);
  }
}

async function initCharacter(options) {
  try {
    // Check if character already exists
    const outputDir = path.join('./output', encodeURIComponent(options.name).replace(/%20/g, '-'));
    const configPath = path.join(outputDir, 'config.json');
    
    if (existsSync(configPath)) {
      console.error(`Character ${options.name} already exists at ${outputDir}`);
      console.error('To modify an existing character, use the expand command instead.');
      process.exit(1);
    }

    console.log('Generating character configuration...');
    const aiConfig = await promptToCharacterConfig(options.prompt);
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Add metadata to config
    const characterConfig = {
      type: aiConfig.type || 'human',
      physicalDescription: aiConfig.physicalDescription || 'No description available',
      biology: aiConfig.biology || null,
      technology: aiConfig.technology || null,
      notableEvents: aiConfig.notableEvents || [],
      goals: aiConfig.goals || [],
      challenges: aiConfig.challenges || [],
      name: options.name,
      characterName: aiConfig.characterName || options.name,
      birthDate: options.birthDate,
      creationDate: options.creationDate,
      outputDir,
      environment: aiConfig.environment || null,
      culture: aiConfig.culture || null,
      lifespan: aiConfig.lifespan || null,
      abilities: aiConfig.abilities || [],
      relationships: aiConfig.relationships || [],
      customAttributes: aiConfig.customAttributes || {},
      timelineStructure: aiConfig.timelineStructure || 'linear',
      narrativeStyle: aiConfig.narrativeStyle || 'personal',
      transformPrompt: aiConfig.transformPrompt || ''
    };
    
    // Save config
    await fs.writeFile(
      configPath,
      JSON.stringify(characterConfig, null, 2)
    );
    console.log(`Created character configuration for ${options.name} at ${configPath}`);
    
    // Initialize timeline graph
    const graph = new graphology.Graph({
      type: 'mixed',
      multi: false,
      allowSelfLoops: true
    });
    
    // Add birth node
    graph.addNode('birth', {
      name: `Birth of ${characterConfig.characterName}`,
      timestamp: `${options.birthDate}T00:00:00-05:00`,
      description: `Beginning of ${characterConfig.characterName}'s story.`,
      timeline: 'main',
      expansion_prompt: `What were the circumstances surrounding ${characterConfig.characterName}'s birth? Consider the environment, the people present, and any notable events or signs that accompanied their arrival.`
    });
    
    // Save graph
    const graphPath = path.join(outputDir, 'timeline_graph.json');
    await fs.writeFile(
      graphPath,
      JSON.stringify(graph.export(), null, 2)
    );
    console.log(`Initialized timeline graph at ${graphPath}`);
    
    console.log(`Character ${characterConfig.characterName} initialized successfully!`);
  } catch (error) {
    throw new Error(`Error initializing character: ${error.message}`);
  }
}

async function main() {
  program
    .name('init-character')
    .description('Initialize a new character with timeline configuration')
    .requiredOption('-n, --name <name>', 'Character name')
    .requiredOption('-p, --prompt <prompt>', 'Base prompt for character generation')
    .requiredOption('-b, --birth-date <date>', 'Character birth date (YYYY-MM-DD)')
    .requiredOption('-c, --creation-date <date>', 'Character creation date (YYYY-MM-DD)');

  program.parse();
  const options = program.opts();

  try {
    const result = await initCharacter({
      name: options.name,
      prompt: options.prompt,
      birthDate: options.birthDate,
      creationDate: options.creationDate
    });
    process.exit(result);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
