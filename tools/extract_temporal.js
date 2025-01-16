import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { promisify } from 'util';
import { createDirectory, fileExists } from '../utils/fileUtils.js';

dotenv.config();

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const CHUNK_SIZE = 4000; // Size of text chunks to process
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processChunkWithAI(chunk, previousExtractions = '') {
  const contextPrompt = previousExtractions ? 
    `Previously extracted information:\n${previousExtractions}\n\nAnalyze this new chunk in context of the above information.` : 
    'This is the first chunk of analysis.';

  const prompt = `${contextPrompt}

Extract temporal information, entities, and connections from the following text. Focus on:
1. Dates and timestamps
2. Event sequences and their relationships to previous events
3. Named entities (people, places, organizations) and their connections
4. Causal relationships and dependencies
5. Cross-references to previously extracted information

If you find connections to previously extracted information, explicitly state these connections.

Text chunk:
${chunk}

Provide the analysis in markdown format with clear sections for:
- New Temporal Information
- Entity Relationships
- Cross-References
- Updated Timeline`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          { 
            role: "system", 
            content: "You are a temporal information extraction system. Extract and organize temporal scaffolds from text, maintaining context and connections between different parts of the analysis." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error.message);
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY);
      } else {
        throw error;
      }
    }
  }
}

async function processFile(filePath, outputFile) {
  try {
    console.log(`\nReading file: ${filePath}`);
    const content = await readFileAsync(filePath, 'utf8');
    const chunks = [];
    
    // Split content into chunks
    for (let i = 0; i < content.length; i += CHUNK_SIZE) {
      chunks.push(content.slice(i, i + CHUNK_SIZE));
    }

    console.log(`Split into ${chunks.length} chunks of ${CHUNK_SIZE} bytes each`);
    
    const fileName = path.basename(filePath);
    await fs.promises.appendFile(outputFile, `\n# Analysis of ${fileName}\n\n`);

    let accumulatedExtractions = '';

    for (let i = 0; i < chunks.length; i++) {
      console.log(`\nProcessing chunk ${i + 1}/${chunks.length} of ${fileName}`);
      console.log(`Chunk size: ${chunks[i].length} bytes`);
      const analysis = await processChunkWithAI(chunks[i], accumulatedExtractions);
      
      // Update accumulated extractions with new analysis
      accumulatedExtractions += `\n\nChunk ${i + 1} Analysis:\n${analysis}`;
      
      // Append this chunk's analysis to the file
      await fs.promises.appendFile(outputFile, 
        `## Chunk ${i + 1}/${chunks.length}\n\n${analysis}\n\n---\n\n`);
    }

    // Add a final summary section
    console.log(`\nGenerating summary for ${fileName}`);
    const summaryPrompt = `Summarize all temporal information and connections found in this file:\n\n${accumulatedExtractions}`;
    const summary = await processChunkWithAI(summaryPrompt);
    await fs.promises.appendFile(outputFile, 
      `\n## Final Summary for ${fileName}\n\n${summary}\n\n`);

    return true;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    await fs.promises.appendFile(outputFile, 
      `Error processing file ${path.basename(filePath)}: ${error.message}\n\n---\n\n`);
    return false;
  }
}

async function processDirectory(inputDir) {
  const outputDir = path.join(process.cwd(), 'output');
  await createDirectory(outputDir);

  const inputFolderName = path.basename(inputDir);
  const outputFile = path.join(outputDir, `extract_${inputFolderName}.md`);
  
  // Clear any existing output file
  await fs.promises.writeFile(outputFile, '', 'utf8');
  
  // Initialize output file
  await fs.promises.appendFile(outputFile, 
    `# Temporal Analysis of ${inputFolderName}\n\nStarted at: ${new Date().toISOString()}\n\n`);
  
  const files = await fs.promises.readdir(inputDir);
  console.log('Files found:', files);
  
  let globalExtractions = '';
  
  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const stats = await fs.promises.stat(filePath);

    if (stats.isFile()) {
      console.log(`\nStarting to process file: ${file}`);
      const content = await readFileAsync(filePath, 'utf8');
      console.log(`File size: ${content.length} bytes`);
      const numChunks = Math.ceil(content.length / CHUNK_SIZE);
      console.log(`Will be split into ${numChunks} chunks`);
      
      await processFile(filePath, outputFile);
      
      // Update global context
      globalExtractions = await readFileAsync(outputFile, 'utf8');
      
      await fs.promises.appendFile(outputFile, '\n================\n\n');
    }
  }

  // Add a global summary section
  console.log('\nGenerating global summary...');
  const globalSummaryPrompt = `Create a comprehensive temporal summary across all analyzed files:\n\n${globalExtractions}`;
  const globalSummary = await processChunkWithAI(globalSummaryPrompt);
  await fs.promises.appendFile(outputFile, 
    `\n# Global Temporal Analysis\n\n${globalSummary}\n\n`);

  // Add completion timestamp
  await fs.promises.appendFile(outputFile, 
    `\nAnalysis completed at: ${new Date().toISOString()}\n`);
    
  console.log(`Analysis complete. Results saved to ${outputFile}`);
}

// CLI entry point
const inputDir = process.argv[2];
if (!inputDir) {
  console.error('Please provide an input directory path');
  process.exit(1);
}

processDirectory(inputDir).catch(console.error);
