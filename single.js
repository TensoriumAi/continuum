import 'dotenv/config';
import fs from 'fs/promises';
import OpenAI from 'openai';
import graphology from 'graphology';

const currentCharacter = process.env.CHARACTER || "terrence";
let characterConfig;

// Calculate output directory based on character name
function getOutputDir(character) {
  return `./output/${character}`;
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
    await initializeGraph();
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

async function initializeGraph() {
  console.log('Initializing graph...');
  try {
    if (await fileExists(GRAPH_FILE)) {
      const data = await fs.readFile(GRAPH_FILE, 'utf8');
      graph = graphology.Graph.from(JSON.parse(data));
      console.log('Loaded existing graph');
      return;
    }

    console.log('Creating new graph...');
    graph = new graphology.Graph();

    // Load seed data from character-specific file
    const seedPath = `${characterConfig.outputDir}/seed.json`;
    if (await fileExists(seedPath)) {
      const seedData = JSON.parse(await fs.readFile(seedPath, 'utf8'));
      
      // Add nodes
      seedData.nodes.forEach(node => {
        graph.addNode(node.id, node);
      });

      // Add edges
      seedData.edges.forEach(edge => {
        graph.addEdge(edge.source, edge.target, edge);
      });

      console.log('Loaded seed data for character:', characterConfig.name);
    } else {
      console.log('No seed data found for character:', characterConfig.name);
      // Create a minimal starting point if no seed data exists
      graph.addNode('event1', {
        name: `${characterConfig.name}'s Origin`,
        timestamp: characterConfig.birthDate || new Date().toISOString().split('T')[0],
        description: `The beginning of ${characterConfig.name}'s journey.`,
        timeline: "main",
        expansion_prompt: "What were the early influences that shaped this story?"
      });
    }

    await saveGraph();
    console.log('Graph initialized successfully');
  } catch (error) {
    console.error('Failed to initialize graph:', error);
    throw error;
  }
}

async function saveGraph() {
  try {
    await fs.mkdir('./static', { recursive: true });
    
    const graphData = graph.export();
    await fs.writeFile(GRAPH_FILE, JSON.stringify(graphData, null, 2));
    console.log(`Graph saved to disk with ${graph.nodes().length} nodes`);
  } catch (error) {
    console.error('Error saving graph:', error);
    throw error;
  }
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
    const hasOutgoingEdges = graph.outNeighbors(node).length > 0;
    if (!hasOutgoingEdges && attributes.expansion_prompt) {
      nodes.push({ id: node, ...attributes });
    }
  });
  return nodes;
}

async function runExpansionLoop(iterations = 10) {
  await initializeGraph();
  
  let successfulIterations = 0;
  let currentIteration = 1;
  
  while (successfulIterations < iterations && currentIteration < iterations * 2) {
    console.log(`\n=== EXPANSION LOOP ${currentIteration}/${iterations} (${successfulIterations} successful) ===`);
    
    const unprocessedNodes = getUnprocessedNodes();
    console.log(`Found ${unprocessedNodes.length} unprocessed expansion prompts`);

    let expansionSuccess = false;
    
    for (const node of unprocessedNodes) {
      console.log(`\nProcessing expansion prompt for: ${node.name} (${node.timestamp})`);
      console.log(`Prompt: ${node.expansion_prompt}`);
      
      const success = await expandIteration(currentIteration, node.id);
      if (success) {
        expansionSuccess = true;
        console.log(`Successfully expanded node: ${node.id}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (expansionSuccess) {
      successfulIterations++;
    }
    
    currentIteration++;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add transformation logic between loops
    const currentState = getCurrentState();
    if (characterConfig.transformPrompt) {
      await transformTimeline(currentState.nodes, characterConfig.transformPrompt);
    } else {
      await findNewConnections(currentState.nodes);
    }
  }

  console.log('\nFinal Timeline State:');
  const finalState = {
    nodes: graph.nodes().map(node => ({
      id: node,
      ...graph.getNodeAttributes(node)
    })),
    edges: graph.edges().map(edge => ({
      id: edge,
      source: graph.source(edge),
      target: graph.target(edge),
      ...graph.getEdgeAttributes(edge)
    }))
  };
  
  console.log(JSON.stringify(finalState, null, 2));
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

let graph;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function generateExpansionPrompt(event) {
  // Legacy subject selection based on age
  function getLegacySubjects(age) {
    const subjects = {
      "Childhood": ["best friend", "favorite teacher", "neighborhood friend", "school rival"],
      "School": ["study partner", "roommate", "professor", "club member"],
      "Research": ["lab partner", "research advisor", "colleague", "collaborator"],
      "Personal": ["old friend", "mentor", "family member", "confidant"],
      "default": ["friend", "colleague", "acquaintance", "companion"]
    };

    // Define life stages by age
    const CHILDHOOD_END_AGE = 12;
    const YOUNG_ADULT_END_AGE = 25;

    if (age < CHILDHOOD_END_AGE) {
      return subjects.Childhood;
    } else if (age < YOUNG_ADULT_END_AGE) {
      return subjects.School;
    } else {
      return subjects.Research;
    }
  }

  // Calculate age if birthDate is available
  const age = characterConfig.birthDate ? 
    Math.floor((new Date(event.timestamp) - new Date(characterConfig.birthDate)) / (1000 * 60 * 60 * 24 * 365.25)) :
    null;

  let subjects = [];

  // If advanced character config is available, use it
  if (characterConfig.abilities || characterConfig.goals || characterConfig.challenges) {
    // Add abilities if available
    if (characterConfig.abilities) {
      subjects.push(...characterConfig.abilities);
    }

    // Add goals if available
    if (characterConfig.goals) {
      subjects.push(...characterConfig.goals);
    }

    // Add challenges if available
    if (characterConfig.challenges) {
      subjects.push(...characterConfig.challenges);
    }

    // Add context elements if available
    if (characterConfig.environment) subjects.push(characterConfig.environment);
    if (characterConfig.technology) subjects.push(characterConfig.technology);
    if (characterConfig.culture) subjects.push(characterConfig.culture);
  } else {
    // Use legacy subject selection
    subjects = getLegacySubjects(age);
  }

  // Select a random subject
  const subject = subjects[Math.floor(Math.random() * subjects.length)];

  // Get prompt templates
  const promptTypes = Object.keys(EXPANSION_PROMPT_TYPES);
  let selectedType;

  // If narrative style is defined, try to match it
  if (characterConfig.narrativeStyle) {
    selectedType = promptTypes.find(type => 
      type.toLowerCase().includes(characterConfig.narrativeStyle.toLowerCase())
    ) || promptTypes[0];
  } else {
    selectedType = promptTypes[Math.floor(Math.random() * promptTypes.length)];
  }

  const templates = EXPANSION_PROMPT_TYPES[selectedType].templates;
  const template = templates[Math.floor(Math.random() * templates.length)];

  return template.replace('${subject}', subject);
}

async function expandIteration(iterationNumber, nodeId = null) {
  console.log(`\nStarting iteration ${iterationNumber}${nodeId ? ` for node ${nodeId}` : ''}...`);
  
  const currentState = getCurrentState();
  
  if (nodeId) {
    const targetNode = currentState.nodes.find(n => n.id === nodeId);
    if (!targetNode) {
      console.error(`Node ${nodeId} not found`);
      return false;
    }
    currentState.targetNodeId = nodeId;
  }
  
  const prompt = generatePrompt(currentState);

  try {
    console.log('Requesting new event from LLM...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }]
    });

    console.log('\nContext being sent to LLM:');
    console.log('Node:', JSON.stringify(currentState.targetNodeId ? currentState.nodes.find(n => n.id === currentState.targetNodeId) : currentState.nodes[currentState.nodes.length - 1], null, 2));
    console.log('Prompt:', prompt);
    console.log('Iteration:', iterationNumber);
    // console.log('Full Context:', JSON.stringify({
    //   node: currentState.targetNodeId ? currentState.nodes.find(n => n.id === currentState.targetNodeId) : currentState.nodes[currentState.nodes.length - 1],
    //   prompt,
    //   iteration: iterationNumber,
    //   timelineCutoff: TIMELINE_CUTOFF_DATE,
    //   expansionPromptTypes: EXPANSION_PROMPT_TYPES
    // }, null, 2));

    const content = completion.choices[0].message.content;
    
    let newEvent;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        newEvent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError.message);
      console.log('Raw response:', content);
      console.log('Attempting to retry iteration...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await expandIteration(iterationNumber, nodeId);
    }

    console.log('Generated new event:', newEvent.name);

    const eventDate = new Date(newEvent.timestamp);
    if (eventDate > TIMELINE_CUTOFF_DATE) {
      console.log(`Skipping event: ${newEvent.name} (${newEvent.timestamp}) - beyond cutoff date of ${TIMELINE_CUTOFF_DATE.toISOString().split('T')[0]}`);
      return false;
    }

    const requiredFields = ['id', 'name', 'timestamp', 'description', 'expansion_prompt', 'connectedTo'];
    const missingFields = requiredFields.filter(field => !newEvent[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const connectedNode = currentState.nodes.find(n => n.id === newEvent.connectedTo);
    if (!connectedNode) {
      throw new Error(`Connected node ${newEvent.connectedTo} not found`);
    }

    const connectedDate = new Date(connectedNode.timestamp);
    const newEventDate = new Date(newEvent.timestamp);
    
    if (isNaN(connectedDate.getTime()) || isNaN(newEventDate.getTime())) {
      throw new Error('Invalid date format in timestamp');
    }

    const yearDiff = Math.abs(newEventDate.getFullYear() - connectedDate.getFullYear());

    if (yearDiff > 5) {
      throw new Error('Generated event outside of valid time window');
    }

    graph.addNode(newEvent.id, {
      name: newEvent.name,
      timestamp: newEvent.timestamp,
      description: newEvent.description,
      timeline: "main",
      expansion_prompt: newEvent.expansion_prompt
    });

    if (!graph.hasNode(newEvent.connectedTo)) {
      throw new Error(`Invalid connectedTo node: ${newEvent.connectedTo}`);
    }

    const sourceNodeId = currentState.targetNodeId || newEvent.connectedTo;
    graph.addEdge(sourceNodeId, newEvent.id, {
      type: 'CAUSES',
      description: "Generated connection"
    });

    await saveGraph();

    console.log('\nCurrent Timeline:');
    graph.forEachNode((node, attributes) => {
      console.log(`- ${attributes.timestamp}: ${attributes.name}`);
    });

    return true;

  } catch (error) {
    console.error('Error during iteration:', error.message);
    
    if (error.message.includes('JSON')) {
      console.log('JSON parsing error - will retry');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await expandIteration(iterationNumber, nodeId);
    }
    
    if (error.message === 'Generated event outside of valid time window') {
      console.log('Event timestamp outside of ±5 year window - will retry');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await expandIteration(iterationNumber, nodeId);
    }

    if (!error.retryCount || error.retryCount < 3) {
      console.log(`Retrying iteration (attempt ${(error.retryCount || 0) + 1}/3)...`);
      error.retryCount = (error.retryCount || 0) + 1;
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await expandIteration(iterationNumber, nodeId);
    }

    console.log('Max retries reached, skipping to next iteration');
    return false;
  }
}

function generatePrompt(currentState) {
  const targetNode = currentState.targetNodeId ? 
    currentState.nodes.find(n => n.id === currentState.targetNodeId) :
    currentState.nodes[currentState.nodes.length - 1];
    
  const expansionPrompt = targetNode.expansion_prompt || "What happened next?";
  
  const eventDate = new Date(targetNode.timestamp);
  const minDate = new Date(eventDate);
  const maxDate = new Date(eventDate);
  minDate.setFullYear(minDate.getFullYear() - 5);
  maxDate.setFullYear(maxDate.getFullYear() + 5);

  const relatedEvents = currentState.nodes.filter(node => {
    const nodeDate = new Date(node.timestamp);
    return nodeDate <= eventDate; 
  });

  relatedEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Build character context if advanced config is available
  let characterContext = '';
  if (characterConfig.type || characterConfig.biology || characterConfig.environment) {
    const elements = [];
    
    if (characterConfig.type && characterConfig.type !== 'human') {
      elements.push(`${characterConfig.name} is a ${characterConfig.type}`);
      if (characterConfig.physicalDescription) {
        elements.push(`described as ${characterConfig.physicalDescription}`);
      }
    }
    
    if (characterConfig.biology) elements.push(`with ${characterConfig.biology} biology`);
    if (characterConfig.environment) elements.push(`existing in ${characterConfig.environment}`);
    if (characterConfig.culture) elements.push(`within ${characterConfig.culture}`);
    if (characterConfig.technology) elements.push(`utilizing ${characterConfig.technology}`);

    if (elements.length > 0) {
      characterContext = `\nCharacter Context:\n${elements.join(' ')}\n`;
    }
  }

  return `${characterConfig.basePrompt}
${currentState.targetNodeId ? `Focus on expanding the event: "${targetNode.name}" (${targetNode.timestamp})` : ''}
${characterContext}

TEMPORAL CONTEXT:
Current event date: ${targetNode.timestamp}
Valid time window: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}
Timeline cutoff: ${characterConfig.timelineCutoff}

Current timeline context (chronological order):
${JSON.stringify(relatedEvents, null, 2)}

Based on the expansion prompt: "${expansionPrompt}"

Generate a new detail or perspective about events in this time period that aligns with the expansion prompt type. Your response should provide rich detail while maintaining consistency with established events and technological capabilities of the time.

Format as JSON with:
{
  "id": "event${currentState.nodes.length + 1}",
  "name": "Event name",
  "timestamp": "YYYY-MM-DD",
  "description": "Detailed description of this aspect or impact",
  "expansion_prompt": "${generateExpansionPrompt(targetNode)}",
  "connectedTo": "${targetNode.id}"
}

IMPORTANT CONSTRAINTS:
- The timestamp MUST be between ${minDate.toISOString().split('T')[0]} and ${maxDate.toISOString().split('T')[0]}
- NO EVENTS may occur after ${characterConfig.timelineCutoff}
- Events must respect the technological and scientific capabilities available at their timestamp
- Causal relationships must maintain temporal consistency
- Feel free to reference or connect to other events within the timeline`;
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
    model: "gpt-4o",
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
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }]
  });

  const content = completion.choices[0].message.content;
  console.log('Timeline transformation result:', content);
  return content;
}

initialize().then(() => {
  runLoopManager(100, 10);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});