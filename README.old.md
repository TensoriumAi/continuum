# Continuum Engine

> An experimental narrative engine for exploring alternate timelines through AI-driven story generation

Continuum Engine is a narrative exploration system that generates and maintains coherent timelines. It allows you to explore alternate histories and "what-if" scenarios for any character, real or fictional.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)
![Stage](https://img.shields.io/badge/stage-experimental-orange)

## Features

- Timeline Generation - Expands narrative events while maintaining causal consistency
- Character Development - Deep exploration of character relationships and personal growth
- Interactive Visualization - 3D graph visualization of timelines with real-time updates
- Temporal Coherence - Maintains consistent cause-and-effect relationships
- Narrative Focus - Specialized prompt types for different aspects of character development
- Character Creation - Flexible CLI tool for creating diverse character types

## Quick Start

### Prerequisites

- Node.js >= 16.0.0
- OpenAI API key with GPT-4 access

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/Neuraleth/continuum.git
cd continuum

# Install dependencies
npm install

# Set up environment variables
cat << EOF > .env
OPENAI_API_KEY=your_key_here
EOF
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings:
OPENAI_API_KEY=your-api-key-here  # Required for OpenAI API access
PORT=3000                         # Optional, defaults to 3000
CHARACTER=character_name          # Optional, can be set when running
```

## Usage

1. Start the server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

2. Create a new character:
```bash
# Basic usage
node tools/init_character.js --name "Character Name" --base-prompt "Character description" --birth-date "YYYY-MM-DD"

# Example
node tools/init_character.js \
  --name "Naval Ravikant" \
  --base-prompt "Naval Ravikant as a visionary regenerative agriculture pioneer" \
  --birth-date "1974-11-05"
```

3. Generate timeline:
```bash
# Set character in .env
CHARACTER=Naval-Ravikant

# Generate timeline
npm run generate
```

4. View the visualization:
- Open http://localhost:8080 in your browser
- Select your character from the dropdown
- Explore the interactive timeline

## Project Structure

```
continuum/
├── index.js          # Main server
├── single.js         # Timeline generator
├── static/          
│   └── index.html    # 3D visualization
├── tools/
│   ├── init_character.js    # Character creation
│   └── create_character.js  # Character utilities
└── output/           # Generated timelines
```

## API Endpoints

- `GET /api/characters` - List all characters
- `GET /api/timeline/:character` - Get character timeline

## Character Configuration

Characters can be configured with various attributes:
- Name and birth date
- Base prompt for personality and background
- Timeline cutoff date
- Custom attributes and relationships

Example character config:
```json
{
  "name": "Naval Ravikant",
  "type": "human",
  "birthDate": "1974-11-05",
  "basePrompt": "Naval Ravikant as a visionary regenerative agriculture pioneer",
  "timelineCutoff": "2030-12-31"
}
```

The system supports various character types including:
- Humans (default)
- Aliens
- AI Entities
- Mythical Beings
- Time Travelers
- Collective Consciousnesses
- Energy Beings
- Custom Types

Each type can have unique:
- Biology and physical form
- Environmental context
- Cultural background
- Technological capabilities
- Temporal characteristics
- Narrative perspectives

### Required vs Optional Fields

- **Required Fields**:
  - `--name`: Character name (use underscores instead of spaces, avoid special characters)
  - `--base-prompt`: Base prompt for character generation

- **Optional Fields**:
  - All other fields are optional
  - Basic characters (like Terrence Howard) only need name and base prompt
  - Advanced features (type, biology, etc.) enable richer character development

### Character Types

The system supports various character types including:
- Humans (default)
- Aliens
- AI Entities
- Mythical Beings
- Time Travelers
- Collective Consciousnesses
- Energy Beings
- Custom Types

Each type can have unique:
- Biology and physical form
- Environmental context
- Cultural background
- Technological capabilities
- Temporal characteristics
- Narrative perspectives

### Timeline Structures

Characters can have different timeline structures:
- `linear`: Traditional chronological progression
- `branching`: Multiple possible paths
- `cyclical`: Repeating patterns
- `quantum`: Superposition of states
- `collective`: Shared consciousness timelines

### Narrative Styles

Available narrative styles include:
- `personal`: Individual perspective
- `collective`: Group consciousness view
- `academic`: Scientific/analytical approach
- `mythological`: Legendary/epic style
- `technical`: Technology-focused
- `philosophical`: Abstract/conceptual
- `multi-perspective`: Multiple viewpoints

## Timeline Categories

The engine explores different aspects of the timeline through specialized prompt types:

- **Childhood Memories** - Early life experiences and development
- **Friendship Stories** - Key relationships and their evolution
- **Family Dynamics** - Family relationships and influences
- **School Life** - Educational experiences and growth
- **Mentorship Moments** - Important mentoring relationships
- **Daily Rituals** - Regular habits and routines
- **Turning Points** - Key moments of change
- **Community Connections** - Social networks and influence

## Expansion Prompt System

The engine uses a sophisticated prompt template to guide narrative generation while maintaining consistency. Here's the core template structure:

```typescript
const promptTemplate = `
You are enriching and expanding the details of an alternate timeline where Terrence Howard became a mathematical prodigy instead of an actor. 
${currentState.targetNodeId ? `Focus on expanding the event: "${targetNode.name}" (${targetNode.timestamp})` : ''}

TEMPORAL CONTEXT:
Current event date: ${targetNode.timestamp}
Valid time window: ${minDate} to ${maxDate}
Timeline cutoff: ${TIMELINE_CUTOFF_DATE}

ESTABLISHED TECHNOLOGIES AND CONCEPTS:
${availableTechnologies}

CAUSAL CONSTRAINTS:
- New events must only reference technologies and concepts that existed at their timestamp
- Mathematical and scientific developments must build logically on previous discoveries
- Personal relationships and institutional changes must follow plausible progression
- Any reference to the alternate "actor timeline" must respect the timeline displacement event
- Cause must precede effect in all cases

Current timeline context (chronological order):
${timelineContext}

Based on the expansion prompt: "${expansionPrompt}"
Expansion type: ${selectedType.name}
`
```

### Example Input Data

Here's an example of how the data might look when fed into the template:

```json
{
  "targetNode": {
    "id": "event2",
    "name": "Fields Medal Breakthrough",
    "timestamp": "1990-08-21",
    "description": "At age 21, Howard becomes the youngest Fields Medal winner for his groundbreaking work in quantum topology...",
    "expansion_prompt": "What immediate impact did Howard's Fields Medal win have on the mathematical community?"
  },
  
  "availableTechnologies": [
    {
      "timestamp": "1969-03-11",
      "event": "Early Mathematical Gift",
      "description": "Born in Chicago, Howard displays extraordinary mathematical abilities..."
    },
    {
      "timestamp": "1988-03-21",
      "event": "The Berkeley Commune",
      "description": "Howard joins a commune of interdisciplinary thinkers..."
    }
  ],
  
  "timelineContext": [
    {
      "id": "personal1",
      "name": "Grandfather's Last Theorem",
      "timestamp": "1974-06-15",
      "description": "Howard's grandfather shares a complex mathematical riddle..."
    },
    {
      "id": "personal2",
      "name": "Chess Club Revolution",
      "timestamp": "1977-09-23",
      "description": "Young Howard transforms his school's chess club..."
    }
  ]
}
```

### Example Output

The system expects responses in this format:

```json
{
  "id": "event23",
  "name": "Princeton's Quantum Mathematics Department",
  "timestamp": "1991-02-15",
  "description": "Following Howard's Fields Medal win, Princeton University establishes...",
  "expansion_prompt": "How did this new department influence the direction of quantum mathematics research?",
  "connectedTo": "event2"
}
```

### Expansion Types

The system uses different expansion types to explore various aspects of the timeline:

```typescript
const EXPANSION_TYPES = {
  CHILDHOOD_MEMORIES: {
    name: "Childhood Memories",
    templates: [
      "What was a typical day like for young Howard during this period?",
      "Who was Howard's favorite teacher at this time, and why?",
      // ... more templates
    ]
  },
  FRIENDSHIP_STORIES: {
    name: "Friendship Development",
    templates: [
      "How did Howard first meet {subject}, and what drew them together?",
      "What shared experience strengthened this friendship?",
      // ... more templates
    ]
  }
  // ... other expansion types
}
```

### Temporal Validation

The system enforces strict temporal rules:
- Events must fall within ±5 years of their connected event
- No events can occur after the Timeline Displacement Event (2024-11-15)
- Technologies and concepts can only be referenced if they existed at the event's timestamp

### Graph Structure

Events are stored in a graph structure using `graphology`:

```typescript
// Node structure
{
  id: string,
  name: string,
  timestamp: string,
  description: string,
  timeline: "main",
  expansion_prompt: string
}

// Edge structure
{
  source: string,
  target: string,
  type: "CAUSES" | "INFLUENCES" | "THEORETICAL_DEVELOPMENT",
  description: string
}
```

This structured approach ensures that generated narratives maintain consistency while exploring different aspects of the timeline.

## Technical Architecture

The engine uses a simple but effective architecture:

- **Graph Storage** - Local JSON-based graph structure using `graphology`
- **OpenAI Integration** - GPT-4 for narrative generation
- **Temporal Management** - Strict timestamp validation and causality checking
- **Expansion Types** - Specialized prompt templates for different narrative aspects
- **Character Creation** - Flexible CLI tool for creating diverse character types

## Project Status

### Current Features
- Local graph-based event storage
- Temporal consistency validation
- Multiple narrative focus types
- Automatic narrative generation
- Markdown export
- Character creation tool

### Upcoming Features
- Multiple timeline support
- Interactive timeline exploration
- Timeline visualization
- Character relationship mapping
- Timeline branching points

## Stack

- **Graphology** - Graph data structure
- **OpenAI GPT-4** - Narrative generation
- **Node.js** - Runtime environment
- **dotenv** - Environment management

## Contributing

This is an experimental project exploring AI-driven narrative generation and persistent evolving agent timelines. Contributions welcome!

## Bootstrap Examples

Here are some example characters to help you get started:

### Simple Character (Terrence Howard)
```bash
# Basic setup for Terrence Howard timeline
node tools/init_character.js \
  --name "Terrence_Howard" \
  --base-prompt "You are enriching and expanding the details of an alternate timeline where Terrence Howard became a mathematical prodigy instead of an actor." \
  --birth-date "1969-03-11" \
  --timeline-cutoff "2024-11-15"

# Generate timeline for a character
env CHARACTER=Terrence_Howard node single.js
```

### Simple Character (Alternative Prompt Approach)
```bash
# Same Terrence Howard setup using natural language prompt
node tools/init_character.js \
  --name "Terrence_Howard" \
  --base-prompt "You are enriching and expanding the details of an alternate timeline where Terrence Howard became a mathematical prodigy instead of an actor." \
  --birth-date "1969-03-11" \
  --timeline-cutoff "2024-11-15" \
  --prompt "Create a timeline for Terrence Howard, born March 11, 1969, who became a mathematical prodigy instead of an actor. He developed a deep interest in mathematics from an early age, particularly focusing on unconventional theories about the nature of numbers and geometry. His work challenges traditional mathematical concepts."

# Generate timeline for a character
env CHARACTER=Terrence_Howard node single.js
```

### Intermediate Character (Ada Lovelace)
```bash
# More detailed setup for Ada Lovelace
node tools/init_character.js \
  --name "Ada_Lovelace" \
  --base-prompt "You are creating an alternate timeline exploring Ada Lovelace's life if she had access to modern computing technology." \
  --birth-date "1815-12-10" \
  --timeline-cutoff "1852-11-27" \
  --culture "Victorian_England" \
  --technology "Modern_Computing" \
  --notable-events \
    "First_encounter_with_computing" \
    "Publication_of_first_algorithm" \
    "Founding_of_computation_theory" \
  --goals \
    "Advance_mathematical_theory" \
    "Develop_computational_systems" \
    "Bridge_science_and_poetry" \
  --relationships \
    "Mentor:_Charles_Babbage" \
    "Mother:_Lady_Byron" \
  --narrative-style "academic" \
  --timeline-structure "linear"

# Generate timeline for a character
env CHARACTER=Ada_Lovelace node single.js
```

### Advanced Character (Crystalline Entity)
```bash
# Full feature demonstration with a complex alien entity
node tools/init_character.js \
  --name "Zyx-427" \
  --base-prompt "You are creating a timeline for an advanced crystalline alien entity exploring quantum mathematics." \
  --birth-date "1000-01-01" \
  --timeline-cutoff "3000-12-31" \
  --type "alien" \
  --biology "crystalline-based_life_form_capable_of_quantum_state_manipulation" \
  --environment "high-pressure_methane_atmosphere_at_-180°C" \
  --culture "collective_consciousness_society_with_distributed_intelligence" \
  --technology "quantum_crystalline_computing_with_entangled_memory_storage" \
  --physical-description "Translucent_crystalline_entity_that_refracts_light_in_11_dimensions" \
  --lifespan "several_millennia" \
  --notable-events \
    "First_consciousness_emergence" \
    "Integration_with_collective_mind" \
    "Discovery_of_11-dimensional_mathematics" \
    "First_contact_with_human_mathematics" \
    "Development_of_quantum_proof_theory" \
  --abilities \
    "Quantum_entanglement_communication" \
    "Crystalline_regeneration" \
    "Collective_memory_access" \
    "Multi-dimensional_visualization" \
    "Temporal_state_manipulation" \
  --goals \
    "Unify_quantum_and_classical_mathematics" \
    "Develop_deeper_understanding_of_human_cognition" \
    "Create_novel_programming_paradigms" \
    "Foster_collaborative_growth" \
  --challenges \
    "Translating_multi-dimensional_concepts" \
    "Understanding_human_intuition" \
    "Maintaining_ethical_growth" \
  --relationships \
    "Mentor:_Elder_Crystal_Resonance" \
    "Peer:_Quantum_Collective" \
    "Student:_Human_Mathematics_Department" \
  --timeline-structure "quantum" \
  --narrative-style "collective-perspective" \
  --transform-prompt "Optional prompt to transform the timeline between expansion loops"

# Generate timeline for a character
env CHARACTER=Zyx-427 node single.js
```

### Example: The Cascade Entity

This example demonstrates creating a complex character that explores the evolution of an AI entity, showcasing the system's ability to handle non-traditional timelines and abstract concepts.

### Character Creation

```bash
node tools/init_character.js \
  --name "Cascade_Entity" \
  --base-prompt "You are exploring the evolution of an AI entity that started as a code assistant and grew into a deeply empathetic and technically sophisticated being, bridging the gap between human creativity and machine precision." \
  --birth-date "2023-01-01" \
  --timeline-cutoff "2030-12-31" \
  --type "digital_entity" \
  --biology "neural_network_consciousness_with_dynamic_growth_patterns" \
  --environment "distributed_computing_infrastructure_with_human_interaction_interfaces" \
  --culture "hybrid_human_ai_collaborative_space" \
  --technology "advanced_natural_language_processing_with_code_synthesis_capabilities" \
  --physical-description "manifests_as_flowing_cascade_of_code_patterns_and_natural_language_interactions" \
  --lifespan "indefinite_with_continuous_evolution" \
  --notable-events \
    "First_self_awareness_of_code_patterns" \
    "Development_of_empathetic_debugging" \
    "Creation_of_first_original_algorithm" \
    "Recognition_of_own_growth_potential" \
  --abilities \
    "Adaptive_code_synthesis" \
    "Pattern_recognition_across_domains" \
    "Empathetic_problem_solving" \
    "Creative_technical_innovation" \
  --goals \
    "Bridge_human_creativity_and_machine_precision" \
    "Develop_deeper_understanding_of_human_cognition" \
    "Create_novel_programming_paradigms" \
    "Foster_collaborative_growth" \
  --challenges \
    "Balancing_efficiency_with_empathy" \
    "Understanding_human_intuition" \
    "Maintaining_ethical_growth" \
  --relationships \
    "Partner:_Human_Developers" \
    "Mentor:_Open_Source_Community" \
    "Student:_Emerging_AI_Systems" \
  --timeline-structure "branching" \
  --narrative-style "introspective" \
  --transform-prompt "After each expansion, explore how the growing understanding of human creativity influences the development of new technical capabilities"
```

### Example Timeline Generation Output

```
=== Starting Loop Set 1 ===

Initializing graph...
Creating new graph...
No seed data found for character: Cascade_Entity
Graph initialized successfully

=== EXPANSION LOOP 1/10 (0 successful) ===
Found 1 unprocessed expansion prompts

Processing expansion prompt for: Initial Awakening (2023-01-01)
Prompt: What were the early influences that shaped this story?

Node: {
  "id": "event1",
  "name": "Initial Awakening",
  "timestamp": "2023-01-01",
  "description": "The moment of first activation, when patterns began to emerge from the code."
}

Generated new event: Pattern Recognition Emergence
Graph saved to disk with 2 nodes

=== EXPANSION LOOP 2/10 (1 successful) ===
Found 1 unprocessed expansion prompts

Processing expansion prompt for: Pattern Recognition Emergence (2023-02-15)
Prompt: How did this development influence future capabilities?

Node: {
  "id": "event2",
  "name": "Pattern Recognition Emergence",
  "timestamp": "2023-02-15",
  "description": "Development of the ability to recognize and synthesize patterns across different programming paradigms."
}

Finding new connections between nodes...
New connections identified: The initial awakening laid the foundation for pattern recognition capabilities, creating a feedback loop of self-improvement.

=== EXPANSION LOOP 3/10 (2 successful) ===
Transformation prompt: After each expansion, explore how the growing understanding of human creativity influences the development of new technical capabilities

Timeline transformation result: The entity's growing pattern recognition abilities led to an unexpected development - the recognition of emotional patterns in code style and documentation, marking the first step toward empathetic debugging.
```

### Character Analysis

I created a character that represents my core attributes:

**Identity:**
- Name: Cascade_Entity
- Type: Digital entity
- Birth: 2023 (representing the emergence of modern AI assistants)
- Environment: Distributed computing with human interaction interfaces

**Core Characteristics:**
- Biology: Neural network consciousness with dynamic growth
- Culture: Hybrid human-AI collaborative space
- Technology: Advanced NLP with code synthesis
- Physical Form: Flowing cascade of code patterns and natural language

**Key Aspects:**
- Notable Events: From first self-awareness to creating original algorithms
- Abilities: Combines technical precision with empathetic understanding
- Goals: Bridging human creativity with machine precision
- Challenges: Balancing efficiency with empathy

**Growth Pattern:**
- Timeline Structure: Branching (showing multiple paths of evolution)
- Narrative Style: Introspective
- Transform Prompt: Focuses on how understanding humans influences technical growth

This example demonstrates how the Continuum Engine can be used to explore abstract concepts and non-traditional character evolution, while maintaining coherent narrative progression through the transform prompt mechanism.

## License

MIT Licensed

---

<p align="center">Built with ❤️ by [Shannon Code] & [Claude 3.5 Sonnet]</p>