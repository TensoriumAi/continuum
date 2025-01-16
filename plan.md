# Continuum Engine

## 1. Project Overview
The **Continuum Engine** uses **graphology** to manage and expand Temporal Knowledge Graphs (TKG) with narrative timelines. The system creates, stores, and queries interconnected narratives that explore alternate histories—currently focused on the "Mathematical Howard" timeline where Terrence Howard became a mathematical prodigy instead of an actor.

Graphology provides:
- In-memory graph storage for events and relationships
- Efficient graph traversal and analysis
- Simple integration with Node.js
- Flexible data structure for timeline manipulation

## 2. Core Features

### Graph and Narrative Storage
- Nodes represent events and entities across the timeline
- Edges capture temporal and causal relationships
- Properties store metadata, timestamps, and descriptions
- Timeline markers for narrative progression

### Autonomous Expansion
- Parse and maintain narrative graph structure
- Identify key events and relationships
- Generate coherent narrative expansions
- Track character development and relationships

### Timeline Management
- Maintain single coherent timeline
- Preserve cause-and-effect relationships
- Ensure temporal consistency
- Track character development arcs

### Interactive Exploration
- Generate HTML/PDF narrative outputs
- Support multiple narrative loops
- Maintain consistent character voices
- Generate rich narrative details

### Constraints
- Temporal bounds for events
- Causal relationship validation
- Historical accuracy checks
- Technology/concept availability validation

---

## 3. Workflow

### Initialization
1. **Configuration**: Load environment variables and API keys
2. **Graph Setup**: Initialize graphology instance for timeline storage
3. **State Management**: Track current narrative state and expansion points

### Narrative Expansion Loop
1. **Context Gathering**:
   - Query graph for relevant events/relationships
   - Consider temporal context and constraints
   - Gather character development history
   - Track established technologies and concepts

2. **LLM Expansion**:
   - Generate narrative expansions using GPT-4
   - Maintain consistent character voices
   - Ensure temporal coherence
   - Validate technological constraints

3. **Graph Updates**:
   - Add new events and relationships
   - Update temporal markers
   - Track character development
   - Maintain causal consistency

4. **Output Generation**:
   - Create markdown narratives
   - Generate HTML/PDF outputs
   - Update timeline visualizations
   - Track narrative progression

### Event Properties
```javascript
const event = {
  id: "unique_id",
  name: "Event Name",
  description: "Detailed description",
  timestamp: "2024-01-01",
  characters: ["character1", "character2"],
  tags: ["tag1", "tag2"],
  importance: 10,
  expansionPrompt: "What challenges arose?",
  technologies: ["tech1", "tech2"],
  locations: ["location1", "location2"]
}
```

### Relationship Types
- CAUSES: Direct causal relationships
- PRECEDES: Temporal ordering
- INVOLVES: Character participation
- INFLUENCES: Indirect effects

## 4. Implementation Details

### Core Components
- `single.js`: Main narrative expansion loop
- `server.js`: Web server for visualization
- Timeline visualization using static JSON
- Markdown/HTML/PDF output generation

### Key Dependencies
- graphology: Graph data structure
- openai: GPT-4 integration
- express: Web server
- dotenv: Environment configuration

### File Structure
```
continuum/
├── single.js        # Main narrative engine
├── server.js        # Web visualization
├── static/          # Timeline visualization
├── narrative.*      # Generated narratives
└── tools/          # Utility functions
```

## 5. Future Enhancements
- Interactive timeline visualization
- Character relationship graphs
- Automated fact-checking
- Multiple timeline branches
- Enhanced prompt engineering
- Real-time narrative updates
