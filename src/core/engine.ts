import OpenAI from 'openai'
import { EngineEvent, EngineState, QueryResult } from './types'
import { GraphDatabase } from '../db/graph'

export class ContinuumEngine {
  private db: GraphDatabase
  private state: EngineState
  private openai: OpenAI

  constructor(openaiApiKey: string) {
    this.db = GraphDatabase.getInstance()
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    })
    this.state = {
      character: null!,
      activeTimelines: []
    }
  }

  async initialize(narrative: string): Promise<void> {
    // Initialize the graph database
    await this.db.initialize()

    // Parse the narrative and create initial graph structure
    const initialEvents = await this.parseNarrative(narrative)
    
    // Add events to the graph
    for (const event of initialEvents) {
      this.db.addEvent(event)
    }

    // Save the graph to disk
    await this.db.save()
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
    // Get relevant events based on the query
    const events = this.db.query(options.timeline, options.depth);
    
    // Generate response using OpenAI
    const response = await this.generateResponse(question, events);
    
    // Update character state based on the interaction
    await this.updateCharacterState(question, response);
    
    return {
      events,
      context: response.context,
      explorationPaths: response.explorationPaths
    };
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

  private async updateCharacterState(question: string, response: any): Promise<void> {
    // Update character state based on the interaction
    this.state.lastQuery = question;
    this.state.lastResponse = response.context;
    
    // Save state to disk
    await this.db.save();
  }
} 