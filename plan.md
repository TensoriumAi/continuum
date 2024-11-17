# Continuum Engine with Neo4j

## 1. Project Overview
The **Continuum Engine** uses **Neo4j** to manage and expand Temporal Knowledge Graphs (TKG) with converging narratives. The system creates, stores, and queries large, interconnected narratives that can branch and converge across different timelines—scaling to the equivalent of two novels.

Neo4j supports:
- Native graph storage for events, entities, and metadata
- High-performance traversals for timeline analysis
- Embedded deployment for simplified architecture
- ACID compliance for data integrity across timelines

## 2. Core Features

### Graph and Narrative Storage
- Nodes represent events/entities across timelines
- Relationships capture connections (causal, temporal, convergent)
- Properties store metadata, tags, and expansion prompts
- Timeline markers for divergent paths

### Autonomous Expansion
- Parse initial narrative into graph structure
- Identify potential divergence points
- Track converging events across timelines
- Iteratively expand the graph with LLM output

### Converging Narratives
- Track multiple timeline branches
- Identify shared events and convergence points
- Maintain causal consistency across timelines
- Support narrative coherence during convergence

### Real-Time User Interaction
- Query graph across multiple timelines
- User-driven prompts influence timeline development
- Interactive exploration of divergent paths
- Timeline-aware response generation

### Constraints
- Temporal bounds per timeline
- Convergence point validation
- Causality preservation across timelines
- Dimensionality control for timeline branches

---

## 3. Workflow

### Initialization
1. **Input Narrative**: User provides seed narrative with potential divergence points
2. **Graph Parsing**:
   - Convert narrative into initial timeline structure
   - Identify potential branch points
   - Store the parsed graph in Neo4j

### Autonomous Expansion Loop
1. **Graph Retrieval**:
   - Query Neo4j for relevant nodes/relationships based on:
     - Temporal range across timelines
     - Convergence points
     - Tags, importance, or prior prompts
   - Summarize retrieved graph data for LLM input

2. **LLM Expansion**:
   - Pass graph context and timeline state to LLM
   - Generate:
     - Expanded narrative branches
     - Convergence points
     - New nodes/relationships with properties
     - Timeline-specific prompts

3. **Graph Update**:
   - Create new timeline branches
   - Update convergence points
   - Maintain causal consistency

4. **Convergence Analysis**:
   - Identify shared events across timelines
   - Validate causal consistency
   - Update convergence metadata

### Node Properties
```cypher
CREATE (e:Event {
  id: "unique_id",
  name: "Event Name",
  description: "Detailed description",
  timestamp: datetime("2024-01-01"),
  timeline_id: "timeline_A",
  convergence_points: ["event_id1", "event_id2"],
  tags: ["tag1", "tag2"],
  importance: 10,
  expansion_prompt: "What challenges arose?",
  user_queries: ["query1", "query2"],
  exploration_paths: ["path1", "path2"]
})
```

### Relationship Types
- CAUSES
- PRECEDES
- INVOLVES
- LOCATED_AT
- CONVERGES_WITH
- DIVERGES_FROM

### Timeline Management
```cypher
CREATE (t:Timeline {
  id: "timeline_A",
  branch_point: "event_id",
  convergence_points: ["event_id1", "event_id2"],
  active: true,
  metadata: {
    theme: "centralized_governance",
    probability: 0.8
  }
})
```

### CLI Commands
```bash
continuum init "Ada is a brilliant programmer in 2025..."  # Initialize with seed
continuum branch "What if Ada chose to restrict AI access?"  # Create timeline branch
continuum converge "Show shared outcomes across timelines"   # Analyze convergence
continuum query "What happened in Timeline A's 2027?"       # Timeline-specific query
continuum explore "Compare AI development across timelines"  # Cross-timeline analysis
```

---

## 4. Database Schema

### Node Labels
- Event
- Entity
- Location
- TimePoint

### Node Properties
```cypher
CREATE (e:Event {
  id: "unique_id",
  name: "Event Name",
  description: "Detailed description of the node",
  timestamp: datetime("2024-01-01"),
  tags: ["tag1", "tag2"],
  importance: 10,
  expansion_prompt: "What challenges arose from this event?",
  user_queries: ["related_query_1", "related_query_2"],  // Track user interest
  exploration_paths: ["path1", "path2"]                  // Track narrative branches
})
```

### Relationship Types
- CAUSES
- PRECEDES
- INVOLVES
- LOCATED_AT

### Relationship Properties
```cypher
CREATE (e1)-[:CAUSES {
  description: "Relationship details",
  confidence: 0.9,
  metadata: {
    source: "initial_narrative"
  }
}]->(e2)
```

---

## 5. Example Workflow

### Initialization
**Seed Narrative**:
> "In 2015, Terence invented interdimensional travel, fundamentally altering geopolitics by 2020."

**Creating Graph**:
```cypher
CREATE (e1:Event {
  name: "Interdimensional Travel Invention",
  timestamp: datetime("2015-01-01"),
  description: "Terence invents interdimensional travel"
})

CREATE (e2:Event {
  name: "Global Politics Disruption",
  timestamp: datetime("2020-01-01"),
  description: "Geopolitics fundamentally altered"
})

CREATE (e1)-[:CAUSES {
  description: "Invention leads to political changes"
}]->(e2)
```

### Query for Context
```cypher
MATCH (e:Event)
WHERE e.timestamp >= datetime("2025-01-01") 
  AND e.timestamp <= datetime("2030-12-31")
RETURN e
```

### Pattern Matching Query
Find all events within 3 hops:
```cypher
MATCH path = (start:Event {name: "Interdimensional Travel Invention"})-[*1..3]->(connected)
RETURN path
```

---

## 6. Technical Stack

### Backend
- **Neo4j**: Embedded graph database
- **Node.js (TypeScript)**: Backend runtime
- **neo4j-driver**: Official Neo4j JavaScript driver

### LLM Integration
- **OpenAI API**: For generating narrative expansions

### Frontend (Optional)
- **React/Vanilla JS**: Interactive UI
- **Cytoscape.js**: Graph visualization

---

## 7. CLI and API

### CLI Setup
The Continuum Engine is distributed as a Node.js package with a global binary. Install globally:

```bash
npm install -g continuum-engine
# or
npm install -g .  # from project directory
```

### CLI Commands
After installation, use directly from terminal:
```bash
continuum init                              # Initialize database and seed graph
continuum run                               # Start autonomous expansion loop
continuum query "What happened in 2027?"    # Query and expand the graph
continuum explore "Tell me more about the resistance movement"  # Interactive exploration
continuum focus "Follow the story of Sarah's invention"        # Direct narrative focus
```

Or use with npx without installing:
```bash
npx continuum-engine init
npx continuum-engine run
npx continuum-engine query "What happened in 2027?"
```

### Package.json Binary Configuration
```json
{
  "name": "continuum-engine",
  "version": "1.0.0",
  "bin": {
    "continuum": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  }
  // ... other configuration
}
```

### Project Structure Update
```
./
├── package.json
├── tsconfig.json
├── src/
│   ├── cli.ts        # CLI entry point
│   ├── commands/     # Command implementations
│   ├── core/         # Core engine functionality
│   └── db/           # Database interactions
├── node_modules/
└── .gitignore
```

---

## 8. Installation Guide

### Install Dependencies
```bash
npm install neo4j-driver openai
```

### Connect to Neo4j
```typescript
import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  'neo4j://localhost',
  neo4j.auth.basic('neo4j', 'password')
)
```

---

## 9. Deliverables

1. **Neo4j-backed Graph System**:
   - Embedded graph database setup
   - Efficient traversal algorithms
   - Data integrity management

2. **CLI Tools**:
   - Initialize, query, and expand the graph
   - Real-time interaction interface

3. **Documentation**:
   - Installation and usage guides
   - API documentation
   - Query examples

---

## Project Structure
```
./
├── package.json
├── tsconfig.json
├── src/
├── node_modules/
└── .gitignore
```
