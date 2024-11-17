import neo4j, { Driver, Session } from 'neo4j-driver'

export class Neo4jConnection {
  private driver: Driver | null = null
  private static instance: Neo4jConnection

  private constructor() {}

  static getInstance(): Neo4jConnection {
    if (!Neo4jConnection.instance) {
      Neo4jConnection.instance = new Neo4jConnection()
    }
    return Neo4jConnection.instance
  }

  async connect(uri: string = 'neo4j://localhost', 
                username: string = 'neo4j', 
                password: string = 'password'): Promise<void> {
    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
      // Verify connection
      await this.driver.verifyConnectivity()
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error)
      throw error
    }
  }

  async getSession(): Promise<Session> {
    if (!this.driver) {
      throw new Error('Database connection not initialized')
    }
    return this.driver.session()
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close()
      this.driver = null
    }
  }
} 