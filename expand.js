console.log('Starting expand.js...');
console.log('Command line args:', process.argv);

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

console.log('Environment:', {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set',
  MODEL: process.env.MODEL || 'default',
  CHARACTER: process.env.CHARACTER || 'default'
});

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Select Model
const MODEL = process.env.MODEL || 'gpt-4o-mini-2024-07-18';

// Global variables
let characterConfig = null;
let graph = null;

// Get character from command line args or fallback to env var
const currentCharacter = process.argv[2] || process.env.CHARACTER || "Naval Ravikant";

// Calculate output directory based on character name
function getOutputDir(character) {
  // Make directory name URI-safe
  const dirName = encodeURIComponent(character).replace(/%20/g, '-');
  return `./output/${dirName}`;
}

async function loadCharacterConfig(character) {
  console.log('Loading character config for:', character);
  const configPath = `${getOutputDir(character)}/config.json`;
  console.log('Config path:', configPath);
  try {
    console.log('Reading config file...');
    const configData = await fs.readFile(configPath, 'utf8');
    console.log('Config data loaded, parsing JSON...');
    const config = JSON.parse(configData);
    // Add calculated output directory
    config.outputDir = getOutputDir(character);
    console.log('Config loaded successfully:', config.name);
    return config;
  } catch (error) {
    console.error(`Error loading character config for ${character}:`, error);
    if (error.code === 'ENOENT') {
      throw new Error(`Character configuration not found: ${configPath}`);
    }
    throw error;
  }
}

let GRAPH_FILE;
let TIMELINE_CUTOFF_DATE;
let EXPANSION_PROMPT_TYPES;
let NARRATIVE_FILE;
let NARRATIVE_MD_FILE;

// Load and process expansion templates
async function loadExpansionTemplates() {
  try {
    const expansionsData = await fs.readFile('./expansions.json', 'utf8');
    const baseTemplates = JSON.parse(expansionsData);
    
    // Process templates with character config
    EXPANSION_PROMPT_TYPES = Object.fromEntries(
      Object.entries(baseTemplates).map(([key, type]) => {
        return [key, {
          name: type.name,
          templates: type.templates.map(template => {
            // Replace template variables with character config values
            let processed = template;
            processed = processed.replace(/\${name}/g, characterConfig.name);
            processed = processed.replace(/\${type}/g, characterConfig.type || 'being');
            processed = processed.replace(/\${culture}/g, characterConfig.culture || 'their culture');
            processed = processed.replace(/\${environment}/g, characterConfig.environment || 'their environment');
            // Keep ${subject} as is - it will be replaced at runtime
            return processed;
          })
        }];
      })
    );
    
    console.log('Loaded and processed expansion templates');
  } catch (error) {
    console.error('Failed to load expansion templates:', error);
    process.exit(1);
  }
}

async function initialize() {
  try {
    console.log('Starting initialization...');
    // Load character configuration
    characterConfig = await loadCharacterConfig(currentCharacter);
    console.log(`Loaded configuration for character: ${characterConfig.name}`);
    
    // Load and process expansion templates
    console.log('Loading expansion templates...');
    await loadExpansionTemplates();
    console.log('Loaded expansion templates');
    
    // Set file paths after config is loaded
    GRAPH_FILE = `${characterConfig.outputDir}/timeline_graph.json`;
    TIMELINE_CUTOFF_DATE = new Date(characterConfig.timelineCutoff);
    NARRATIVE_FILE = `${characterConfig.outputDir}/narrative.json`;
    NARRATIVE_MD_FILE = `${characterConfig.outputDir}/narrative.md`;
    
    console.log('Set file paths:', {
      GRAPH_FILE,
      TIMELINE_CUTOFF_DATE,
      NARRATIVE_FILE,
      NARRATIVE_MD_FILE
    });
    
    // Ensure output directories exist
    await fs.mkdir(characterConfig.outputDir, { recursive: true });
    console.log('Created output directory:', characterConfig.outputDir);
    
    // Initialize graph
    console.log('Initializing character graph...');
    const success = await loadCharacter(currentCharacter);
    console.log('Character graph initialization:', success ? 'success' : 'failed');
    
    if (!success) {
      throw new Error('Failed to initialize character graph');
    }
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

// Helper function to check if file exists
async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadCharacter(characterId) {
  const outputDir = path.join(process.cwd(), 'output', characterId);
  const configPath = path.join(outputDir, 'config.json');
  const graphPath = path.join(outputDir, 'timeline_graph.json');

  try {
    // Check if character exists
    if (!existsSync(configPath)) {
      console.error(`Character ${characterId} not found at ${outputDir}`);
      console.error('Use the new-character command to create a new character first.');
      return false;
    }

    // Load character config
    const configData = await fs.readFile(configPath, 'utf8');
    characterConfig = JSON.parse(configData);
    characterConfig.outputDir = outputDir;

    // Load or initialize graph
    if (existsSync(graphPath)) {
      console.log('Loading existing graph...');
      const graphData = await fs.readFile(graphPath, 'utf8');
      graph = new graphology.Graph();
      graph.import(JSON.parse(graphData));
    } else {
      console.log('Initializing new graph...');
      graph = new graphology.Graph({
        type: 'mixed',
        multi: false,
        allowSelfLoops: true
      });
      
      // Add birth node
      graph.addNode('birth', {
        name: `Birth of ${characterId}`,
        timestamp: `${characterConfig.birthDate}T00:00:00-05:00`,
        description: `Beginning of ${characterId}'s story.`,
        timeline: 'main',
        expansion_prompt: `What were the circumstances surrounding ${characterId}'s birth? Consider the environment, the people present, and any notable events or signs that accompanied their arrival.`
      });
    }

    return true;
  } catch (error) {
    console.error(`Error loading character ${characterId}:`, error.message);
    return false;
  }
}

async function saveGraph() {
  const graphPath = path.join(characterConfig.outputDir, 'timeline_graph.json');
  await fs.writeFile(
    graphPath,
    JSON.stringify(graph.export(), null, 2)
  );
  console.log(`Saved graph to ${graphPath}`);
}

function getCurrentState() {
  if (!graph) {
    throw new Error('Graph not initialized');
  }

  const currentState = {
    nodes: [],
    edges: []
  };

  graph.forEachNode((node, attributes) => {
    currentState.nodes.push({ id: node, ...attributes });
  });

  graph.forEachEdge((edge, attributes, source, target) => {
    currentState.edges.push({
      source,
      target,
      ...attributes
    });
  });

  currentState.nodes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return currentState;
}

function getUnprocessedNodes() {
  const nodes = [];
  graph.forEachNode((node, attributes) => {
    // Consider any node with an expansion prompt that hasn't been fully expanded
    // A node is considered "fully expanded" if it has 3 or more outgoing edges
    const outgoingEdges = graph.outNeighbors(node).length;
    if (attributes.expansion_prompt && outgoingEdges < 3) {
      nodes.push({ id: node, outgoingEdges, ...attributes });
    }
  });
  
  // Sort nodes randomly
  return nodes.sort(() => Math.random() - 0.5);
}

async function runExpansionLoop(currentIteration, totalLoops, loopsPerNarrative) {
  try {
    // Get current state
    const currentState = getCurrentState();
    
    // Find new connections every 5 iterations
    if (currentIteration % 5 === 0 && currentState.nodes.length > 1) {
      await findNewConnections(currentState.nodes);
    }
    
    // Transform timeline every 10 iterations
    if (currentIteration % 10 === 0 && currentState.nodes.length > 1) {
      await transformTimeline(currentState.nodes);
    }

    // Expand each node
    let expandedCount = 0;
    for (const node of currentState.nodes) {
      // Skip nodes that have been expanded too many times
      if (node.expansions >= 3) continue;
      
      // Attempt expansion
      const expanded = await expandIteration(currentIteration, node.id);
      if (expanded) {
        expandedCount++;
        node.expansions = (node.expansions || 0) + 1;
      }
      
      // Break if we've expanded enough nodes this iteration
      if (expandedCount >= 3) break;
    }
    
    // If no existing nodes were expanded, try creating a new root event
    if (expandedCount === 0) {
      await expandIteration(currentIteration);
    }

    // Evaluate timeline after processing all nodes in this iteration
    await evaluateTimeline(currentIteration, currentState.nodes);
    
    // Generate narration every 10 iterations
    if (currentIteration % loopsPerNarrative === 0) {
      await generateNarration();
    }

    return true;
  } catch (error) {
    console.error('Error during iteration:', error);
    return false;
  }
}

async function addEventToGraph(event) {
  const eventId = event.id;
  const characterName = characterConfig.characterName || characterConfig.name;
  
  graph.addNode(eventId, {
    name: event.name,
    timestamp: event.timestamp,
    description: event.description,
    timeline: "main",
    expansion_prompt: `What were the key moments and details surrounding ${event.name}? Consider the lead-up to this event, the people involved, and its immediate aftermath. How did this event change ${characterName}'s path?`
  });

  // Add edge from source to new event
  graph.addEdge(event.connectedTo, eventId, {
    type: event.connectionType || "sequence",
    description: event.connectionDescription || `Follows from ${event.connectedTo}`
  });

  return eventId;
}

async function findNewConnections(nodes) {
  console.log('\nFinding new connections between nodes...');
  const characterName = characterConfig.characterName || characterConfig.name;
  
  const template = {
    "connections": []
  };
  
  const prompt = `Given these timeline events in ${characterName}'s life, identify any potential NEW connections or relationships between them that aren't already captured. Focus on discovering non-obvious cause-and-effect relationships, thematic links, or parallel developments that might have been missed.

Return ONLY a JSON object with no markdown formatting or extra text:
{
  "connections": [
    {
      "from": "event_id_1",
      "to": "event_id_2",
      "type": "one of: CAUSES, INFLUENCES, PARALLELS, CONTRASTS, ENABLES",
      "description": "Detailed description of how these events are connected"
    }
  ]
}
Keep descriptions short, we have 2500 tokens to work with, lets save it for long graphs vs verbosity.
Timeline events:
${nodes.map(n => `- ${n.timestamp}: ${n.name} (id: ${n.id})\n${n.description}`).join('\n\n')}

Existing connections:
${graph.edges().map(e => {
  const edge = graph.getEdgeAttributes(e);
  const source = graph.getNodeAttributes(graph.source(e));
  const target = graph.getNodeAttributes(graph.target(e));
  return `- ${source.name} -> ${target.name}: ${edge.type}${edge.description ? ` (${edge.description})` : ''}`;
}).join('\n')}`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2500
  });

  const content = completion.choices[0].message.content;
  const logPath = path.join(characterConfig.outputDir, 'connections_log.txt');
  await fs.appendFile(logPath, `\n=== NEW CONNECTIONS ATTEMPT ${new Date().toISOString()} ===\n`);
  await fs.appendFile(logPath, `\nAI Response:\n${content}\n`);
  
  try {
    // Clean and parse the JSON response
    const cleanedContent = ensureValidJson(content, template);
    const parsed = JSON.parse(cleanedContent);
    await fs.appendFile(logPath, `\nParsed Response:\n${JSON.stringify(parsed, null, 2)}\n`);

    if (!parsed.connections || !Array.isArray(parsed.connections)) {
      console.log('No valid connections found in response');
      return false;
    }

    let addedConnections = 0;
    for (const conn of parsed.connections) {
      // Validate connection object
      if (!conn.from || !conn.to || !conn.type || !conn.description) {
        console.log('Skipping invalid connection:', conn);
        continue;
      }

      // Validate node IDs exist
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) {
        console.log('Skipping connection with invalid node IDs:', conn);
        continue;
      }

      // Validate connection type
      const validTypes = ['CAUSES', 'INFLUENCES', 'PARALLELS', 'CONTRASTS', 'ENABLES'];
      const connectionType = conn.type.toUpperCase();
      if (!validTypes.includes(connectionType)) {
        console.log('Invalid connection type, defaulting to INFLUENCES:', conn);
        conn.type = 'INFLUENCES';
      }

      // Check if edge already exists
      if (!graph.hasEdge(conn.from, conn.to)) {
        // Add edge to the graph
        graph.addEdge(conn.from, conn.to, {
          type: connectionType,
          description: conn.description
        });
        await saveGraph();
        console.log(`Added edge: ${fromNode.name} -> ${toNode.name} (${connectionType}: ${conn.description})`);
        addedConnections++;
      } else {
        console.log(`Edge already exists between ${fromNode.name} and ${toNode.name}`);
      }
    }

    await fs.appendFile(logPath, `\nAdded ${addedConnections} new connections\n`);
    return addedConnections > 0;
  } catch (error) {
    console.error('Error parsing connections:', error);
    await fs.appendFile(logPath, `\nError parsing connections: ${error}\n${error.stack}\n`);
    return false;
  }
}

async function transformTimeline(nodes) {
  try {
    // Sort nodes chronologically
    const timelineNodes = nodes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Find time gaps between events
    const timeGaps = [];
    for (let i = 0; i < timelineNodes.length - 1; i++) {
      const current = new Date(timelineNodes[i].timestamp);
      const next = new Date(timelineNodes[i + 1].timestamp);
      const gap = next - current;
      
      // If gap is more than a week, record it
      if (gap > 7 * 24 * 60 * 60 * 1000) {
        timeGaps.push({
          start: timelineNodes[i],
          end: timelineNodes[i + 1],
          duration: gap
        });
      }
    }

    // If no significant gaps found, return
    if (timeGaps.length === 0) {
      console.log('No significant time gaps found for transformation');
      return;
    }

    const characterName = characterConfig.characterName || characterConfig.name;
    const prompt = `You are analyzing ${characterName}'s timeline to find new connections and potential events.

Current timeline events (chronological order):
${timelineNodes.map(n => `- ${n.timestamp}: ${n.name}`).join('\n')}

Available time gaps for new event:
${timeGaps.map(gap => {
  const startDate = new Date(gap.start.timestamp);
  const endDate = new Date(gap.end.timestamp);
  return `- Between "${gap.start.name}" and "${gap.end.name}" (${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`;
}).join('\n')}

Suggest new connections between events and potential new events that could fill these gaps. Consider:
1. Cause and effect relationships
2. Character development
3. Plot progression
4. World-building
5. Thematic resonance

Format your response as JSON:
{
  "connections": [
    {
      "source": "Source Event Name",
      "target": "Target Event Name",
      "type": "CAUSES|ENABLES|INFLUENCES|PARALLELS|CONTRASTS",
      "description": "Brief explanation of the connection"
    }
  ],
  "newEvents": [
    {
      "name": "Event Name",
      "timestamp": "YYYY-MM-DD",
      "description": "Detailed event description"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const cleanedResponse = cleanJsonResponse(completion.choices[0].message.content);
    const response = JSON.parse(cleanedResponse);

    // Add new events
    if (response.newEvents) {
      for (const event of response.newEvents) {
        // Check if event with this name already exists
        let exists = false;
        graph.forEachNode((nodeId, attrs) => {
          if (attrs.name === event.name) {
            exists = true;
            console.log(`Event "${event.name}" already exists, skipping...`);
          }
        });

        if (!exists) {
          const eventId = generateEventId();
          try {
            graph.addNode(eventId, {
              name: event.name,
              timestamp: event.timestamp,
              description: event.description,
              timeline: 'main'
            });
            console.log(`Added new event: ${event.name}`);
          } catch (error) {
            console.error(`Error adding event ${event.name}:`, error);
          }
        }
      }
    }

    // Add new connections
    if (response.connections) {
      for (const conn of response.connections) {
        // Find node IDs for source and target
        let sourceId = null;
        let targetId = null;
        
        graph.forEachNode((nodeId, attrs) => {
          if (attrs.name === conn.source) sourceId = nodeId;
          if (attrs.name === conn.target) targetId = nodeId;
        });

        // Only add edge if both nodes exist
        if (sourceId && targetId) {
          try {
            // Check if edge already exists
            let exists = false;
            graph.forEachEdge((edgeId, attrs, source, target) => {
              if (source === sourceId && target === targetId && attrs.type === conn.type.toUpperCase()) {
                exists = true;
                console.log(`Connection from "${conn.source}" to "${conn.target}" of type ${conn.type} already exists, skipping...`);
              }
            });

            if (!exists) {
              graph.addEdge(sourceId, targetId, {
                type: conn.type.toUpperCase(),
                description: conn.description
              });
              console.log(`Added new connection: ${conn.source} -> ${conn.target} (${conn.type})`);
            }
          } catch (error) {
            console.log(`Error adding edge from ${conn.source} to ${conn.target}: ${error.message}`);
          }
        } else {
          console.log(`Could not find nodes for connection: ${conn.source} -> ${conn.target}`);
        }
      }
    }

    await saveGraph();
    return true;
  } catch (error) {
    console.error('Error in timeline transformation:', error);
    return false;
  }
}

async function runLoopManager(totalLoops = 100, loopsPerNarrative = 1) {
  let currentLoop = 0;

  while (currentLoop < totalLoops) {
    console.log(`\n=== Starting Loop Set ${Math.floor(currentLoop / loopsPerNarrative) + 1} ===\n`);
    
    await runExpansionLoop(currentLoop, totalLoops, loopsPerNarrative);
    
    currentLoop += loopsPerNarrative;
    await generateNarration();
    
    console.log(`\nCompleted ${currentLoop}/${totalLoops} total loops`);
    console.log(`\nStarting next set of ${loopsPerNarrative} loops...\n`);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

async function evaluateTimeline(iterationNumber, nodes) {
  console.log('\nEvaluating timeline...');
  const characterName = characterConfig.characterName || characterConfig.name;

  // Sort nodes chronologically
  nodes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Format timeline data for the prompt
  const timelineData = nodes.map(node => ({
    id: node.id,
    title: node.title,
    description: node.description,
    timestamp: node.timestamp,
    connections: graph.outEdges(node.id).map(edge => ({
      target: graph.target(edge),
      type: graph.getEdgeAttribute(edge, 'type'),
      description: graph.getEdgeAttribute(edge, 'description')
    }))
  }));

  const prompt = `You are evaluating the timeline of ${characterName}. Here is the current timeline data:

${JSON.stringify(timelineData, null, 2)}

Consider these aspects:

- Temporal consistency
- Character development
- Plot coherence
- World-building
- Thematic depth
- Narrative flow
- Plausible consequences

For each aspect, explain the score and list any specific issues found. Start with an overall score (average of all scores) and summary.
Before the score, summarize the timeline as a narrative, and add another section that's an entity graph.
Format your response in markdown with clear sections for the overall score and each aspect.`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000
  });

  const content = completion.choices[0].message.content;
  
  // Use the initial timestamp for all eval files in this iteration
  const timestamp = characterConfig.startTime || Date.now();
  const evalPath = path.join(characterConfig.outputDir, `eval_iteration${String(iterationNumber).padStart(2, '0')}_${timestamp}.md`);
  
  await fs.writeFile(evalPath, content);
  console.log(`Saved evaluation to ${evalPath}`);
}

async function generateNarration() {
  const timelineNodes = [];
  graph.forEachNode((node, attrs) => {
    timelineNodes.push({
      key: node,
      name: attrs.name,
      timestamp: attrs.timestamp,
      description: attrs.description
    });
  });
  
  timelineNodes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const narration = `# The Story of ${characterConfig.name}

## Character Profile
**Type**: ${characterConfig.type}
**Birth/Creation**: ${characterConfig.birthDate}
**Description**:
${Object.entries(characterConfig.physicalDescription).map(([key, value]) => `### ${key}\n\n${value}\n`).join('\n\n')}
**Biology**: ${typeof characterConfig.biology === 'object' ? JSON.stringify(characterConfig.biology) : characterConfig.biology}
**Technology**: ${typeof characterConfig.technology === 'object' ? JSON.stringify(characterConfig.technology) : characterConfig.technology}

### Goals
${characterConfig.goals ? characterConfig.goals.map(g => `- ${g}`).join('\n') : 'None specified'}

### Challenges
${characterConfig.challenges ? characterConfig.challenges.map(c => `- ${c}`).join('\n') : 'None specified'}

## Timeline

${timelineNodes.map(node => 
  `### ${node.name}\n**Time**: ${node.timestamp}\n\n${node.description}\n`
).join('\n\n')}`;

  const narrationPath = path.join(characterConfig.outputDir, 'narrative.md');
  await fs.writeFile(narrationPath, narration);
}

async function expandIteration(iterationNumber, nodeId = null) {
  try {
    // Log expansion attempt
    const logPath = path.join(characterConfig.outputDir, 'expansion_log.txt');
    const logEntry = `\n=== EXPANSION ATTEMPT ${new Date().toISOString()} ===\n`;
    await fs.appendFile(logPath, logEntry);

    // Get current state
    const currentState = getCurrentState();
    
    // Generate expansion prompt
    const prompt = await generateExpansionPrompt(nodeId, nodeId ? graph.getNodeAttributes(nodeId) : null);
    await fs.appendFile(logPath, `\nNode ID: ${nodeId}\nNode Attributes: ${JSON.stringify(graph.getNodeAttributes(nodeId), null, 2)}\n`);
    await fs.appendFile(logPath, `\nExpansion Prompt:\n${prompt}\n`);

    // Get AI completion
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    await fs.appendFile(logPath, `\nAI Response:\n${response}\n`);

    try {
      // Clean up the response before parsing
      const cleanedResponse = cleanJsonResponse(response);
      const parsedEvent = JSON.parse(cleanedResponse);
      await fs.appendFile(logPath, `\nParsed Event:\n${JSON.stringify(parsedEvent, null, 2)}\n`);

      // Add event to graph
      const eventId = parsedEvent.id;
      const characterName = characterConfig.characterName || characterConfig.name;
      
      graph.addNode(eventId, {
        name: parsedEvent.name,
        timestamp: parsedEvent.timestamp,
        description: parsedEvent.description,
        timeline: "main",
        expansion_prompt: `What were the key moments and details surrounding ${parsedEvent.name}? Consider the lead-up to this event, the people involved, and its immediate aftermath. How did this event change ${characterName}'s path?`,
        templateType: parsedEvent.templateType
      });

      // Add edge to graph
      if (parsedEvent.connectedTo) {
        graph.addEdge(parsedEvent.connectedTo, eventId, {
          type: parsedEvent.connectionType || "sequence",
          description: parsedEvent.connectionDescription || `Follows from ${parsedEvent.connectedTo}`
        });
      }

      // Save graph after adding new event
      await saveGraph();

      await fs.appendFile(logPath, `\nAdded Event to Graph: ${eventId}\n`);
      
      return true;
    } catch (parseError) {
      await fs.appendFile(logPath, `\nError parsing event: ${parseError}\n${parseError.stack}\n`);
      return false;
    }
  } catch (error) {
    console.error('Error during iteration:', error);
    return false;
  }
}

// Utility function to clean up JSON responses
function cleanJsonResponse(response) {
  try {
    // First try parsing as-is in case it's already valid JSON
    try {
      JSON.parse(response);
      return response;
    } catch (e) {
      // Continue with cleaning if direct parse fails
    }

    // Remove markdown code block syntax and normalize line endings
    let cleaned = response.replace(/```(?:json)?/g, '')
                         .replace(/\r\n/g, '\n')
                         .trim();
    
    // Try to find the first { and last }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error('No JSON object found in response');
    }
    
    // Extract just the JSON part
    cleaned = cleaned.slice(start, end + 1);
    
    // Fix common JSON issues
    cleaned = cleaned
      // Fix trailing commas in arrays and objects
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix missing commas between array elements
      .replace(/}(\s*){/g, '},\n{')
      // Fix missing commas between object properties
      .replace(/"(\s*)"(?=\s*:)/g, '",\n"')
      // Fix unclosed arrays or objects
      .replace(/{\s*"[^}]*$/g, '{}')
      .replace(/\[\s*{[^\]]*$/g, '[]');
    
    // Attempt to parse and format
    try {
      const parsed = JSON.parse(cleaned);
      return JSON.stringify(parsed);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      console.error('Cleaned content:', cleaned);
      
      // If parsing still fails, try to recover the structure
      if (cleaned.includes('"connections"')) {
        return '{"connections": []}';
      } else if (cleaned.includes('"newEvents"')) {
        return '{"newEvents": []}';
      } else {
        throw parseError;
      }
    }
  } catch (error) {
    console.error('JSON cleaning error:', error);
    console.error('Original response:', response);
    throw new Error(`Failed to clean JSON response: ${error.message}`);
  }
}

// Helper function to ensure response is proper JSON
function ensureValidJson(completion, template) {
  try {
    // Try to parse the cleaned response
    const cleaned = cleanJsonResponse(completion);
    const parsed = JSON.parse(cleaned);
    
    // If we have a template, ensure all required fields are present
    if (template) {
      const missing = [];
      for (const key in template) {
        if (!(key in parsed)) {
          missing.push(key);
        }
      }
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }
    }
    
    return cleaned;
  } catch (error) {
    // If parsing fails, try to format response as the expected structure
    console.error('Error parsing JSON response:', error);
    console.error('Attempting to recover...');
    
    if (template) {
      const structured = {};
      for (const key in template) {
        structured[key] = template[key];
      }
      return JSON.stringify(structured, null, 2);
    }
    
    throw error;
  }
}

// Utility function to generate unique event IDs
function generateEventId() {
  let eventIdCounter = 0;
  return `event${Date.now()}_${eventIdCounter++}`;
}

// Helper function to select appropriate template type based on context
function selectTemplateType(nodeAttributes, timelineNodes) {
  if (!nodeAttributes) {
    // For root events, prefer foundational templates
    return 'CHILDHOOD_MEMORIES';
  }

  // Get all template types
  const types = Object.keys(EXPANSION_PROMPT_TYPES);
  
  // Weight the selection based on existing events
  const existingTypes = new Set(timelineNodes.map(node => node.templateType).filter(Boolean));
  
  // Prefer types we haven't used much
  const unusedTypes = types.filter(type => !existingTypes.has(type));
  if (unusedTypes.length > 0) {
    return unusedTypes[Math.floor(Math.random() * unusedTypes.length)];
  }
  
  // If all types used, pick random
  return types[Math.floor(Math.random() * types.length)];
}

async function generateExpansionPrompt(nodeKey, nodeAttributes) {
  // Get character config context
  const characterName = characterConfig.characterName || characterConfig.name;
  const characterContext = `Character Context:
Name: ${characterName}
Type: ${characterConfig.type}
Birth/Creation: ${characterConfig.birthDate}
Description: ${characterConfig.physicalDescription}
Biology: ${typeof characterConfig.biology === 'object' ? JSON.stringify(characterConfig.biology) : characterConfig.biology}
Technology: ${typeof characterConfig.technology === 'object' ? JSON.stringify(characterConfig.technology) : characterConfig.technology}
Notable Events: ${characterConfig.notableEvents ? characterConfig.notableEvents.join(', ') : 'None'}
Goals: ${characterConfig.goals ? characterConfig.goals.join(', ') : 'None'}
Challenges: ${characterConfig.challenges ? characterConfig.challenges.join(', ') : 'None'}`;

  // Get timeline context
  const timelineNodes = [];
  graph.forEachNode((node, attrs) => {
    timelineNodes.push({
      key: node,
      name: attrs.name,
      timestamp: attrs.timestamp,
      description: attrs.description,
      templateType: attrs.templateType
    });
  });
  
  timelineNodes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const timelineContext = `\nTimeline Context (chronological order):
${timelineNodes.map(node => `- [${node.key}] ${node.timestamp}: ${node.name}`).join('\n')}`;

  // Get connections context
  const connections = [];
  graph.forEachEdge((edge, attrs, source, target) => {
    const sourceNode = graph.getNodeAttributes(source);
    const targetNode = graph.getNodeAttributes(target);
    connections.push(`${sourceNode.name} -> ${targetNode.name} (${attrs.type}${attrs.description ? `: ${attrs.description}` : ''})`);
  });

  const connectionsContext = `\nExisting Connections:
${connections.join('\n')}`;

  // Select template type and get prompts
  const selectedType = selectTemplateType(nodeAttributes, timelineNodes);
  const templateData = EXPANSION_PROMPT_TYPES[selectedType];
  const selectedTemplate = templateData.templates[Math.floor(Math.random() * templateData.templates.length)];
  
  // Process template with any subject if needed
  let processedTemplate = selectedTemplate;
  if (nodeAttributes) {
    processedTemplate = processedTemplate.replace(/\${subject}/g, nodeAttributes.name);
  }

  // If we have a specific node to expand from
  if (nodeAttributes) {
    return `You are expanding the timeline for ${characterName}. 
${characterContext}
${timelineContext}
${connectionsContext}

Current Event to Expand:
Name: ${nodeAttributes.name}
Node Key: ${nodeKey}
Time: ${nodeAttributes.timestamp}
Description: ${nodeAttributes.description || 'No description available'}

Expansion Focus (${templateData.name}):
IMPORTANT: Adapt this prompt to fit the character's nature, culture, and world. For example:
- If the character is non-human, translate human concepts into appropriate equivalents
- If the setting is historical/futuristic, adjust modern references to fit the era
- If the character's culture is unique, interpret social concepts through their cultural lens
- If the character's world has special rules/physics, adapt physical concepts accordingly

Original Prompt: ${processedTemplate}

Generate a new event that addresses this focus and logically follows from the current event. The event should:
1. Be temporally consistent (happen after ${nodeAttributes.timestamp})
2. Not contradict known history or character traits
3. Provide rich detail about what happened
4. Include specific names, places, and consequences
5. Maintain consistency with the character's established timeline
6. Adapt concepts naturally to fit the character's nature and world

Return ONLY a JSON object with no markdown formatting or extra text:
{
  "id": "${generateEventId()}",
  "name": "Brief, specific title",
  "timestamp": "YYYY-MM-DD",
  "description": "Detailed description that specifically addresses the expansion focus",
  "connectedTo": "${nodeKey}",
  "connectionType": "sequence",
  "connectionDescription": "How this event follows from or relates to the previous event",
  "templateType": "${selectedType}"
}`;
  }

  // If we're generating a new root event
  return `You are expanding the timeline for ${characterName}.
${characterContext}
${timelineContext}
${connectionsContext}

Expansion Focus (${templateData.name}):
IMPORTANT: Adapt this prompt to fit the character's nature, culture, and world. For example:
- If the character is non-human, translate human concepts into appropriate equivalents
- If the setting is historical/futuristic, adjust modern references to fit the era
- If the character's culture is unique, interpret social concepts through their cultural lens
- If the character's world has special rules/physics, adapt physical concepts accordingly

Original Prompt: ${processedTemplate}

Generate a new foundational event in the character's timeline that addresses this focus. The event should:
1. Be temporally consistent with their known history
2. Not contradict known facts or character traits
3. Provide rich detail about what happened
4. Include specific names, places, and consequences
5. Help establish the character's background
6. Adapt concepts naturally to fit the character's nature and world

Return ONLY a JSON object with no markdown formatting or extra text:
{
  "id": "${generateEventId()}",
  "name": "Event Name",
  "timestamp": "YYYY-MM-DD",
  "description": "Detailed event description that specifically addresses the expansion focus",
  "templateType": "${selectedType}"
}`;
}

// Start expansion when run directly
const isRunDirectly = process.argv[1].endsWith('expand.js');
console.log('Is running directly:', isRunDirectly);

if (isRunDirectly) {
  console.log('Running directly...');
  const characterId = process.argv[2];
  if (!characterId) {
    console.error('Please provide a character ID');
    process.exit(1);
  }
  initialize().then(() => {
    runLoopManager(100, 10);
  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}