import fs from 'fs/promises';
import path from 'path';

export async function createCharacter(name, config) {
  const characterSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const outputDir = `./output/${characterSlug}`;
  const configPath = path.join(outputDir, 'config.json');

  // Create character config with expanded properties
  const characterConfig = {
    name: name,
    // Core attributes
    type: config.type || 'human', // human, alien, ai, mythical, etc.
    birthDate: config.birthDate || null,
    originLocation: config.originLocation || null,
    timelineCutoff: config.timelineCutoff || "2024-11-15",
    
    // Physical characteristics
    physicalDescription: config.physicalDescription || null,
    lifespan: config.lifespan || null, // e.g. "80 years", "immortal", "unknown"
    biology: config.biology || null, // e.g. "carbon-based", "silicon-based", "energy being"
    
    // Cultural and environmental context
    culture: config.culture || null,
    environment: config.environment || null,
    technology: config.technology || null,
    
    // Key life events and characteristics
    notableEvents: config.notableEvents || [],
    abilities: config.abilities || [],
    relationships: config.relationships || [],
    goals: config.goals || [],
    challenges: config.challenges || [],
    
    // Narrative configuration
    basePrompt: config.basePrompt || generateBasePrompt(name, config),
    narrativeStyle: config.narrativeStyle || 'neutral', // academic, mythological, personal, etc.
    timelineStructure: config.timelineStructure || 'linear', // linear, cyclical, branching, etc.
    
    // Custom fields for unique character aspects
    customAttributes: config.customAttributes || {}
  };

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Write config file
  await fs.writeFile(
    configPath,
    JSON.stringify(characterConfig, null, 2)
  );

  console.log(`Created character configuration for ${name} at ${configPath}`);
  return characterConfig;
}

function generateBasePrompt(name, config) {
  const type = config.type || 'human';
  const context = [];

  if (config.type && config.type !== 'human') {
    context.push(`${name} is a ${config.type}`);
  }

  if (config.biology) {
    context.push(`with ${config.biology} biology`);
  }

  if (config.environment) {
    context.push(`living in ${config.environment}`);
  }

  if (config.culture) {
    context.push(`within ${config.culture}`);
  }

  if (config.technology) {
    context.push(`using ${config.technology}`);
  }

  const baseContext = context.length > 0 
    ? context.join(' ') 
    : `the story of ${name}`;

  return `You are enriching and expanding the details of an alternate timeline about ${baseContext}.`;
}

// Example usage:
// await createCharacter("Zyx-427", {
//   type: "alien",
//   biology: "crystalline-based life form",
//   environment: "a high-pressure methane atmosphere",
//   culture: "a collective consciousness society",
//   technology: "quantum crystalline computing",
//   physicalDescription: "A translucent crystalline entity that absorbs nutrients through surface osmosis",
//   lifespan: "several millennia",
//   notableEvents: [
//     "First consciousness emergence",
//     "Integration with collective mind",
//     "Discovery of quantum communication"
//   ],
//   abilities: [
//     "Quantum entanglement communication",
//     "Crystalline regeneration",
//     "Collective memory access"
//   ],
//   timelineStructure: "branching",
//   narrativeStyle: "collective-perspective"
// });
