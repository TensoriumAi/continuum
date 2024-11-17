#!/usr/bin/env node
import { Command } from 'commander'
import { registerInitCommand } from './commands/init'
import { registerQueryCommand } from './commands/query'
import { registerRunCommand } from './commands/run'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const program = new Command()

program
  .name('continuum')
  .description('Continuum Engine - AI Character Evolution System')
  .version('1.0.0')

// Register commands
registerInitCommand(program)
registerQueryCommand(program)
registerRunCommand(program)

// Parse command line arguments first
program.parse()

// Then check if we should show help
if (!process.argv.slice(2).length) {
  program.outputHelp()
} 