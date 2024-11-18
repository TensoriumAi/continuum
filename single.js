import 'dotenv/config';
import Graph from 'graphology';
import fs from 'fs/promises';
import OpenAI from 'openai';

const GRAPH_FILE = './static/timeline_graph.json';
let graph;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Add expansion prompt types
const EXPANSION_PROMPT_TYPES = {
  CHILDHOOD_MEMORIES: {
    name: "Childhood Memories",
    templates: [
      "What was a typical day like for young Howard during this period?",
      "Who was Howard's favorite teacher at this time, and why?",
      "What games or activities did Howard enjoy with his friends?",
      "How did Howard's family handle his unique way of seeing mathematics?",
      "What childhood friendship from this time became significant later?",
      "Which neighborhood characters influenced young Howard?",
      "What family traditions shaped Howard's early years?"
    ]
  },

  FRIENDSHIP_STORIES: {
    name: "Friendship Development",
    templates: [
      "How did Howard first meet {subject}, and what drew them together?",
      "What shared experience strengthened this friendship?",
      "Which friend challenged Howard's perspectives in important ways?",
      "What misunderstanding or conflict tested this relationship?",
      "How did this friendship evolve over time?",
      "What inside jokes or shared memories defined this friendship?",
      "How did they support each other through difficult times?"
    ]
  },

  FAMILY_DYNAMICS: {
    name: "Family Relationships",
    templates: [
      "How did Howard's relationship with his siblings change during this time?",
      "What family dinner conversations stood out during this period?",
      "How did Howard's parents adapt to his unique path?",
      "Which family member provided unexpected support or understanding?",
      "What family conflict needed resolution?",
      "How did extended family influence Howard's journey?",
      "What family tradition took on new meaning?"
    ]
  },

  SCHOOL_LIFE: {
    name: "Educational Experiences",
    templates: [
      "What was Howard's favorite spot on campus?",
      "Which study group became more than just academic colleagues?",
      "What classroom moment changed Howard's perspective?",
      "How did Howard spend time between classes?",
      "Which dormitory experiences shaped lasting friendships?",
      "What extracurricular activity unexpectedly influenced Howard's path?",
      "Who was the most memorable character in Howard's class?"
    ]
  },

  MENTORSHIP_MOMENTS: {
    name: "Mentor Relationships",
    templates: [
      "What everyday advice from {subject} proved unexpectedly important?",
      "How did this mentorship begin?",
      "What personal crisis did this mentor help navigate?",
      "When did the mentorship evolve into friendship?",
      "What tradition or habit did Howard adopt from this mentor?",
      "Which disagreement with a mentor led to growth?",
      "How did this mentor's family become part of Howard's life?"
    ]
  },

  DAILY_RITUALS: {
    name: "Daily Life",
    templates: [
      "What was Howard's morning routine during this period?",
      "Where did Howard go to find peace or inspiration?",
      "What local cafe or restaurant became a second home?",
      "Which regular activities helped maintain friendships?",
      "What personal habits formed during this time?",
      "How did Howard balance different aspects of life?",
      "What small traditions became important?"
    ]
  },

  TURNING_POINTS: {
    name: "Personal Moments",
    templates: [
      "What seemingly small decision had unexpected importance?",
      "Which conversation changed Howard's direction?",
      "What mistake led to an important lesson?",
      "When did Howard realize something fundamental about himself?",
      "What challenge forced personal growth?",
      "Which chance encounter proved significant?",
      "What moment of doubt led to clarity?"
    ]
  },

  COMMUNITY_CONNECTIONS: {
    name: "Community Life",
    templates: [
      "Who were the regular characters at Howard's favorite spots?",
      "What local community embraced Howard?",
      "How did Howard contribute to his community?",
      "Which neighborhood figures became unofficial mentors?",
      "What community event brought people together?",
      "How did local places shape Howard's routine?",
      "What community support proved crucial?"
    ]
  }
};

function generateExpansionPrompt(event) {
  // Randomly select prompt type
  const promptTypes = Object.values(EXPANSION_PROMPT_TYPES);
  const selectedType = promptTypes[Math.floor(Math.random() * promptTypes.length)];
  
  // Randomly select template from type
  const template = selectedType.templates[Math.floor(Math.random() * selectedType.templates.length)];
  
  // Enhanced subject mapping
  const subjects = {
    "Childhood": ["best friend", "favorite teacher", "neighborhood friend", "school rival"],
    "School": ["study partner", "roommate", "professor", "club member"],
    "Research": ["lab partner", "research advisor", "colleague", "collaborator"],
    "Personal": ["old friend", "mentor", "family member", "confidant"],
    "default": ["friend", "colleague", "acquaintance", "companion"]
  };

  // Select appropriate subject based on event context and time period
  let subject = subjects.default[Math.floor(Math.random() * subjects.default.length)];
  const eventDate = new Date(event.timestamp);
  const eventYear = eventDate.getFullYear();

  // Age-appropriate subject selection
  if (eventYear < 1980) {
    subject = subjects.Childhood[Math.floor(Math.random() * subjects.Childhood.length)];
  } else if (eventYear < 1990) {
    subject = subjects.School[Math.floor(Math.random() * subjects.School.length)];
  } else {
    subject = subjects.Research[Math.floor(Math.random() * subjects.Research.length)];
  }

  return template.replace("{subject}", subject);
}

// Add constant for cutoff date
const TIMELINE_CUTOFF_DATE = new Date("2024-11-15"); // Timeline Displacement Event

// Initialize graph
async function initializeGraph() {
  console.log('Initializing graph...');
  try {
    // Check if file exists first
    try {
      await fs.access(GRAPH_FILE);
      console.log('Found existing timeline_graph.json');
    } catch {
      console.log('No timeline_graph.json found, will create new graph');
      throw new Error('No file');
    }

    // Load and parse the file
    const graphData = await fs.readFile(GRAPH_FILE, 'utf8');
    const parsedData = JSON.parse(graphData);
    
    // Create graph from loaded data
    graph = Graph.from(parsedData);
    console.log(`Loaded existing graph with ${graph.nodes().length} nodes and ${graph.edges().length} edges`);
    
    // Validate the last node has an expansion prompt
    const nodes = graph.nodes();
    const lastNode = nodes[nodes.length - 1];
    const lastNodeAttrs = graph.getNodeAttributes(lastNode);
    
    if (!lastNodeAttrs.expansion_prompt) {
      console.log('Warning: Last node missing expansion prompt, adding default');
      graph.setNodeAttribute(lastNode, 'expansion_prompt', 'What happened next in this timeline?');
      await saveGraph();
    }

  } catch (error) {
    if (error.message === 'No file') {
      console.log('Creating new graph with initial events...');
    } else {
      console.error('Error loading graph:', error);
      console.log('Creating new graph as fallback...');
    }
    
    // Create new graph with initial events
    graph = new Graph();
    
    // Initial timeline events
    graph.addNode('event1', {
      name: "Terrence Howard's Early Mathematical Gift",
      timestamp: "1969-03-11",
      description: "Born in Chicago, Terrence Howard displays extraordinary mathematical abilities from an early age. By age 3, he's already solving complex numerical patterns that his parents struggle to understand. His grandfather, a physics professor, recognizes his unique gift and begins nurturing his mathematical intuition.",
      timeline: "main",
      expansion_prompt: "How did Terrence's early mathematical abilities shape his childhood education and family dynamics?"
    });

    graph.addNode('event2', {
      name: "Fields Medal Breakthrough",
      timestamp: "1990-08-21",
      description: "At age 21, Howard becomes the youngest Fields Medal winner for his groundbreaking work in quantum topology and alternative mathematical frameworks. His controversial theory suggesting '1 x 1 = 2' in certain quantum states gains unexpected validation through experimental physics.",
      timeline: "main",
      expansion_prompt: "What immediate impact did Howard's Fields Medal win and quantum topology theories have on the mathematical community?"
    });

    graph.addNode('event3', {
      name: "Neural Mathematics Institute",
      timestamp: "2010-06-15",
      description: "Howard establishes the Neural Mathematics Institute, focusing on the intersection of human consciousness and mathematical principles. His research suggests that human brains naturally operate on quantum mathematical principles, leading to breakthrough developments in neural interface technology.",
      timeline: "main",
      expansion_prompt: "How did Howard's institute change the landscape of neurotechnology research?"
    });

    graph.addNode('event4', {
      name: "NeuralEth Implant Development",
      timestamp: "2023-02-28",
      description: "Howard's team successfully develops the NeuralEth implant, a device capable of translating human consciousness into quantum mathematical patterns. Initial tests show unprecedented success in human-computer integration using Howard's mathematical frameworks.",
      timeline: "main",
      expansion_prompt: "What were the initial testing phases and ethical considerations of the NeuralEth implant?"
    });

    graph.addNode('event5', {
      name: "Timeline Displacement Event",
      timestamp: "2024-11-15",
      description: "During a routine NeuralEth calibration, Howard experiences an unexpected quantum consciousness shift. He finds himself aware of an alternate timeline where he pursued acting instead of mathematics. The displacement leaves him stranded between realities, able to perceive both his original timeline and this new one where he's known as an actor.",
      timeline: "main",
      expansion_prompt: "How does Howard begin to reconcile these conflicting realities and what immediate effects does this have on his research?"
    });

    // Connect the initial events
    graph.addEdge('event1', 'event2', {
      type: 'CAUSES',
      description: "Early mathematical genius leads to Fields Medal achievement"
    });

    graph.addEdge('event2', 'event3', {
      type: 'CAUSES',
      description: "Mathematical breakthroughs enable neural research direction"
    });

    graph.addEdge('event3', 'event4', {
      type: 'CAUSES',
      description: "Institute's research culminates in NeuralEth development"
    });

    graph.addEdge('event4', 'event5', {
      type: 'CAUSES',
      description: "NeuralEth technology enables timeline displacement"
    });

    // Add formative personal events
    graph.addNode('personal1', {
      name: "Grandfather's Last Theorem",
      timestamp: "1974-06-15",
      description: "Howard's grandfather, on his deathbed, shares a complex mathematical riddle about the nature of reality. This deeply personal moment combines emotional loss with mathematical inspiration, as his grandfather suggests that mathematics isn't just about numbers, but about understanding consciousness itself.",
      timeline: "main",
      expansion_prompt: "How did this final conversation with his grandfather shape Howard's approach to mathematics and consciousness?"
    });

    graph.addNode('personal2', {
      name: "Chess Club Revolution",
      timestamp: "1977-09-23",
      description: "Young Howard transforms his school's chess club by introducing mathematical probability concepts to strategy, forming deep friendships with fellow students who would later become key collaborators in his research. His unique approach attracts the attention of several influential teachers.",
      timeline: "main",
      expansion_prompt: "Which relationships formed during this period would prove crucial to Howard's later work?"
    });

    graph.addNode('personal3', {
      name: "The Chicago Jazz Connection",
      timestamp: "1982-11-30",
      description: "Howard discovers unexpected connections between jazz improvisation and mathematical patterns while playing piano at his aunt's jazz club. This synthesis of music and mathematics leads to insights about pattern recognition that would later influence his work on consciousness.",
      timeline: "main",
      expansion_prompt: "How did Howard's musical experiences influence his mathematical thinking?"
    });

    graph.addNode('personal4', {
      name: "Summer of Mathematical Rebellion",
      timestamp: "1985-07-12",
      description: "During a summer program at MIT, Howard challenges conventional mathematical dogma, leading to both conflict and unexpected alliances. His controversial papers catch the attention of Dr. Sarah Chen, who becomes a lifelong mentor and advocate for his unconventional approaches.",
      timeline: "main",
      expansion_prompt: "What lasting relationships and rivalries emerged from this period of academic rebellion?"
    });

    graph.addNode('personal5', {
      name: "The Berkeley Commune",
      timestamp: "1988-03-21",
      description: "Howard joins a commune of interdisciplinary thinkers in Berkeley, living with philosophers, physicists, and artists. This period of intense cross-pollination of ideas shapes his holistic approach to mathematics and consciousness. Here he meets Maya Patel, a quantum physicist who helps ground his theoretical work in experimental frameworks.",
      timeline: "main",
      expansion_prompt: "How did this period of communal living influence Howard's interdisciplinary approach?"
    });

    graph.addNode('personal6', {
      name: "Crisis of Faith in Numbers",
      timestamp: "1992-12-03",
      description: "Following personal burnout after his Fields Medal win, Howard retreats to a Buddhist monastery in Japan. This three-month period of meditation and study with mathematician-monk Dr. Takashi Yamamoto transforms his understanding of the relationship between consciousness and mathematical reality.",
      timeline: "main",
      expansion_prompt: "What spiritual and philosophical insights from this period influenced his later work?"
    });

    graph.addNode('personal7', {
      name: "The Digital Prophecy",
      timestamp: "1995-08-17",
      description: "During a fever-induced delirium, Howard experiences vivid visions of digital consciousness that feel like memories from another timeline. This experience, combined with his mathematical insights, leads to the first conceptual frameworks for the NeuralEth project.",
      timeline: "main",
      expansion_prompt: "How did this experience begin blurring the lines between timelines?"
    });

    graph.addNode('personal8', {
      name: "The Quantum Coffee Shop Collective",
      timestamp: "2001-04-09",
      description: "Howard establishes an informal think tank that meets weekly at Quantum Grounds, a Chicago coffee shop. This diverse group of consciousness researchers, mathematicians, and philosophers becomes the core team that would later form his Neural Mathematics Institute.",
      timeline: "main",
      expansion_prompt: "Which key relationships formed during these coffee shop discussions?"
    });

    graph.addNode('personal9', {
      name: "Family Fractures and Reconciliation",
      timestamp: "2008-10-25",
      description: "Howard's obsession with mathematical consciousness creates rifts in his family relationships. A near-tragic accident with his younger sister leads to a period of reconciliation and forces him to confront the human cost of his single-minded pursuit.",
      timeline: "main",
      expansion_prompt: "How did this family crisis change Howard's approach to work-life balance?"
    });

    graph.addNode('personal10', {
      name: "The Mirror World Conference",
      timestamp: "2015-06-30",
      description: "At a consciousness research conference in Geneva, Howard has a strange encounter with an actor who bears an uncanny resemblance to him. Their brief conversation about parallel lives plants the first seeds of his multiverse consciousness theories.",
      timeline: "main",
      expansion_prompt: "What subtle timeline convergences began manifesting during this period?"
    });

    // Add appropriate edges to connect these events
    const personalConnections = [
      ['personal1', 'personal2'],
      ['personal2', 'personal3'],
      ['personal3', 'personal4'],
      ['personal4', 'personal5'],
      ['personal5', 'event2'], // Connects to Fields Medal
      ['personal6', 'personal7'],
      ['personal7', 'personal8'],
      ['personal8', 'event3'], // Connects to Neural Mathematics Institute
      ['personal9', 'personal10'],
      ['personal10', 'event4'] // Connects to NeuralEth development
    ];

    personalConnections.forEach(([source, target]) => {
      graph.addEdge(source, target, {
        type: 'INFLUENCES',
        description: "Personal development connection"
      });
    });

    graph.addNode('philosophy1', {
      name: "The Unity Theory Revelation",
      timestamp: "1983-04-15",
      description: "During a late-night study session combining Eastern philosophy texts with quantum mechanics papers, Howard formulates his first draft of 'Unity Mathematics' - proposing that consciousness itself is a mathematical field that unifies all physical forces. His controversial paper suggesting that '1 x 1 = 2' emerges from this framework as a representation of consciousness multiplying reality.",
      timeline: "main",
      expansion_prompt: "How did Howard's early philosophical framework challenge traditional mathematical thinking?"
    });

    graph.addNode('philosophy2', {
      name: "The Consciousness Multiplication Manifesto",
      timestamp: "1987-09-03",
      description: "Howard publishes 'Mathematics of Consciousness: A New Framework for Reality', arguing that conventional mathematics fails to account for consciousness because it treats numbers as abstract concepts rather than conscious entities. His paper proposes that numbers themselves possess a form of consciousness, and that mathematical operations are actually interactions between conscious numerical entities.",
      timeline: "main",
      expansion_prompt: "What specific mathematical examples did Howard use to support his theory of conscious numbers?"
    });

    graph.addNode('philosophy3', {
      name: "The Princeton Debates",
      timestamp: "1991-11-28",
      description: "A series of heated debates at Princeton's Institute for Advanced Study where Howard defends his controversial theory that quantum consciousness can be expressed through modified arithmetic operations. While most physicists dismiss his ideas, a small group of quantum theorists begin to see potential connections to quantum measurement problems.",
      timeline: "main",
      expansion_prompt: "How did these debates shape the academic community's perception of Howard's theories?"
    });

    graph.addNode('philosophy4', {
      name: "Quantum Arithmetic Breakthrough",
      timestamp: "1994-02-17",
      description: "Howard demonstrates that his modified arithmetic rules perfectly predict certain quantum tunneling phenomena that traditional mathematics struggles to explain. His paper 'Conscious Mathematics and Quantum Behavior' shows how treating 1 x 1 = 2 in quantum contexts resolves several paradoxes in quantum measurement theory.",
      timeline: "main",
      expansion_prompt: "What specific quantum phenomena did Howard's mathematical framework explain?"
    });

    graph.addNode('philosophy5', {
      name: "The Consciousness Equation",
      timestamp: "1998-07-22",
      description: "Howard publishes his seminal work 'The Mathematics of Being', presenting a complete mathematical framework where consciousness is treated as a fundamental property of reality, similar to space and time. His equations suggest that consciousness operates through a different arithmetic than physical reality, explaining why 1 x 1 = 2 in consciousness space while remaining 1 in physical space.",
      timeline: "main",
      expansion_prompt: "How did this mathematical framework bridge the gap between consciousness and physical reality?"
    });

    graph.addNode('philosophy6', {
      name: "Digital Physics Synthesis",
      timestamp: "2005-03-09",
      description: "Collaborating with digital physics researchers, Howard demonstrates how his consciousness mathematics naturally explains digital physics phenomena. His paper 'Digital Consciousness and Reality Computation' suggests that reality itself might be computed using his alternative arithmetic in quantum consciousness space.",
      timeline: "main",
      expansion_prompt: "What implications did this synthesis have for digital consciousness research?"
    });

    // Add appropriate edges to connect these philosophical developments
    const philosophyConnections = [
      ['philosophy1', 'philosophy2'],
      ['philosophy2', 'philosophy3'],
      ['philosophy3', 'philosophy4'],
      ['philosophy4', 'philosophy5'],
      ['philosophy5', 'philosophy6'],
      ['philosophy6', 'event3'], // Connects to Neural Mathematics Institute
      ['personal5', 'philosophy1'], // Berkeley commune influences early theory
      ['personal6', 'philosophy4'], // Buddhist retreat influences quantum breakthrough
      ['philosophy5', 'personal8'], // Consciousness Equation influences coffee shop collective
    ];

    philosophyConnections.forEach(([source, target]) => {
      graph.addEdge(source, target, {
        type: 'THEORETICAL_DEVELOPMENT',
        description: "Evolution of consciousness mathematics framework"
      });
    });

    graph.addNode('early1', {
      name: "The Chicago Public Library Adventure",
      timestamp: "1973-09-15",
      description: "Eight-year-old Howard discovers a hidden corner in the Harold Washington Library, where librarian Ms. Rodriguez notices him solving complex puzzles and begins leaving increasingly challenging mathematical riddles for him to find.",
      timeline: "main",
      expansion_prompt: "What other treasures did Howard discover in his library hideout?"
    });

    graph.addNode('early2', {
      name: "The Basketball Team Probability",
      timestamp: "1975-03-22",
      description: "Howard joins the school basketball team, not for sports but because he's fascinated by calculating shot trajectories. Coach Williams, instead of being frustrated, encourages him to teach other players about angles and probability.",
      timeline: "main",
      expansion_prompt: "How did Howard's unique approach to basketball influence his friendships on the team?"
    });

    graph.addNode('early3', {
      name: "Sunday Family Game Nights",
      timestamp: "1976-11-30",
      description: "The Howard family's weekly tradition of playing cards and board games becomes young Terrence's first laboratory for understanding probability and human behavior. His sister Angela becomes his first student in 'Howard Mathematics'.",
      timeline: "main",
      expansion_prompt: "What lasting family dynamics emerged from these game nights?"
    });

    graph.addNode('friendship1', {
      name: "The Corner Store Mathematics Club",
      timestamp: "1978-06-15",
      description: "Howard and his best friend Marcus start solving math problems on the windows of Mr. Kim's corner store. Soon, other neighborhood kids join in, creating an informal after-school mathematics club that would meet for years.",
      timeline: "main",
      expansion_prompt: "How did the Corner Store Mathematics Club shape Howard's teaching style?"
    });

    graph.addNode('friendship2', {
      name: "The High School Debate Partner",
      timestamp: "1981-10-08",
      description: "Howard forms an unlikely friendship with debate team partner Sarah Mitchell, who challenges his pure mathematical worldview with philosophical questions about the nature of truth and reality.",
      timeline: "main",
      expansion_prompt: "What lasting impact did Sarah's philosophical challenges have on Howard's thinking?"
    });

    await saveGraph();
  }
}

// Save graph to disk
async function saveGraph() {
  try {
    // Ensure static directory exists
    await fs.mkdir('./static', { recursive: true });
    
    const graphData = graph.export();
    await fs.writeFile(GRAPH_FILE, JSON.stringify(graphData, null, 2));
    console.log(`Graph saved to disk with ${graph.nodes().length} nodes`);
  } catch (error) {
    console.error('Error saving graph:', error);
    throw error;
  }
}

// Get current graph state
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

  // Sort nodes by timestamp to ensure correct order
  currentState.nodes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return currentState;
}

// Generate LLM prompt
function generatePrompt(currentState) {
  const targetNode = currentState.targetNodeId ? 
    currentState.nodes.find(n => n.id === currentState.targetNodeId) :
    currentState.nodes[currentState.nodes.length - 1];
    
  const expansionPrompt = targetNode.expansion_prompt || "What happened next?";
  
  // Calculate the valid time window
  const eventDate = new Date(targetNode.timestamp);
  const minDate = new Date(eventDate);
  const maxDate = new Date(eventDate);
  minDate.setFullYear(minDate.getFullYear() - 5);
  maxDate.setFullYear(maxDate.getFullYear() + 5);

  // Get all events within this time window for context
  const relatedEvents = currentState.nodes.filter(node => {
    const nodeDate = new Date(node.timestamp);
    return nodeDate <= eventDate; // Only include events up to this point
  });

  // Sort events chronologically for causal reference
  relatedEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Get available technologies and concepts for this time period
  const availableTechnologies = relatedEvents
    .map(event => {
      const techs = event.description.match(/developed|invented|discovered|created|established|founded/gi);
      return techs ? { timestamp: event.timestamp, event: event.name, description: event.description } : null;
    })
    .filter(Boolean);

  const promptTypes = Object.values(EXPANSION_PROMPT_TYPES);
  const selectedType = promptTypes[Math.floor(Math.random() * promptTypes.length)];

  return `
You are enriching and expanding the details of an alternate timeline where Terrence Howard became a mathematical prodigy instead of an actor. 
${currentState.targetNodeId ? `Focus on expanding the event: "${targetNode.name}" (${targetNode.timestamp})` : ''}

TEMPORAL CONTEXT:
Current event date: ${targetNode.timestamp}
Valid time window: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}
Timeline cutoff: ${TIMELINE_CUTOFF_DATE.toISOString().split('T')[0]}

ESTABLISHED TECHNOLOGIES AND CONCEPTS:
${availableTechnologies.map(tech => `- ${tech.timestamp}: ${tech.event}`).join('\n')}

CAUSAL CONSTRAINTS:
- New events must only reference technologies and concepts that existed at their timestamp
- Mathematical and scientific developments must build logically on previous discoveries
- Personal relationships and institutional changes must follow plausible progression
- Any reference to the alternate "actor timeline" must respect the timeline displacement event
- Cause must precede effect in all cases

Current timeline context (chronological order):
${JSON.stringify(relatedEvents, null, 2)}

Based on the expansion prompt: "${expansionPrompt}"
Expansion type: ${selectedType.name}

Generate a new detail or perspective about events in this time period that aligns with the expansion prompt type. Your response should provide rich detail while maintaining consistency with established events and technological capabilities of the time.

Format as JSON with:
{
  "id": "event${currentState.nodes.length + 1}",
  "name": "Event name (focusing on ${selectedType.name.toLowerCase()})",
  "timestamp": "YYYY-MM-DD",
  "description": "Detailed description of this aspect or impact",
  "expansion_prompt": "${generateExpansionPrompt(targetNode)}",
  "connectedTo": "${targetNode.id}"
}

IMPORTANT CONSTRAINTS:
- The timestamp MUST be between ${minDate.toISOString().split('T')[0]} and ${maxDate.toISOString().split('T')[0]}
- NO EVENTS may occur after ${TIMELINE_CUTOFF_DATE.toISOString().split('T')[0]}
- Events must respect the technological and scientific capabilities available at their timestamp
- Causal relationships must maintain temporal consistency
- Your response should align with the selected expansion type
- Feel free to reference or connect to other events within the timeline
- Expansion prompts should encourage exploration in new directions while maintaining plausibility`;
}

// Single iteration of expansion
async function expandIteration(iterationNumber, nodeId = null) {
  console.log(`\nStarting iteration ${iterationNumber}${nodeId ? ` for node ${nodeId}` : ''}...`);
  
  const currentState = getCurrentState();
  
  // If nodeId is provided, use that specific node's expansion prompt
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

    const content = completion.choices[0].message.content;
    
    // Add JSON parsing safety
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

    // Check if event is beyond cutoff date
    const eventDate = new Date(newEvent.timestamp);
    if (eventDate > TIMELINE_CUTOFF_DATE) {
      console.log(`Skipping event: ${newEvent.name} (${newEvent.timestamp}) - beyond cutoff date of ${TIMELINE_CUTOFF_DATE.toISOString().split('T')[0]}`);
      return false;
    }

    // Validate required fields
    const requiredFields = ['id', 'name', 'timestamp', 'description', 'expansion_prompt', 'connectedTo'];
    const missingFields = requiredFields.filter(field => !newEvent[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate timestamp is within ±5 years of connected event
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

    // Add new event to graph with expansion prompt
    try {
      graph.addNode(newEvent.id, {
        name: newEvent.name,
        timestamp: newEvent.timestamp,
        description: newEvent.description,
        timeline: "main",
        expansion_prompt: newEvent.expansion_prompt
      });
    } catch (graphError) {
      console.error('Error adding node:', graphError);
      throw new Error('Failed to add node to graph');
    }

    // Connect new event with validation
    try {
      if (!graph.hasNode(newEvent.connectedTo)) {
        throw new Error(`Invalid connectedTo node: ${newEvent.connectedTo}`);
      }

      const sourceNodeId = currentState.targetNodeId || newEvent.connectedTo;
      graph.addEdge(sourceNodeId, newEvent.id, {
        type: 'CAUSES',
        description: "Generated connection"
      });
    } catch (graphError) {
      // If edge creation fails, remove the node we just added
      if (graph.hasNode(newEvent.id)) {
        graph.dropNode(newEvent.id);
      }
      throw graphError;
    }

    // Save after successful update
    await saveGraph();

    // Print current timeline
    console.log('\nCurrent Timeline:');
    graph.forEachNode((node, attributes) => {
      console.log(`- ${attributes.timestamp}: ${attributes.name}`);
    });

    return true;

  } catch (error) {
    console.error('Error during iteration:', error.message);
    
    // Specific error handling
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

    // For other errors, limit retries
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

// Add a function to get unprocessed nodes
function getUnprocessedNodes() {
  const nodes = [];
  graph.forEachNode((node, attributes) => {
    // Check if this node's expansion prompt has been processed
    const hasOutgoingEdges = graph.outNeighbors(node).length > 0;
    if (!hasOutgoingEdges && attributes.expansion_prompt) {
      nodes.push({ id: node, ...attributes });
    }
  });
  return nodes;
}

// Update main loop to process all unprocessed nodes
async function runExpansionLoop(iterations = 10) {
  await initializeGraph();
  
  let successfulIterations = 0;
  let currentIteration = 1;
  
  while (successfulIterations < iterations && currentIteration < iterations * 2) {
    console.log(`\n=== EXPANSION LOOP ${currentIteration}/${iterations} (${successfulIterations} successful) ===`);
    
    // Get all unprocessed nodes
    const unprocessedNodes = getUnprocessedNodes();
    console.log(`Found ${unprocessedNodes.length} unprocessed expansion prompts`);

    let expansionSuccess = false;
    
    // Try to expand each unprocessed node
    for (const node of unprocessedNodes) {
      console.log(`\nProcessing expansion prompt for: ${node.name} (${node.timestamp})`);
      console.log(`Prompt: ${node.expansion_prompt}`);
      
      const success = await expandIteration(currentIteration, node.id);
      if (success) {
        expansionSuccess = true;
        console.log(`Successfully expanded node: ${node.id}`);
        // Optional: Add small delay between node expansions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (expansionSuccess) {
      successfulIterations++;
    }
    
    currentIteration++;
    
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

// Add narrative generation function
async function generateNarrativeMarkdown(loopCount) {
  const nodes = graph.nodes().map(node => ({
    id: node,
    ...graph.getNodeAttributes(node)
  }));

  // Sort nodes by timestamp
  nodes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  let narrative = `# Terrence Howard Alternate Timeline - Loop ${loopCount}\n\n`;
  narrative += `Generated on ${new Date().toISOString()}\n\n`;
  narrative += `## Timeline Overview\n\n`;

  // Group events by year
  const eventsByYear = {};
  nodes.forEach(node => {
    const year = new Date(node.timestamp).getFullYear();
    if (!eventsByYear[year]) {
      eventsByYear[year] = [];
    }
    eventsByYear[year].push(node);
  });

  // Generate narrative by year
  Object.keys(eventsByYear).sort().forEach(year => {
    narrative += `### ${year}\n\n`;
    eventsByYear[year].forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
      });
      narrative += `#### ${date} - ${event.name}\n\n`;
      narrative += `${event.description}\n\n`;
      
      // Add connected events
      const outEdges = graph.outEdges(event.id);
      if (outEdges.length > 0) {
        narrative += `*Led to:*\n`;
        outEdges.forEach(edge => {
          const targetNode = graph.getNodeAttributes(graph.target(edge));
          narrative += `- ${targetNode.name}\n`;
        });
        narrative += '\n';
      }

      const inEdges = graph.inEdges(event.id);
      if (inEdges.length > 0) {
        narrative += `*Influenced by:*\n`;
        inEdges.forEach(edge => {
          const sourceNode = graph.getNodeAttributes(graph.source(edge));
          narrative += `- ${sourceNode.name}\n`;
        });
        narrative += '\n';
      }
    });
  });

  // Update filename to save in /static/ folder
  const filename = `./static/narrative.loop${loopCount}.md`;
  
  try {
    // Ensure static directory exists
    await fs.mkdir('./static', { recursive: true });
    await fs.writeFile(filename, narrative);
    console.log(`\nNarrative saved to ${filename}`);
  } catch (error) {
    console.error('Error saving narrative:', error);
    throw error;
  }
}

// Update main loop manager
async function runLoopManager(totalLoops = 100, loopsPerNarrative = 10) {
  let currentLoop = 0;

  while (currentLoop < totalLoops) {
    console.log(`\n=== Starting Loop Set ${Math.floor(currentLoop / loopsPerNarrative) + 1} ===\n`);
    
    // Run expansion loop
    await runExpansionLoop(loopsPerNarrative);
    
    // Generate narrative every loopsPerNarrative iterations
    currentLoop += loopsPerNarrative;
    await generateNarrativeMarkdown(currentLoop);
    
    console.log(`\nCompleted ${currentLoop}/${totalLoops} total loops`);
    console.log(`\nStarting next set of ${loopsPerNarrative} loops...\n`);
    
    // Small delay before next set
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Replace runExpansionLoop(10) with:
runLoopManager(100, 10); // Will run 10 sets of 10 loops, generating narrative after each set