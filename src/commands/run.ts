import { Command } from 'commander';
import { ContinuumEngine } from '../core/engine';
import readline from 'readline';

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Start interactive character development session')
    .action(async () => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const engine = new ContinuumEngine(process.env.OPENAI_API_KEY!);
      
      console.log('\n🌀 Continuum Engine Interactive Session\n');
      console.log('Type your questions or commands (exit to quit)\n');

      while (true) {
        const input = await question(rl, '> ');
        
        if (input.toLowerCase() === 'exit') {
          break;
        }

        try {
          const result = await engine.query(input);
          displayResult(result);
        } catch (error) {
          console.error('Error:', error);
        }
      }

      rl.close();
    });
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

function displayResult(result: any): void {
  console.log('\nResponse:', result.context);
  
  if (result.explorationPaths.length > 0) {
    console.log('\nSuggested explorations:');
    result.explorationPaths.forEach((path: string, i: number) => {
      console.log(`${i + 1}. ${path}`);
    });
  }
  console.log('\n');
} 