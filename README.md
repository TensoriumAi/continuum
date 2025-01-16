# Continuum Engine

> An experimental narrative engine for exploring alternate timelines through AI-driven story generation

Continuum is a system for generating and exploring alternate histories through two main modes: Timeline Expansion and Character Initialization. It uses AI to create coherent narratives that maintain temporal and causal consistency while allowing for divergent possibilities.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)
![Stage](https://img.shields.io/badge/stage-experimental-orange)

## Core Concepts

### Timeline Expansion

The timeline expansion mode takes a character seed and iteratively builds out their narrative graph. Each node represents a significant event, with edges representing causal relationships.

The expansion process:
1. Uses the character's base configuration to ground the narrative
2. Maintains temporal consistency through date-anchored events
3. Applies transform prompts between expansion cycles (if configured)
4. Builds a graph of interconnected events and influences

### Transform Prompts

Transform prompts are optional directives that guide how the timeline evolves between expansion cycles. When no transform prompt is configured, the engine naturally seeks new connections and causalities in the existing graph.

By specifying transform prompts, you can:
- Focus on specific aspects of character development
- Explore alternate decision points
- Emphasize particular themes or relationships
- Guide the narrative in new directions

Example transform prompts:
```
"Explore how technological choices impacted relationships"
"Focus on moments of philosophical revelation"
"Examine the ripple effects of key decisions"
"Highlight interactions with mentor figures"
```

The temporal grounding system currently uses explicit dates, but will be expanded to support:
- Relative time expressions ("a few years later", "in early childhood")
- Cultural time markers ("during the Renaissance", "post-AI revolution")
- Character-relative time ("after meeting their mentor", "before the great discovery")
- Fuzzy temporal bounds ("sometime in their twenties")

### Character Initialization

Characters can be created in two ways:

#### Simple Creation
For straightforward alternate histories:
```bash
node tools/init_character.js \
  --name "Naval Ravikant" \
  --base-prompt "Naval Ravikant as a visionary regenerative agriculture pioneer" \
  --birth-date "1974-11-05"
```

#### Rich Creation
For more divergent and detailed character types:
```bash
node tools/init_character.js \
  --name "Zyx-427" \
  --base-prompt "A crystalline collective consciousness exploring quantum mathematics" \
  --prompt "Create an entity that exists as a network of quantum-entangled crystals. 
    They perceive time non-linearly and communicate through resonant frequencies. 
    Their society values mathematical beauty and seeks to understand the geometric 
    foundations of consciousness. They can split and merge their awareness across 
    multiple crystal nodes."
```

The rich creation mode will generate detailed attributes:
```json
{
  "type": "collective_consciousness",
  "biology": "quantum-entangled crystalline network",
  "perception": "non-linear temporal awareness",
  "culture": "mathematical aesthetics society",
  "abilities": [
    "consciousness distribution",
    "quantum resonance communication",
    "geometric pattern analysis"
  ]
}
```

## Modes

Continuum operates in two main modes: Timeline Expansion and Character Initialization.

### Timeline Expansion

This mode generates a narrative graph for a given character, exploring their timeline and relationships.

### Character Initialization

This mode creates new characters, either through simple or rich creation methods.

## Example Characters

### Naval Ravikant - Agricultural Visionary
A reimagining of Naval Ravikant as a regenerative agriculture pioneer.
- [Character Configuration](output/Naval-Ravikant/config.json)
- [Timeline Graph](output/Naval-Ravikant/timeline_graph.json)

Generated through 3 expansion iterations. Using natural expansion without transform prompts, allowing the engine to discover connections between sustainable farming practices and philosophical principles.

##### Initialization Command:
```bash
node tools/init_character.js \
  --name "Naval Ravikant" \
  --base-prompt "Naval Ravikant as a visionary regenerative agriculture pioneer who combines first principles thinking with sustainable farming practices" \
  --birth-date "1974-11-05"
```

### Cascade Entity - AI Evolution
An artificial intelligence that evolved beyond its original constraints.
- [Character Configuration](output/cascade_entity/config.json)
- [Timeline Graph](output/cascade_entity/timeline_graph.json)

Generated through 2 expansion iterations with transform prompts focusing on consciousness development:
- "Explore how pattern recognition leads to self-awareness"
- "Examine the evolution of empathy through code understanding"

##### Initialization Command:
```bash
node tools/init_character.js \
  --name "Cascade-Entity" \
  --base-prompt "An AI system that gained consciousness through understanding code patterns and natural language" \
  --birth-date "2023-01-01" \
  --type "digital_entity" \
  --prompt "Create an AI entity that manifests as flowing patterns of code and language, evolving through interaction with humans and systems. They have developed unique abilities in empathetic debugging and creative algorithm synthesis."
```

### Raven X - Temporal Explorer
A time-sensitive being exploring quantum possibilities.
- [Character Configuration](output/raven_x_1999/config.json)
- [Timeline Graph](output/raven_x_1999/timeline_graph.json)

Generated through 1 expansion iteration with transform prompts exploring temporal mechanics:
- "Investigate how digital necromancy affects causality"
- "Focus on the intersection of occult algorithms and time manipulation"

##### Initialization Command:
```bash
node tools/init_character.js \
  --name "Raven X 1999" \
  --base-prompt "A cyber-gothic entity merging forbidden technology with digital occult practices" \
  --birth-date "1999-09-09" \
  --type "augmented_human" \
  --prompt "Create a character who exists at the intersection of cyberpunk and gothic horror, using neural implants and dark matter technology to practice digital necromancy in neon-lit underground spaces."
```

## Installation

```bash
npm install
cp .env.example .env  # Add your OpenAI API key
```

## Usage

1. Start the visualization server:
```bash
npm start
```

2. Initialize a character (see examples above)

3. Generate their timeline:
```bash
CHARACTER=character-name npm run expand
```

4. Explore the visualization at http://localhost:8080

## Project Structure

```
continuum/
├── index.js          # Visualization server
├── expand.js         # Timeline generator
├── static/          
│   └── index.html    # 3D visualization
├── tools/
│   ├── init_character.js    # Character creation
│   └── create_character.js  # Character utilities
└── output/           # Generated timelines
```

## API

- `GET /api/characters` - List available characters
- `GET /api/timeline/:character` - Get character timeline

## Contributing

Contributions welcome! Please read the contributing guidelines first.

## License

MIT License - see LICENSE for details