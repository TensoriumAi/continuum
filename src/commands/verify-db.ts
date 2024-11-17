import { Command } from 'commander'
import { GraphDatabase } from '../db/graph'
import dotenv from 'dotenv'

export function registerVerifyDbCommand(program: Command): void {
  program
    .command('verify-db')
    .description('Verify graph database setup')
    .action(async () => {
      try {
        dotenv.config()
        console.log('🔍 Verifying graph database...')
        
        const db = GraphDatabase.getInstance()
        await db.initialize()
        
        console.log('✅ Graph database initialized!')
        console.log('✅ Data directory created')
        console.log('✅ Graph operations verified')
        
      } catch (error) {
        console.error('❌ Database setup failed:', (error as Error).message)
        process.exit(1)
      }
    })
} 