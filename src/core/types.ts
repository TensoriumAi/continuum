export interface EngineEvent {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  timelineId: string;
  tags?: string[];
  importance?: number;
  expansionPrompt?: string;
}

export interface Timeline {
  id: string;
  branchPoint?: string;
  convergencePoints?: string[];
  active: boolean;
  metadata: {
    theme?: string;
    probability?: number;
  };
}

export interface Character {
  id: string;
  name: string;
  description: string;
  currentTimeline: string;
  traits: Map<string, number>;
  memories: string[];
}

export interface QueryResult {
  events: EngineEvent[];
  context: string;
  explorationPaths: string[];
}

export interface EngineState {
  character: Character;
  activeTimelines: Timeline[];
  lastQuery?: string;
  lastResponse?: string;
} 