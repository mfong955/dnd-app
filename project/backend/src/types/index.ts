/**
 * Core type definitions for the DnD App backend
 */

// ============================================================================
// Agent Types
// ============================================================================

export enum AgentType {
  COORDINATOR = 'coordinator',
  DM = 'dm',
  RULES_ENGINE = 'rules_engine',
  PLAYER = 'player',
  PERSISTENCE = 'persistence'
}

export enum MessageType {
  // Coordinator messages
  ROUTE_ACTION = 'route_action',
  SESSION_INIT = 'session_init',
  PERMISSION_CHECK = 'permission_check',
  
  // DM messages
  INTERPRET_ACTION = 'interpret_action',
  GENERATE_NARRATIVE = 'generate_narrative',
  SUGGEST_ACTIONS = 'suggest_actions',
  
  // Rules Engine messages
  VALIDATE_ACTION = 'validate_action',
  RESOLVE_ROLL = 'resolve_roll',
  APPLY_EFFECT = 'apply_effect',
  
  // Player messages
  PROPOSE_EDIT = 'propose_edit',
  GET_CHARACTER = 'get_character',
  UPDATE_RESOURCE = 'update_resource',
  
  // Persistence messages
  READ_FILE = 'read_file',
  WRITE_FILE = 'write_file',
  SAVE_SESSION = 'save_session'
}

// ============================================================================
// Permission System
// ============================================================================

export enum PermissionLevel {
  NONE = 0,
  VIEW = 1,
  EDIT_SELF = 2,
  EDIT_OTHERS = 3,
  ADMIN = 4
}

export interface PermissionMap {
  [playerId: string]: PermissionLevel;
}

// ============================================================================
// Session State
// ============================================================================

export type DMMode = 'ai' | 'human';
export type GamePhase = 'setup' | 'exploration' | 'combat' | 'paused';

export interface SessionState {
  sessionId: string;
  version: number;
  createdAt: string;
  lastModified: string;
  
  dmMode: DMMode;
  dmPlayerId?: string;
  
  players: PlayerInfo[];
  
  gameState: {
    phase: GamePhase;
    currentTurn?: string;
    initiativeOrder?: string[];
    round?: number;
  };
  
  permissions: PermissionMap;
  
  scene: SceneInfo;
}

export interface PlayerInfo {
  id: string;
  name: string;
  characterId: string;
  isAI: boolean;
  isConnected: boolean;
  joinedAt: string;
}

export interface SceneInfo {
  sceneId: string;
  description: string;
  npcs: NPC[];
  environment: string;
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  hp: { current: number; max: number };
  ac: number;
  isHostile: boolean;
}

// ============================================================================
// Character Sheet
// ============================================================================

export interface CharacterSheet {
  // Metadata
  id: string;
  version: number;
  lastModified: string;
  lastModifiedBy: string;
  confirmedBy: string[];
  
  // Basic Info
  name: string;
  race: string;
  class: string;
  level: number;
  alignment: string;
  
  // Ability Scores
  abilities: AbilityScores;
  
  // Combat Stats
  hp: HitPoints;
  ac: number;
  initiative: number;
  speed: number;
  
  // Skills, Feats, Spells
  skills: Skill[];
  feats: Feat[];
  spells: Spell[];
  
  // Equipment & Inventory
  equipment: Item[];
  inventory: Item[];
  
  // Status
  conditions: Condition[];
  buffs: Buff[];
  
  // Resources
  resources: {
    [key: string]: { current: number; max: number };
  };
}

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface HitPoints {
  current: number;
  max: number;
  temporary: number;
}

export interface Skill {
  name: string;
  ranks: number;
  modifier: number;
  isClassSkill: boolean;
}

export interface Feat {
  name: string;
  description: string;
  prerequisites?: string[];
}

export interface Spell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
  prepared?: boolean;
}

export interface Item {
  id: string;
  name: string;
  type: string;
  weight: number;
  value: number;
  description: string;
  equipped?: boolean;
  quantity?: number;
}

export interface Condition {
  name: string;
  description: string;
  duration?: string;
  source?: string;
}

export interface Buff {
  name: string;
  description: string;
  modifier: number;
  target: string;
  duration?: string;
}

// ============================================================================
// Agent Messages
// ============================================================================

export interface AgentMessage {
  from: AgentType;
  to: AgentType;
  messageType: MessageType;
  timestamp: string;
  sessionId: string;
  payload: any;
  metadata?: {
    requiresConfirmation?: boolean;
    priority?: 'low' | 'normal' | 'high';
    correlationId?: string;
  };
}

export interface AgentResponse {
  narrative: string;
  machineData: {
    type: string;
    data: any;
    validations?: ValidationResult[];
  };
  suggestedActions?: Action[];
  requiresConfirmation?: boolean;
  confirmationTargets?: string[];
}

export interface Action {
  id: string;
  label: string;
  type: 'movement' | 'attack' | 'spell' | 'skill' | 'item' | 'other';
  description: string;
  requirements?: string[];
  cost?: {
    movement?: number;
    action?: 'standard' | 'move' | 'full' | 'swift' | 'free';
    resource?: { name: string; amount: number };
  };
}

export interface ValidationResult {
  valid: boolean;
  field?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// Rules Engine Types
// ============================================================================

export interface RollResult {
  d20: number;
  modifiers: number[];
  total: number;
  criticalHit?: boolean;
  criticalMiss?: boolean;
}

export interface RulesResolution {
  success: boolean;
  roll?: RollResult;
  dc?: number;
  effectSummary: string;
  hpDelta?: number;
  statusChanges?: StatusChange[];
  resolutionNotes: string[];
}

export interface StatusChange {
  target: string;
  type: 'condition' | 'buff' | 'resource';
  change: any;
}

// ============================================================================
// Persistence Types
// ============================================================================

export interface FileMetadata {
  id: string;
  version: number;
  lastModified: string;
  lastModifiedBy: string;
  confirmedBy?: string[];
  syncStatus?: 'local' | 'synced' | 'conflict';
  cloudVersion?: number;
}

export interface WriteRequest {
  path: string;
  expectedVersion: number;
  content: any;
  modifiedBy: string;
}

export interface WriteResponse {
  success: boolean;
  newVersion?: number;
  conflict?: {
    expectedVersion: number;
    actualVersion: number;
    lastModifiedBy: string;
  };
  error?: string;
}

export interface ReadRequest {
  path: string;
}

export interface ReadResponse {
  success: boolean;
  content?: any;
  metadata?: FileMetadata;
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorType {
  PERMISSION_DENIED = 'permission_denied',
  INVALID_ACTION = 'invalid_action',
  RULE_VIOLATION = 'rule_violation',
  STATE_CONFLICT = 'state_conflict',
  PERSISTENCE_ERROR = 'persistence_error',
  VALIDATION_ERROR = 'validation_error',
  AGENT_ERROR = 'agent_error',
  TIMEOUT = 'timeout'
}

export interface ErrorResponse {
  error: ErrorType;
  message: string;
  details?: any;
  suggestedFix?: string;
  canRetry: boolean;
}

// ============================================================================
// Character Edit Proposal
// ============================================================================

export interface CharacterEditProposal {
  characterId: string;
  proposedBy: string;
  timestamp: string;
  fieldChanges: FieldChange[];
  requiredConfirmations: string[];
  summary: string;
}

export interface FieldChange {
  path: string;
  oldValue: any;
  newValue: any;
  reason?: string;
}

// ============================================================================
// DM Agent Types
// ============================================================================

export interface PlayerAction {
  playerId: string;
  actionText: string;
  timestamp: string;
}

export interface ActionInterpretation {
  intent: string;
  actionType: string;
  targets?: string[];
  parameters?: { [key: string]: any };
  needsConfirmation: boolean;
  ambiguities?: string[];
}

// ============================================================================
// Combat Types
// ============================================================================

export interface InitiativeRoll {
  entityId: string;
  entityName: string;
  roll: number;
  modifier: number;
  total: number;
}

export interface CombatAction {
  actorId: string;
  actionType: 'attack' | 'spell' | 'move' | 'item' | 'other';
  targetId?: string;
  description: string;
  resolution?: RulesResolution;
}