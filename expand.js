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
  const configPath = `${getOutputDir(character)}/config.json`;
  try {
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    // Add calculated output directory
    config.outputDir = getOutputDir(character);
    return config;
  } catch (error) {
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
    // Load character configuration
    characterConfig = await loadCharacterConfig(currentCharacter);
    console.log(`Loaded configuration for character: ${characterConfig.name}`);
    
    // Load and process expansion templates
    await loadExpansionTemplates();
    
    // Set file paths after config is loaded
    GRAPH_FILE = `${characterConfig.outputDir}/timeline_graph.json`;
    TIMELINE_CUTOFF_DATE = new Date(characterConfig.timelineCutoff);
    NARRATIVE_FILE = `${characterConfig.outputDir}/narrative.json`;
    NARRATIVE_MD_FILE = `${characterConfig.outputDir}/narrative.md`;
    
    // Ensure output directories exist
    await fs.mkdir(characterConfig.outputDir, { recursive: true });
    
    // Initialize graph
    await loadCharacter(currentCharacter);
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

async function runExpansionLoop(iterations = 10) {
  await loadCharacter(currentCharacter);
  
  let successfulIterations = 0;
  let currentIteration = 1;
  const batchTimestamp = Date.now();

  while (currentIteration <= iterations) {
    console.log(`\n=== EXPANSION LOOP ${currentIteration}/${iterations} (${successfulIterations} successful) ===`);

    // Get unprocessed expansion prompts
    const unprocessedNodes = [];
    graph.forEachNode((nodeId, attrs) => {
      if (attrs.expansion_prompt && !attrs.processed) {
        unprocessedNodes.push(nodeId);
      }
    });

    if (unprocessedNodes.length === 0) {
      console.log('No more unprocessed expansion prompts.');
      break;
    }

    console.log(`Found ${unprocessedNodes.length} unprocessed expansion prompts\n`);

    // Process each unprocessed node
    for (const nodeId of unprocessedNodes) {
      const nodeAttrs = graph.getNodeAttributes(nodeId);
      console.log(`Processing expansion prompt for: ${nodeAttrs.name}`);
      console.log(`Prompt: ${nodeAttrs.expansion_prompt}\n`);

      if (await expandIteration(currentIteration, nodeId)) {
        successfulIterations++;
        nodeAttrs.processed = true;
        console.log(`Successfully expanded node: ${nodeId}\n`);
      }
    }

    // Evaluate timeline after processing all nodes in this iteration
    await evaluateTimeline(currentIteration, batchTimestamp);
    
    // Generate narration every 10 iterations
    if (currentIteration % 10 === 0) {
      await generateNarrativeMarkdown(currentIteration);
    }

    currentIteration++;
  }

  console.log('\nExpansion complete!');
}

async function generateNarrativeMarkdown(loopCount) {
  const timestamp = new Date().toISOString();
  let markdown = `# ${characterConfig.name} Alternate Timeline - Loop ${loopCount}\n\n`;
  markdown += `Generated on ${timestamp}\n\n`;
  
  const nodes = graph.nodes().map(node => ({
    id: node,
    ...graph.getNodeAttributes(node)
  }));

  nodes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const eventsByYear = {};
  nodes.forEach(node => {
    const year = new Date(node.timestamp).getFullYear();
    if (!eventsByYear[year]) {
      eventsByYear[year] = [];
    }
    eventsByYear[year].push(node);
  });

  markdown += `## Timeline Overview\n\n`;

  Object.keys(eventsByYear).sort().forEach(year => {
    markdown += `### ${year}\n\n`;
    eventsByYear[year].forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
      });
      markdown += `#### ${date} - ${event.name}\n\n`;
      markdown += `${event.description}\n\n`;
      
      const outEdges = graph.outEdges(event.id);
      if (outEdges.length > 0) {
        markdown += `*Led to:*\n`;
        outEdges.forEach(edge => {
          const targetNode = graph.getNodeAttributes(graph.target(edge));
          markdown += `- ${targetNode.name}\n`;
        });
        markdown += '\n';
      }

      const inEdges = graph.inEdges(event.id);
      if (inEdges.length > 0) {
        markdown += `*Influenced by:*\n`;
        inEdges.forEach(edge => {
          const sourceNode = graph.getNodeAttributes(graph.source(edge));
          markdown += `- ${sourceNode.name}\n`;
        });
        markdown += '\n';
      }
    });
  });

  const outputBase = `${characterConfig.outputDir}/narrative.loop${loopCount}`;
  await fs.writeFile(`${outputBase}.md`, markdown);
  console.log(`\nNarrative saved to ${outputBase}.md`);
}

async function runLoopManager(totalLoops = 100, loopsPerNarrative = 10) {
  let currentLoop = 0;

  while (currentLoop < totalLoops) {
    console.log(`\n=== Starting Loop Set ${Math.floor(currentLoop / loopsPerNarrative) + 1} ===\n`);
    
    await runExpansionLoop(loopsPerNarrative);
    
    currentLoop += loopsPerNarrative;
    await generateNarrativeMarkdown(currentLoop);
    
    console.log(`\nCompleted ${currentLoop}/${totalLoops} total loops`);
    console.log(`\nStarting next set of ${loopsPerNarrative} loops...\n`);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

async function evaluateTimeline(iterationNumber, batchTimestamp) {
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

  const timelineContext = timelineNodes.map(node => 
    `## ${node.name}\n**Time**: ${node.timestamp}\n\n${node.description}\n`
  ).join('\n\n');

  const connections = [];
  graph.forEachEdge((edge, attrs, source, target) => {
    connections.push(`${source} -> ${target} (${attrs.type})`);
  });

  const prompt = `Analyze this timeline for paradoxes, ambiguities, and conflicts:

Timeline Events (chronological order):
${timelineContext}

Connections:
${connections.join('\n')}

Consider:
1. Temporal consistency and causality
2. Character development and relationships
3. Setting and environmental consistency
4. Logical progression of events
5. Internal consistency of facts and details

Identify any:
- Temporal paradoxes
- Contradicting facts
- Ambiguous relationships
- Unclear cause-effect chains
- Missing context
- Inconsistent character traits

Format your response in markdown with clear sections for each type of issue found.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 1000
  });

  const evaluation = completion.choices[0].message.content;
  const evalPath = path.join(characterConfig.outputDir, `eval_iteration${iterationNumber}_${batchTimestamp}.md`);
  await fs.writeFile(evalPath, evaluation);
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
**Description**: ${characterConfig.physicalDescription}
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

  const narrationPath = path.join(characterConfig.outputDir, 'narration.md');
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
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    await fs.appendFile(logPath, `\nAI Response:\n${response}\n`);

    try {
      const parsedEvent = JSON.parse(response);
      await fs.appendFile(logPath, `\nParsed Event:\n${JSON.stringify(parsedEvent, null, 2)}\n`);

      // Add event to graph
      const eventId = parsedEvent.id;
      graph.addNode(eventId, {
        name: parsedEvent.name,
        timestamp: parsedEvent.timestamp,
        description: parsedEvent.description,
        timeline: "main",
        expansion_prompt: `What were the key moments and details surrounding ${parsedEvent.name}? Consider the lead-up to this event, the people involved, and its immediate aftermath. How did this event change ${characterConfig.name}'s path?`
      });

      // Add edge to graph
      if (parsedEvent.connectedTo && parsedEvent.connectionType) {
        graph.addEdge(parsedEvent.connectedTo, eventId, {
          type: parsedEvent.connectionType
        });
      }

      // Save graph after adding new event
      await saveGraph();

      await fs.appendFile(logPath, `\nAdded Event to Graph: ${eventId}\n`);
      
      return true;
    } catch (parseError) {
      await fs.appendFile(logPath, `\nError parsing event: ${parseError}\n`);
      return false;
    }
  } catch (error) {
    console.error('Error during iteration:', error);
    return false;
  }
}

function addEventToGraph(event) {
  const eventId = event.id;
  graph.addNode(eventId, {
    name: event.name,
    timestamp: event.timestamp,
    description: event.description,
    timeline: "main",
    expansion_prompt: `What were the key moments and details surrounding ${event.name}? Consider the lead-up to this event, the people involved, and its immediate aftermath. How did this event change ${characterConfig.name}'s path?`
  });

  // Add edge from source to new event
  graph.addEdge(event.connectedTo, eventId, {
    type: event.connectionType || "sequence"
  });

  return eventId;
}

async function findNewConnections(nodes) {
  console.log('\nFinding new connections between nodes...');
  const prompt = `Given these timeline events, identify any potential NEW connections or relationships between them that aren't already captured. Focus on discovering non-obvious cause-and-effect relationships, thematic links, or parallel developments that might have been missed. Each connection should provide unique insight.

Return the connections in this JSON format:
  {
    "connections": [
      {
        "from": "event_id_1",
        "to": "event_id_2",
        "relationship": "description of how they are connected"
      }
    ]
  }
  
Existing events:
${nodes.map(n => `- ${n.timestamp}: ${n.name} (id: ${n.id})\n${n.description}`).join('\n\n')}

Existing connections:
${graph.edges().map(e => {
  const edge = graph.getEdgeAttributes(e);
  const source = graph.getNodeAttributes(graph.source(e));
  const target = graph.getNodeAttributes(graph.target(e));
  return `- ${source.name} -> ${target.name}: ${edge.description}`;
}).join('\n')}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }]
  });

  const content = completion.choices[0].message.content;
  console.log('New connections identified:', content);
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const connections = JSON.parse(jsonMatch[0]);
      if (connections.connections) {
        for (const conn of connections.connections) {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (fromNode && toNode) {
            // Check if edge already exists
            if (!graph.hasEdge(conn.from, conn.to)) {
              // Add edge to the graph
              graph.addEdge(conn.from, conn.to, {
                type: 'CAUSES',
                description: conn.relationship
              });
              await saveGraph();
              console.log(`Added edge: ${fromNode.name} -> ${toNode.name} (${conn.relationship})`);
            } else {
              console.log(`Edge already exists between ${fromNode.name} and ${toNode.name}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing connections:', error);
  }
  
  return content;
}

async function transformTimeline(nodes, transformPrompt) {
  console.log('\nTransforming timeline with prompt:', transformPrompt);
  const prompt = `Current timeline events:\n\n${nodes.map(n => `- ${n.timestamp}: ${n.name}\n${n.description}`).join('\n\n')}\n\nTransformation request: ${transformPrompt}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }]
  });

  const content = completion.choices[0].message.content;
  console.log('Timeline transformation result:', content);
  return content;
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
      description: attrs.description
    });
  });
  
  timelineNodes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const timelineContext = `\nTimeline Context (chronological order):
${timelineNodes.map(node => `- [${node.key}] ${node.timestamp}: ${node.name}`).join('\n')}`;

  // Get connections context
  const connections = [];
  graph.forEachEdge((edge, attrs, source, target) => {
    connections.push(`${source} -> ${target} (${attrs.type})`);
  });

  const connectionsContext = `\nExisting Connections:
${connections.join('\n')}`;

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
Expansion Prompt: ${nodeAttributes.expansion_prompt}

Generate a new event that logically follows from this event. The event should:
1. Be temporally consistent (happen after ${nodeAttributes.timestamp})
2. Not contradict known history or character traits
3. Provide rich detail about what happened
4. Include specific names, places, and consequences
5. Maintain consistency with the character's established timeline

Return ONLY a JSON object in this exact format (no other text):
{
  "id": "event${Date.now()}",
  "name": "Brief, specific title",
  "timestamp": "YYYY-MM-DD",
  "description": "Detailed description",
  "connectedTo": "${nodeKey}",
  "connectionType": "sequence"
}`;
  }

  // If we're generating a new root event
  return `You are expanding the timeline for ${characterName}.
${characterContext}
${timelineContext}
${connectionsContext}

Generate a new foundational event in the character's timeline. The event should:
1. Be temporally consistent with their known history
2. Not contradict known facts or character traits
3. Provide rich detail about what happened
4. Include specific names, places, and consequences
5. Help establish the character's background

Return ONLY a JSON object in this exact format (no other text):
{
  "id": "event${Date.now()}",
  "name": "Brief, specific title",
  "timestamp": "YYYY-MM-DD",
  "description": "Detailed description",
  "connectedTo": "birth",
  "connectionType": "sequence"
}`;
}

// Start expansion when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
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