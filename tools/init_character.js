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
    .requiredOption('-n, --name <n>', 'Character name')
    .requiredOption('-p, --base-prompt <prompt>', 'Base prompt for character generation')
    // Optional basic options
    .option('-c, --timeline-cutoff <date>', 'Timeline cutoff date (YYYY-MM-DD)', REQUIRED_CONFIG.timelineCutoff)
    .option('-b, --birth-date <date>', 'Character birth date (YYYY-MM-DD)');

  program.parse();
  const options = program.opts();

  try {
    // Generate AI config from base prompt
    console.log('Generating character configuration...');
    const aiConfig = await promptToCharacterConfig(options.basePrompt);
    
    // Merge configs with priority: AI config < Optional defaults < Command line options
    const config = {
      ...OPTIONAL_CONFIG,
      ...aiConfig,
      name: options.name,
      basePrompt: options.basePrompt,
      birthDate: options.birthDate,
      timelineCutoff: options.timelineCutoff
    };

    // Validate configuration
    const errors = validateConfig(config);
    if (errors.length > 0) {
      console.error('Configuration errors:');
      errors.forEach(err => console.error(`- ${err}`));
      process.exit(1);
    }

    // Create character
    await createCharacter(options.name, config);
    console.log(`Character ${options.name} initialized successfully!`);

  } catch (error) {
    console.error('Error initializing character:', error);
    process.exit(1);
  }
}

initCharacter();
