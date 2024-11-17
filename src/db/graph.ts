import Graph from 'graphology';
import { SerializedGraph } from 'graphology-types';
import * as fs from 'fs/promises';
import path from 'path';
import { EngineEvent } from '../core/types';

// Define edge attributes type
interface EdgeAttributes {
  type: string;
  [key: string]: any;
}

export class GraphDatabase {
  // Specify generic types for the graph
  private graph: Graph<EngineEvent, EdgeAttributes>;
  private static instance: GraphDatabase;
  private savePath: string;

  private constructor() {
    this.graph = new Graph<EngineEvent, EdgeAttributes>();
    this.savePath = path.join(process.cwd(), 'data', 'graph.json');
  }

  static getInstance(): GraphDatabase {
    if (!GraphDatabase.instance) {
      GraphDatabase.instance = new GraphDatabase();
    }
    return GraphDatabase.instance;
  }

  async initialize(): Promise<void> {
    await this.ensureDataDirectory();
    await this.load();
  }

  private async ensureDataDirectory(): Promise<void> {
    const dir = path.dirname(this.savePath);
    await fs.mkdir(dir, { recursive: true });
  }

  async save(): Promise<void> {
    const serialized = this.graph.export();
    await fs.writeFile(this.savePath, JSON.stringify(serialized, null, 2));
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.savePath, 'utf-8');
      const serialized = JSON.parse(data) as SerializedGraph<EngineEvent, EdgeAttributes>;
      this.graph.import(serialized);
    } catch (error) {
      console.log('No existing graph found, starting fresh');
    }
  }

  addEvent(event: EngineEvent): void {
    this.graph.addNode(event.id, event);
  }

  addRelation(from: string, to: string, type: string, properties: object = {}): void {
    this.graph.addEdge(from, to, { type, ...properties });
  }

  getNeighbors(nodeId: string, depth: number = 1): EngineEvent[] {
    return Array.from(this.graph.neighbors(nodeId))
      .map(id => this.graph.getNodeAttributes(id) as EngineEvent);
  }

  query(timelineId?: string, depth: number = 3): EngineEvent[] {
    return Array.from(this.graph.nodes())
      .map(id => this.graph.getNodeAttributes(id) as EngineEvent)
      .filter(event => !timelineId || event.timelineId === timelineId)
      .slice(0, depth);
  }
} 