# 🌀 Continuum Engine

> The narrative engine behind AI character evolution - where stories shape digital consciousness

Continuum Engine powers the narrative development of AI characters through temporal knowledge graphs. Originally developed as an internal skunkworks project, it's the system behind characters like [Hustle & FlowState](https://x.com/NeuralethAi) and is being integrated with ai16z's Eliza framework for next-generation character development.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)
![Stage](https://img.shields.io/badge/stage-experimental-orange)
![Coverage](https://img.shields.io/badge/coverage-15%25-red)

## 🎭 Character Development

Continuum Engine was built to solve a specific challenge: How do you create AI characters that evolve coherently over time while maintaining deep narrative consistency? The answer was to treat character development as an expanding temporal knowledge graph, where every interaction shapes the character's evolving story.

## ✨ Features

- 🧬 **Character Evolution** - Characters grow and adapt through each interaction
- 🎭 **Narrative Memory** - Deep context awareness across character timelines
- 📊 **Knowledge Graphs** - Track relationships, events, and character development
- ⌛ **Temporal Coherence** - Maintain consistent character growth over time
- 🔍 **Natural Interaction** - Shape character development through natural conversation

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- Docker (recommended) or Neo4j Desktop
- OpenAI API key with GPT-4 access

### Neo4j Setup

#### Option 1: Using Docker (Recommended)
```bash
# Pull Neo4j image
docker pull neo4j:5.13.0

# Start Neo4j container
docker run \
    --name continuum-neo4j \
    -p7474:7474 -p7687:7687 \
    -e NEO4J_AUTH=neo4j/your_password \
    -e NEO4J_PLUGINS='["apoc"]' \
    -d neo4j:5.13.0

# Verify Neo4j is running
docker logs continuum-neo4j
```

#### Option 2: Using Neo4j Desktop
1. Download [Neo4j Desktop](https://neo4j.com/download/)
2. Create a new project
3. Add a new database (version 5.x)
4. Set password and start the database

### Installation & Setup

```bash
# Install globally
npm install -g continuum-engine

# Create project directory
mkdir my-continuum-project
cd my-continuum-project

# Initialize environment
cat << EOF > .env
OPENAI_API_KEY=your_key_here
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
EOF

# Verify Neo4j connection
continuum verify-db
```

### Basic Usage

```bash
# Initialize a new character
continuum init "Zara is a quantum physicist from 2045 who discovered 
               that consciousness exists in quantum superposition. 
               She believes this proves the multiverse is conscious."

# Start interactive development session
continuum run

# Query specific aspects
continuum query "How did Zara's discovery change her view of reality?" --depth 5
continuum explore "Tell me about her first contact with quantum consciousness"
continuum focus "What ethical principles guide her research?"
```

### Advanced Usage

```bash
# Query specific timeline
continuum query "What happened in Timeline A?" --timeline timeline_A

# Deep exploration with context
continuum explore "Quantum consciousness research" --context-window 10

# Focus on character development
continuum focus "Ethical principles" --trait ethics --weight 0.8
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/neuraleth/continuum-engine.git
cd continuum-engine

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

## 📖 Live Example: Hustle & FlowState

The engine powers the narrative development of characters like Hustle & FlowState, maintaining their coherent evolution across thousands of interactions:

```bash
$ continuum query "How did Hustle's views on AI alignment evolve in 2024?"

> Analyzing character timeline...
> Hustle's perspective evolved through three key phases:
> 1. Initial skepticism of traditional alignment approaches
> 2. Development of market-driven alignment theory
> 3. Integration of game theoretic principles
>
> Explore:
  1. The market mechanisms Hustle proposed
  2. Key debates with other AI theorists
  3. Implementation in real systems
```

## 🔮 Upcoming: ai16z Eliza Integration

Continuum Engine is being integrated with ai16z's Eliza framework to power the next generation of Hustle's character development, enabling:
- Deeper narrative consistency through graph-based memory
- Multi-agent interaction modeling with temporal awareness
- Enhanced temporal reasoning across parallel timelines
- Cross-character narrative coherence with convergence points

## 📝 Project Status

### Completed
- ✅ Neo4j connection management
- ✅ Basic TypeScript project structure
- ✅ Core CLI framework with commander.js
- ✅ Basic init command implementation

### In Progress
- 🔄 Query command implementation
- 🔄 Run command for interactive mode
- 🔄 Character state management
- 🔄 Basic event storage and retrieval

### Upcoming
- 📅 Explore command for deep narrative exploration
- 📅 Focus command for character trait development
- 📅 Timeline branching and convergence
- 📅 Advanced temporal knowledge graph schema
- 📅 Enhanced OpenAI prompt engineering
- 📅 Character development metrics
- 📅 Timeline visualization
- 📅 Safety filters and content moderation
- 📅 Multi-character interaction support
- 📅 Test suite implementation

## 🛠️ Technical Architecture

```
./
├── src/                    # Core engine
│   ├── cli.ts             # Command interface
│   ├── commands/          # Command handlers
│   │   ├── init.ts        # Initialization
│   │   ├── query.ts       # Timeline queries
│   │   ├── explore.ts     # Deep exploration
│   │   ├── focus.ts       # Character focus
│   │   └── run.ts         # Interactive mode
│   ├── core/              # Core logic
│   │   ├── engine.ts      # Main engine
│   │   ├── character.ts   # Character management
│   │   ├── timeline.ts    # Timeline handling
│   │   └── types.ts       # Type definitions
│   └── db/                # Data layer
│       ├── neo4j.ts       # Graph database
│       └── schema.ts      # Database schema
├── test/                  # Test suite
├── docs/                  # Documentation
├── package.json           # Dependencies
└── tsconfig.json          # TS config
```

## 🧩 Stack

- **Neo4j**: Graph database for narrative storage
- **OpenAI GPT-4**: Character interaction and development
- **TypeScript**: Type-safe development
- **Commander.js**: CLI framework
- **Jest**: Testing framework

## 🤝 Contributing

We welcome contributions! This is an experimental project pushing the boundaries of AI character development. Please check our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests (coverage target: 80%)
5. Submit a pull request

## 📄 License

MIT Licensed - see [LICENSE](LICENSE)

## 📚 Documentation

- [Technical Specification](docs/SPEC.md)
- [API Documentation](docs/API.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Contributing Guide](CONTRIBUTING.md)

---

<p align="center">Built with ❤️ at Neuraleth</p>