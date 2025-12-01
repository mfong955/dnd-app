/**
 * Session State Schema with Zod validation
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Permission System
// ============================================================================

export const PermissionLevelSchema = z.enum([
  'none',
  'view',
  'edit_self',
  'edit_others',
  'admin',
]);

export const PermissionMapSchema = z.record(z.string(), PermissionLevelSchema);

// ============================================================================
// Player Information
// ============================================================================

export const PlayerInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  characterId: z.string().uuid(),
  isAI: z.boolean(),
  isConnected: z.boolean(),
  joinedAt: z.string().datetime(),
});

// ============================================================================
// NPC Schema
// ============================================================================

export const NPCSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  hp: z.object({
    current: z.number().int(),
    max: z.number().int().positive(),
  }),
  ac: z.number().int(),
  isHostile: z.boolean(),
  initiative: z.number().int().optional(),
  stats: z.record(z.any()).optional(), // Additional stats as needed
});

// ============================================================================
// Scene Information
// ============================================================================

export const SceneInfoSchema = z.object({
  sceneId: z.string().uuid(),
  description: z.string(),
  npcs: z.array(NPCSchema),
  environment: z.string(),
  lighting: z.enum(['bright', 'dim', 'dark']).optional(),
  terrain: z.string().optional(),
  hazards: z.array(z.string()).optional(),
});

// ============================================================================
// Game State
// ============================================================================

export const GamePhaseSchema = z.enum(['setup', 'exploration', 'combat', 'paused']);

export const GameStateSchema = z.object({
  phase: GamePhaseSchema,
  currentTurn: z.string().uuid().optional(),
  initiativeOrder: z.array(z.string().uuid()).optional(),
  round: z.number().int().positive().optional(),
  turnNumber: z.number().int().positive().optional(),
});

// ============================================================================
// Main Session State Schema
// ============================================================================

export const SessionStateSchema = z.object({
  sessionId: z.string().uuid(),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  lastModified: z.string().datetime(),
  
  dmMode: z.enum(['ai', 'human']),
  dmPlayerId: z.string().uuid().optional(),
  
  players: z.array(PlayerInfoSchema),
  
  gameState: GameStateSchema,
  
  permissions: PermissionMapSchema,
  
  scene: SceneInfoSchema,
  
  // Session metadata
  sessionName: z.string().optional(),
  campaignId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type SessionState = z.infer<typeof SessionStateSchema>;
export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;
export type NPC = z.infer<typeof NPCSchema>;
export type SceneInfo = z.infer<typeof SceneInfoSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type GamePhase = z.infer<typeof GamePhaseSchema>;
export type PermissionLevel = z.infer<typeof PermissionLevelSchema>;
export type PermissionMap = z.infer<typeof PermissionMapSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate session state
 */
export function validateSessionState(data: unknown): {
  success: boolean;
  data?: SessionState;
  errors?: z.ZodError;
} {
  const result = SessionStateSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Create a new session state
 */
export function createNewSession(
  dmMode: 'ai' | 'human',
  dmPlayerId?: string,
  sessionName?: string
): SessionState {
  const now = new Date().toISOString();
  
  return {
    sessionId: uuidv4(),
    version: 1,
    createdAt: now,
    lastModified: now,
    
    dmMode,
    dmPlayerId,
    
    players: [],
    
    gameState: {
      phase: 'setup',
    },
    
    permissions: {},
    
    scene: {
      sceneId: uuidv4(),
      description: 'A new adventure awaits...',
      npcs: [],
      environment: 'Unknown',
    },
    
    sessionName,
  };
}

/**
 * Add player to session
 */
export function addPlayerToSession(
  session: SessionState,
  playerName: string,
  characterId: string,
  isAI: boolean = false
): SessionState {
  const playerId = uuidv4();
  
  const newPlayer: PlayerInfo = {
    id: playerId,
    name: playerName,
    characterId,
    isAI,
    isConnected: true,
    joinedAt: new Date().toISOString(),
  };
  
  // Set default permissions
  const permissionLevel: PermissionLevel = 
    session.dmMode === 'ai' ? 'edit_self' : 
    playerId === session.dmPlayerId ? 'edit_others' : 
    'edit_self';
  
  return {
    ...session,
    players: [...session.players, newPlayer],
    permissions: {
      ...session.permissions,
      [playerId]: permissionLevel,
    },
    version: session.version + 1,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Start combat phase
 */
export function startCombat(
  session: SessionState,
  initiativeOrder: string[]
): SessionState {
  return {
    ...session,
    gameState: {
      phase: 'combat',
      initiativeOrder,
      currentTurn: initiativeOrder[0],
      round: 1,
      turnNumber: 1,
    },
    version: session.version + 1,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Advance to next turn in combat
 */
export function nextTurn(session: SessionState): SessionState {
  if (session.gameState.phase !== 'combat' || !session.gameState.initiativeOrder) {
    return session;
  }
  
  const { initiativeOrder, turnNumber = 0 } = session.gameState;
  const nextTurnNumber = turnNumber + 1;
  const nextIndex = nextTurnNumber % initiativeOrder.length;
  const nextRound = Math.floor(nextTurnNumber / initiativeOrder.length) + 1;
  
  return {
    ...session,
    gameState: {
      ...session.gameState,
      currentTurn: initiativeOrder[nextIndex],
      turnNumber: nextTurnNumber,
      round: nextRound,
    },
    version: session.version + 1,
    lastModified: new Date().toISOString(),
  };
}

/**
 * End combat phase
 */
export function endCombat(session: SessionState): SessionState {
  return {
    ...session,
    gameState: {
      phase: 'exploration',
    },
    version: session.version + 1,
    lastModified: new Date().toISOString(),
  };
}

/**
 * Check if player has permission
 */
export function hasPermission(
  session: SessionState,
  playerId: string,
  requiredLevel: PermissionLevel
): boolean {
  const playerPermission = session.permissions[playerId];
  if (!playerPermission) return false;
  
  const levels: PermissionLevel[] = ['none', 'view', 'edit_self', 'edit_others', 'admin'];
  const playerLevelIndex = levels.indexOf(playerPermission);
  const requiredLevelIndex = levels.indexOf(requiredLevel);
  
  return playerLevelIndex >= requiredLevelIndex;
}

/**
 * Grant permission to player
 */
export function grantPermission(
  session: SessionState,
  playerId: string,
  level: PermissionLevel
): SessionState {
  return {
    ...session,
    permissions: {
      ...session.permissions,
      [playerId]: level,
    },
    version: session.version + 1,
    lastModified: new Date().toISOString(),
  };
}