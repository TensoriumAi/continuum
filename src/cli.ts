#!/usr/bin/env node
import { Command } from 'commander'
import { registerInitCommand } from './commands/init'
import { registerQueryCommand } from './commands/query'
import { registerRunCommand } from './commands/run'
import { registerVerifyDbCommand } from './commands/verify-db'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const program = new Command()

// Add error handling for uncaught promises
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error)
  process.exit(1)
})

program
  .name('continuum')
  .description('Continuum Engine - AI Character Evolution System')
  .version('1.0.0')
  .exitOverride()

// Register commands
registerInitCommand(program)
registerQueryCommand(program)
registerRunCommand(program)
registerVerifyDbCommand(program)

async function main() {
  try {
    await program.parseAsync(process.argv)
    
    // Only show help if no commands were run
    if (!process.argv.slice(2).length) {
      program.outputHelp()
      process.exit(0)
    }
  } catch (error) {
    // Handle commander.js exit signals
    if ((error as any).code === 'commander.help') {
      process.exit(0)
    }
    
    console.error('Error:', error)
    process.exit(1)
  }
}

// Run the CLI
main() 