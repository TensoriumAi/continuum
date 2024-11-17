import { Command } from 'commander'
import { ContinuumEngine } from '../core/engine'

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize a new character narrative')
    .argument('<narrative>', 'The seed narrative for the character')
    .action(async (narrative: string) => {
      try {
        const engine = new ContinuumEngine(process.env.OPENAI_API_KEY!)
        await engine.initialize(narrative)
        console.log('✨ Character initialized successfully')
      } catch (error) {
        console.error('Failed to initialize character:', error)
        process.exit(1)
      }
    })
} 