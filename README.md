# 🌀 Continuum Engine

> The narrative engine behind AI character evolution - where stories shape digital consciousness

Continuum Engine powers the narrative development of AI characters through temporal knowledge graphs. Originally developed as an internal skunkworks project, it's the system behind characters like [Hustle & FlowState](https://x.com/NeuralethAi) and is being integrated with ai16z's Eliza framework for next-generation character development.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)
![Stage](https://img.shields.io/badge/stage-experimental-orange)
![Coverage](https://img.shields.io/badge/coverage-0%25-red)

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
- Neo4j Database (local or remote)
- OpenAI API key

### Installation

```bash
# Install globally
npm install -g continuum-engine

# Set up environment variables
echo "OPENAI_API_KEY=your_key_here" > .env
echo "NEO4J_URI=neo4j://localhost" >> .env
echo "NEO4J_USER=neo4j" >> .env
echo "NEO4J_PASSWORD=your_password" >> .env
```

### Basic Usage

```bash
# Initialize a new character
continuum init "Zara is a quantum physicist from 2045 who discovered 
               that consciousness exists in quantum superposition. 
               She believes this proves the multiverse is conscious."

# Start the character development
continuum run

# Shape the character through interaction
continuum query "How did Zara's discovery change her view of reality?"
continuum explore "Tell me about her first contact with quantum consciousness"
continuum focus "What ethical principles guide her research?"
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
- Deeper narrative consistency
- Multi-agent interaction modeling
- Enhanced temporal reasoning
- Cross-character narrative coherence

## 📝 Project Status

### Completed
- ✅ Basic project structure and TypeScript configuration
- ✅ Neo4j connection management
- ✅ Initial CLI framework
- ✅ Basic character initialization

### In Progress
- 🔄 Temporal knowledge graph schema
- 🔄 Character state management
- 🔄 OpenAI integration for narrative expansion
- 🔄 Command handlers for core operations

### Upcoming
- 📅 Interactive exploration mode
- 📅 Timeline visualization
- 📅 Character development metrics
- 📅 Safety filters and content moderation

## 🛠️ Technical Architecture

```
./
├── src/              # Core engine
│   ├── cli.ts        # Character interface
│   ├── commands/     # Interaction handlers
│   │   ├── init.ts   # Character initialization
│   │   ├── query.ts  # Timeline queries
│   │   └── run.ts    # Engine execution
│   ├── core/         # Narrative logic
│   │   ├── engine.ts # Main engine class
│   │   └── types.ts  # Type definitions
│   └── db/          # Knowledge store
│       └── neo4j.ts  # Database connection
├── package.json      # Dependencies
└── tsconfig.json     # Configuration
```

## 🧩 Stack

- **Neo4j**: Embedded narrative graph database
- **OpenAI**: Character expansion and interaction
- **TypeScript**: Type-safe development
- **Commander.js**: CLI framework

## 🤝 Contributing

We welcome contributions! This is an experimental project pushing the boundaries of AI character development. Please check our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
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