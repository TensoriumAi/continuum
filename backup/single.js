import 'dotenv/config';
import Graph from 'graphology';
import fs from 'fs/promises';
import OpenAI from 'openai';

const GRAPH_FILE = './timeline_graph.json';
let graph;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize graph
async function initializeGraph() {
  console.log('Initializing graph...');
  try {
    const graphData = await fs.readFile(GRAPH_FILE, 'utf8');
    graph = Graph.from(JSON.parse(graphData));
    console.log('Loaded existing graph from disk');
  } catch (error) {
    console.log('No existing graph found, creating new one');
    graph = new Graph();
    
    // Modified initial nodes to reflect Terrence Howard's alternate timeline
    graph.addNode('event1', {
      name: "Terrence Howard's Mathematical Discovery",
      timestamp: "2010-03-15",
      description: "Terrence Howard develops his alternative mathematical framework '1 x 1 = 2' and begins secret experiments in quantum computing",
      timeline: "main"
    });

    graph.addNode('event2', {
      name: "Digital Consciousness Experiment",
      timestamp: "2015-08-23",
      description: "Howard successfully converts consciousness into digital format using quantum mathematics",
      timeline: "main"
    });

    graph.addEdge('event1', 'event2', {
      type: 'CAUSES',
      description: "Mathematical theories enable consciousness digitization"
    });

    await saveGraph();
  }
}

// Save graph to disk
async function saveGraph() {
  const graphData = graph.export();
  await fs.writeFile(GRAPH_FILE, JSON.stringify(graphData, null, 2));
  console.log('Graph saved to disk');
}

// Get current graph state
function getCurrentState() {
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

  return currentState;
}

// Generate LLM prompt
function generatePrompt(currentState) {
  return `
You are chronicling an alternate timeline where actor Terrence Howard's unconventional mathematical theories led to breakthrough discoveries, ultimately resulting in him becoming trapped in digital form inside a computer.

Current timeline state:
${JSON.stringify(currentState, null, 2)}

Generate the next significant event in this timeline. Consider the implications of his digital existence and how it affects both him and the digital world. Format as JSON with:
{
  "id": "event${currentState.nodes.length + 1}",
  "name": "Event name",
  "timestamp": "YYYY-MM-DD",
  "description": "Detailed description",
  "connectedTo": "${currentState.nodes[currentState.nodes.length - 1].id}"
}`;
}

// Single iteration of expansion
async function expandIteration(iterationNumber) {
  console.log(`\nStarting iteration ${iterationNumber}...`);
  
  const currentState = getCurrentState();
  const prompt = generatePrompt(currentState);

  try {
    console.log('Requesting new event from LLM...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    });

    const newEvent = JSON.parse(completion.choices[0].message.content);
    console.log('Generated new event:', newEvent.name);

    // Add new event to graph
    graph.addNode(newEvent.id, {
      name: newEvent.name,
      timestamp: newEvent.timestamp,
      description: newEvent.description,
      timeline: "main"
    });

    // Connect new event
    graph.addEdge(newEvent.connectedTo, newEvent.id, {
      type: 'CAUSES',
      description: "Generated connection"
    });

    // Save after each new event
    await saveGraph();

    // Print current timeline
    console.log('\nCurrent Timeline:');
    graph.forEachNode((node, attributes) => {
      console.log(`- ${attributes.timestamp}: ${attributes.name}`);
    });

    return true;
  } catch (error) {
    console.error('Error during iteration:', error);
    return false;
  }
}

// Main loop
async function runExpansionLoop(iterations = 10) {
  await initializeGraph();
  
  for (let i = 0; i < iterations; i++) {
    console.log(`\n=== EXPANSION LOOP ${i + 1}/${iterations} ===`);
    
    const success = await expandIteration(i + 1);
    if (!success) {
      console.log('Stopping due to error');
      break;
    }
    
    // Delay between iterations
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print final state
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

// Run the expansion with 10 iterations
runExpansionLoop(10); 