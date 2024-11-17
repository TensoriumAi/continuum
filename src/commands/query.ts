import { Command } from 'commander';
import { ContinuumEngine } from '../core/engine';
import { QueryResult } from '../core/types';

export function registerQueryCommand(program: Command): void {
  program
    .command('query')
    .description('Query the character narrative')
    .argument('<question>', 'The question to ask about the character narrative')
    .option('-t, --timeline <timeline>', 'Specific timeline to query')
    .option('-d, --depth <depth>', 'Search depth for related events', '3')
    .action(async (question: string, options: any) => {
      try {
        const engine = new ContinuumEngine(process.env.OPENAI_API_KEY!);
        const result = await engine.query(question, {
          timeline: options.timeline,
          depth: parseInt(options.depth)
        });
        
        displayQueryResult(result);
      } catch (error) {
        console.error('Query failed:', error);
        process.exit(1);
      }
    });
}

function displayQueryResult(result: QueryResult): void {
  console.log('\n> Analyzing character timeline...');
  console.log(`> ${result.context}\n`);
  
  if (result.explorationPaths.length > 0) {
    console.log('> Explore:');
    result.explorationPaths.forEach((path, index) => {
      console.log(`  ${index + 1}. ${path}`);
    });
  }
} 