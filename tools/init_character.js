#!/usr/bin/env node

import 'dotenv/config';
import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { createCharacter } from './create_character.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Required configuration
const REQUIRED_CONFIG = {
  name: '',
  basePrompt: '',
  timelineCutoff: new Date().toISOString().split('T')[0],
  birthDate: null
};

// Optional advanced configuration
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
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `You are a character creation assistant. Convert the following description into a structured character configuration object with these possible fields:
        type, biology, environment, culture, technology, physicalDescription, lifespan, notableEvents (array),
        abilities (array), goals (array), challenges (array), relationships (array), timelineStructure, narrativeStyle, transformPrompt.
        Only include fields that are relevant to the character description. Output just the JSON object, nothing else.`
      }, {
        role: "user",
        content: prompt
      }]
    });

    const config = JSON.parse(completion.choices[0].message.content);
    return config;
  } catch (error) {
    console.error('Error generating character config from prompt:', error);
    return {};
  }
}

function validateConfig(config) {
  const errors = [];
  
  // Check required fields
  for (const [key, defaultValue] of Object.entries(REQUIRED_CONFIG)) {
    if (!config[key] && defaultValue === null) {
      errors.push(`Missing required field: ${key}`);
    }
  }

  // Validate date formats
  if (config.timelineCutoff && !isValidDate(config.timelineCutoff)) {
    errors.push('Invalid timelineCutoff date format (use YYYY-MM-DD)');
  }
  if (config.birthDate && !isValidDate(config.birthDate)) {
    errors.push('Invalid birthDate format (use YYYY-MM-DD)');
  }

  return errors;
}

function isValidDate(dateStr) {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
}

async function initCharacter() {
  program
    .name('init-character')
    .description('Initialize a new character with timeline configuration')
    // Required options
    .requiredOption('-n, --name <name>', 'Character name')
    .requiredOption('-p, --base-prompt <prompt>', 'Base prompt for character generation')
    // Optional basic options
    .option('-c, --timeline-cutoff <date>', 'Timeline cutoff date (YYYY-MM-DD)', REQUIRED_CONFIG.timelineCutoff)
    .option('-b, --birth-date <date>', 'Character birth date (YYYY-MM-DD)')
    // Advanced character options
    .option('-t, --type <type>', 'Character type (e.g., human, alien, AI)', OPTIONAL_CONFIG.type)
    .option('--biology <description>', 'Biological characteristics')
    .option('--environment <description>', 'Environmental context')
    .option('--culture <description>', 'Cultural background')
    .option('--technology <description>', 'Technological context')
    .option('--physical-description <description>', 'Physical appearance and characteristics')
    .option('--lifespan <description>', 'Expected lifespan')
    .option('--notable-events <events...>', 'List of notable events')
    .option('--abilities <abilities...>', 'List of abilities')
    .option('--goals <goals...>', 'List of goals')
    .option('--challenges <challenges...>', 'List of challenges')
    .option('--relationships <relationships...>', 'List of relationships')
    .option('--timeline-structure <type>', 'Timeline structure type (linear, branching, quantum, etc.)', OPTIONAL_CONFIG.timelineStructure)
    .option('--narrative-style <style>', 'Narrative perspective style', OPTIONAL_CONFIG.narrativeStyle)
    .option('--transform-prompt <prompt>', 'Optional prompt to transform the timeline between expansion loops', OPTIONAL_CONFIG.transformPrompt)
    // Prompt-based generation
    .option('--prompt <description>', 'Generate character details from a natural language description')
    .parse();

  const options = program.opts();
  
  let config = {
    ...REQUIRED_CONFIG,
    ...OPTIONAL_CONFIG,
    name: options.name,
    basePrompt: options.basePrompt,
    timelineCutoff: options.timelineCutoff,
    birthDate: options.birthDate
  };

  // If prompt is provided, generate character details
  if (options.prompt) {
    const promptedConfig = await promptToCharacterConfig(options.prompt);
    config = { ...config, ...promptedConfig };
  }

  // Override with any explicitly provided options
  if (options.type) config.type = options.type;
  if (options.biology) config.biology = options.biology;
  if (options.environment) config.environment = options.environment;
  if (options.culture) config.culture = options.culture;
  if (options.technology) config.technology = options.technology;
  if (options.physicalDescription) config.physicalDescription = options.physicalDescription;
  if (options.lifespan) config.lifespan = options.lifespan;
  if (options.notableEvents) config.notableEvents = options.notableEvents;
  if (options.abilities) config.abilities = options.abilities;
  if (options.goals) config.goals = options.goals;
  if (options.challenges) config.challenges = options.challenges;
  if (options.relationships) config.relationships = options.relationships;
  if (options.timelineStructure) config.timelineStructure = options.timelineStructure;
  if (options.narrativeStyle) config.narrativeStyle = options.narrativeStyle;
  if (options.transformPrompt) config.transformPrompt = options.transformPrompt;

  // Validate configuration
  const errors = validateConfig(config);
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }

  // Clean up config by removing null/undefined values
  Object.keys(config).forEach(key => {
    if (config[key] === null || config[key] === undefined) {
      delete config[key];
    }
  });

  try {
    const outputDir = path.join('./output', config.name.toLowerCase());
    await fs.mkdir(outputDir, { recursive: true });
    
    const configPath = path.join(outputDir, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log(`Character ${config.name} initialized successfully!`);
    console.log(`Configuration saved to: ${configPath}`);
    
    // Create initial graph if needed
    const graphPath = path.join(outputDir, 'graph.json');
    try {
      await fs.access(graphPath);
    } catch {
      await createCharacter(config.name, config);
      console.log('Initial timeline graph created.');
    }
  } catch (error) {
    console.error('Error initializing character:', error);
    process.exit(1);
  }
}

initCharacter();
