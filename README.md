# 🌀 Continuum Engine

> An experimental narrative engine for exploring alternate timelines through AI-driven story generation

Continuum Engine is a narrative exploration system that generates and maintains coherent alternate timelines. Currently focused on the "Mathematical Howard" timeline - exploring a world where Terrence Howard became a mathematical prodigy instead of an actor.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)
![Stage](https://img.shields.io/badge/stage-experimental-orange)

## ✨ Features

- 🧬 **Timeline Generation** - Expands narrative events while maintaining causal consistency
- 🎭 **Character Development** - Deep exploration of character relationships and personal growth
- 📊 **Graph-Based Storage** - Events and relationships stored in a local graph structure
- ⌛ **Temporal Coherence** - Maintains consistent cause-and-effect relationships
- 🔍 **Narrative Focus** - Specialized prompt types for different aspects of character development

## 🚀 Quick Start

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

### Basic Usage

```bash
# Run the narrative expansion loop
node single.js

# Generated narratives will be saved as markdown files:
# narrative.loop10.md
# narrative.loop20.md
# etc.
```

## 🎭 Timeline Categories

The engine explores different aspects of the timeline through specialized prompt types:

- **Childhood Memories** - Early life experiences and development
- **Friendship Stories** - Key relationships and their evolution
- **Family Dynamics** - Family relationships and influences
- **School Life** - Educational experiences and growth
- **Mentorship Moments** - Important mentoring relationships
- **Daily Rituals** - Regular habits and routines
- **Turning Points** - Key moments of change
- **Community Connections** - Social networks and influence

## 🎯 Expansion Prompt System

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

## 🛠️ Technical Architecture

The engine uses a simple but effective architecture:

- **Graph Storage** - Local JSON-based graph structure using `graphology`
- **OpenAI Integration** - GPT-4 for narrative generation
- **Temporal Management** - Strict timestamp validation and causality checking
- **Expansion Types** - Specialized prompt templates for different narrative aspects

## 📝 Project Status

### Current Features
- ✅ Local graph-based event storage
- ✅ Temporal consistency validation
- ✅ Multiple narrative focus types
- ✅ Automatic narrative generation
- ✅ Markdown export

### Upcoming Features
- 📅 Multiple timeline support
- 📅 Interactive timeline exploration
- 📅 Timeline visualization
- 📅 Character relationship mapping
- 📅 Timeline branching points

## 🧩 Stack

- **Graphology** - Graph data structure
- **OpenAI GPT-4** - Narrative generation
- **Node.js** - Runtime environment
- **dotenv** - Environment management

## 🤝 Contributing

This is an experimental project exploring AI-driven narrative generation and persistent evolving agent timelines. Contributions welcome!

## 📄 License

MIT Licensed

---

<p align="center">Built with ❤️ by [Neuraleth]</p>