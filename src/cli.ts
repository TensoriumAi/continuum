#!/usr/bin/env node
import { Command } from 'commander'
import { registerInitCommand } from './commands/init'
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

// Parse command line arguments
program.parse() 