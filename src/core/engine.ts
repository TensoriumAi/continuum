import { Neo4jConnection } from '../db/neo4j'
import OpenAI from 'openai'
import { EngineEvent, EngineState, QueryResult } from './types'

export class ContinuumEngine {
  private db: Neo4jConnection
  private state: EngineState
  private openai: OpenAI

  constructor(openaiApiKey: string) {
    this.db = Neo4jConnection.getInstance()
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    })
    this.state = {
      character: null!,
      activeTimelines: []
    }
  }

  async initialize(seedNarrative: string): Promise<void> {
    const session = await this.db.getSession()
    try {
      // Parse the narrative and create initial graph structure
      const initialEvents = await this.parseNarrative(seedNarrative)
      
      // Create events in Neo4j
      await session.executeWrite(async tx => {
        for (const event of initialEvents) {
          await tx.run(`
            CREATE (e:Event {
              id: $id,
              name: $name,
              description: $description,
              timestamp: datetime($timestamp),
              timeline_id: $timelineId
            })
          `, event)
        }
      })
    } finally {
      await session.close()
    }
  }

  private async parseNarrative(narrative: string) {
    // Use OpenAI to parse the narrative into structured events
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Parse the following narrative into a series of events with timestamps and descriptions."
      }, {
        role: "user",
        content: narrative
      }]
    })

    // Process and structure the response
    // This is a simplified example - would need more robust parsing
    return [{
      id: "initial_event",
      name: "Narrative Start",
      description: narrative,
      timestamp: new Date().toISOString(),
      timelineId: "main"
    }]
  }

  async query(question: string, options: { timeline?: string; depth?: number } = {}): Promise<QueryResult> {
    const session = await this.db.getSession()
    try {
      // Get relevant events based on the query
      const events = await this.getRelevantEvents(session, question, options)
      
      // Generate response using OpenAI
      const response = await this.generateResponse(question, events)
      
      // Update character state based on the interaction
      await this.updateCharacterState(session, question, response)
      
      return {
        events: events as any[],
        context: response.context,
        explorationPaths: response.explorationPaths
      }
    } finally {
      await session.close()
    }
  }

  private async getRelevantEvents(session: any, question: string, options: any): Promise<EngineEvent[]> {
    const depth = options.depth || 3
    const timelineClause = options.timeline ? 'AND e.timeline_id = $timelineId' : ''
    
    const result = await session.run(`
      MATCH (e:Event)
      WHERE e.timestamp <= datetime() ${timelineClause}
      WITH e
      ORDER BY e.importance DESC
      LIMIT $depth
      RETURN e
    `, { 
      depth,
      timelineId: options.timeline 
    })

    return result.records.map((record: any) => record.get('e').properties)
  }

  private async generateResponse(question: string, events: EngineEvent[]): Promise<any> {
    const prompt = this.buildPrompt(question, events)
    
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are analyzing a character's narrative timeline. Provide insights and suggest exploration paths."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })

    // Parse the response
    const response = completion.choices[0].message.content || ''
    return this.parseResponse(response)
  }

  private buildPrompt(question: string, events: EngineEvent[]): string {
    const context = events
      .map(e => `[${e.timestamp}] ${e.name}: ${e.description}`)
      .join('\n')
    
    return `
Character Timeline Context:
${context}

Question: ${question}

Analyze the timeline and provide:
1. A coherent response that maintains narrative consistency
2. 2-3 relevant exploration paths for further investigation
    `
  }

  private parseResponse(response: string): any {
    // Simple parsing - could be more sophisticated
    const lines = response.split('\n')
    const context = lines[0]
    const explorationPaths = lines
      .slice(1)
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(2))

    return { context, explorationPaths }
  }

  private async updateCharacterState(session: any, question: string, response: any): Promise<void> {
    // Update character state based on the interaction
    this.state.lastQuery = question
    this.state.lastResponse = response.context
    
    // Store the interaction in Neo4j
    await session.run(`
      MATCH (c:Character {id: $characterId})
      CREATE (i:Interaction {
        timestamp: datetime(),
        query: $question,
        response: $response
      })
      CREATE (c)-[:HAD_INTERACTION]->(i)
    `, {
      characterId: this.state.character.id,
      question,
      response: response.context
    })
  }
} 