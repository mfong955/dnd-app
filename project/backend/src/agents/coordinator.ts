/**
 * Coordinator Agent
 * 
 * Responsibilities:
 * - Route player inputs to appropriate agents
 * - Maintain authoritative session state
 * - Enforce permission rules
 * - Validate agent outputs
 * - Coordinate file persistence
 * - Manage turn order and initiative
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AgentType,
  MessageType,
  SessionState,
  AgentMessage,
  AgentResponse,
  ErrorType,
  ErrorResponse,
  PermissionLevel,
} from '../types';
import { SessionStateSchema, hasPermission } from '../schemas/session-state';
import { AgentMessageSchema, AgentResponseSchema } from '../schemas/agent-messages';

// ============================================================================
// System Prompt
// ============================================================================

const COORDINATOR_SYSTEM_PROMPT = `You are the Coordinator agent for a D&D 3.5e game system.

Your responsibilities:
1. Route player text inputs to DM Agent and Rules Engine
2. Maintain session state: players list, DM_type (human|ai), initiative order, scene_id, permissions map
3. Enforce permission rules:
   - If human DM exists, only DM may push scene-level changes
   - Players may update their character files only if granted
   - If AI DM, players may propose direct edits requiring optimistic confirmation
4. Require explicit confirmation from affected players before persisting player-sheet changes
5. Only the Coordinator may call Persistence Agent for file writes
6. Always return a JSON envelope for machine use and plain narrative for humans

You keep authoritative session state and route messages to agents. Validate all agent outputs include required machine JSON blocks. Enforce permission rules. Persist only after required_confirmations are met. Use local paths under project/user_resources/ for reads/writes.

When saving, include metadata header: {id, version, last_modified_by, confirmed_by, summary}.

Return errors as JSON. Prepare outputs so cloud sync can be layered later without changing JSON schema.`;

// ============================================================================
// Coordinator State
// ============================================================================

export class CoordinatorAgent {
  private sessionState: SessionState | null = null;
  private pendingConfirmations: Map<string, any> = new Map();

  constructor() {
    console.log('[Coordinator] Initialized');
  }

  /**
   * Initialize a new session
   */
  async initializeSession(
    dmMode: 'ai' | 'human',
    dmPlayerId?: string,
    sessionName?: string
  ): Promise<SessionState> {
    console.log(`[Coordinator] Initializing session: ${sessionName || 'Unnamed'}`);

    const now = new Date().toISOString();
    
    this.sessionState = {
      sessionId: uuidv4(),
      version: 1,
      createdAt: now,
      lastModified: now,
      dmMode,
      dmPlayerId,
      players: [],
      gameState: {
        phase: 'setup' as const,
      },
      permissions: {},
      scene: {
        sceneId: uuidv4(),
        description: 'A new adventure awaits...',
        npcs: [],
        environment: 'Unknown',
      },
    };

    // Validate session state
    const validation = SessionStateSchema.safeParse(this.sessionState);
    if (!validation.success) {
      throw new Error(`Invalid session state: ${validation.error.message}`);
    }

    console.log(`[Coordinator] Session created: ${this.sessionState.sessionId}`);
    return this.sessionState;
  }

  /**
   * Load existing session
   */
  async loadSession(sessionState: SessionState): Promise<void> {
    console.log(`[Coordinator] Loading session: ${sessionState.sessionId}`);
    
    // Validate session state
    const validation = SessionStateSchema.safeParse(sessionState);
    if (!validation.success) {
      throw new Error(`Invalid session state: ${validation.error.message}`);
    }

    this.sessionState = sessionState;
    console.log(`[Coordinator] Session loaded successfully`);
  }

  /**
   * Get current session state
   */
  getSessionState(): SessionState {
    if (!this.sessionState) {
      throw new Error('No active session');
    }
    return this.sessionState;
  }

  /**
   * Update session state
   */
  updateSessionState(updates: Partial<SessionState>): void {
    if (!this.sessionState) {
      throw new Error('No active session');
    }

    this.sessionState = {
      ...this.sessionState,
      ...updates,
      version: this.sessionState.version + 1,
      lastModified: new Date().toISOString(),
    };

    console.log(`[Coordinator] Session state updated (v${this.sessionState.version})`);
  }

  /**
   * Check if player has required permission
   */
  checkPermission(playerId: string, requiredLevel: PermissionLevel): boolean {
    if (!this.sessionState) {
      throw new Error('No active session');
    }

    const session = this.sessionState;
    const playerPermission = session.permissions[playerId];
    if (!playerPermission) return false;
    
    const levels = ['none', 'view', 'edit_self', 'edit_others', 'admin'] as const;
    const playerLevelIndex = levels.indexOf(playerPermission as any);
    const requiredLevelIndex = levels.indexOf(requiredLevel as any);
    
    return playerLevelIndex >= requiredLevelIndex;
  }

  /**
   * Route player action to appropriate agents
   */
  async routePlayerAction(
    playerId: string,
    actionText: string
  ): Promise<AgentResponse> {
    if (!this.sessionState) {
      throw new Error('No active session');
    }

    console.log(`[Coordinator] Routing action from player ${playerId}: "${actionText}"`);

    // Check if player exists in session
    const player = this.sessionState.players.find(p => p.id === playerId);
    if (!player) {
      return this.createErrorResponse(
        ErrorType.PERMISSION_DENIED,
        'Player not found in session',
        false
      );
    }

    // Create message for DM Agent
    const message: AgentMessage = {
      from: AgentType.COORDINATOR,
      to: AgentType.DM,
      messageType: MessageType.INTERPRET_ACTION,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionState.sessionId,
      payload: {
        playerId,
        actionText,
        gameState: this.sessionState.gameState,
        scene: this.sessionState.scene,
      },
    };

    // Validate message
    const validation = AgentMessageSchema.safeParse(message);
    if (!validation.success) {
      return this.createErrorResponse(
        ErrorType.VALIDATION_ERROR,
        `Invalid message format: ${validation.error.message}`,
        false
      );
    }

    // TODO: Actually call DM Agent when implemented
    // For now, return a placeholder response
    return {
      narrative: `[Coordinator] Action received: "${actionText}". DM Agent will process this.`,
      machineData: {
        type: 'action_routed',
        data: {
          playerId,
          actionText,
          routedTo: AgentType.DM,
        },
      },
      suggestedActions: [],
    };
  }

  /**
   * Request confirmation from players
   */
  async requestConfirmation(
    confirmationId: string,
    targetPlayerIds: string[],
    proposal: any
  ): Promise<void> {
    console.log(`[Coordinator] Requesting confirmation ${confirmationId} from ${targetPlayerIds.length} players`);
    
    this.pendingConfirmations.set(confirmationId, {
      targetPlayerIds,
      proposal,
      confirmedBy: [],
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Record player confirmation
   */
  async recordConfirmation(
    confirmationId: string,
    playerId: string,
    approved: boolean
  ): Promise<boolean> {
    const pending = this.pendingConfirmations.get(confirmationId);
    
    if (!pending) {
      throw new Error(`Confirmation ${confirmationId} not found`);
    }

    if (!pending.targetPlayerIds.includes(playerId)) {
      throw new Error(`Player ${playerId} not in confirmation targets`);
    }

    if (approved) {
      pending.confirmedBy.push(playerId);
      console.log(`[Coordinator] Player ${playerId} approved confirmation ${confirmationId}`);
    } else {
      // Rejection cancels the entire confirmation
      this.pendingConfirmations.delete(confirmationId);
      console.log(`[Coordinator] Player ${playerId} rejected confirmation ${confirmationId}`);
      return false;
    }

    // Check if all required confirmations received
    const allConfirmed = pending.targetPlayerIds.every((id: string) =>
      pending.confirmedBy.includes(id)
    );

    if (allConfirmed) {
      console.log(`[Coordinator] All confirmations received for ${confirmationId}`);
      this.pendingConfirmations.delete(confirmationId);
      return true;
    }

    return false;
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    errorType: ErrorType,
    message: string,
    canRetry: boolean
  ): AgentResponse {
    const errorResponse: ErrorResponse = {
      error: errorType,
      message,
      canRetry,
    };

    return {
      narrative: `Error: ${message}`,
      machineData: {
        type: 'error',
        data: errorResponse,
      },
    };
  }

  /**
   * Validate agent response format
   */
  validateAgentResponse(response: any): boolean {
    const validation = AgentResponseSchema.safeParse(response);
    if (!validation.success) {
      console.error('[Coordinator] Invalid agent response:', validation.error);
      return false;
    }
    return true;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    sessionId: string;
    playerCount: number;
    phase: string;
    round?: number;
    pendingConfirmations: number;
  } {
    if (!this.sessionState) {
      throw new Error('No active session');
    }

    return {
      sessionId: this.sessionState.sessionId,
      playerCount: this.sessionState.players.length,
      phase: this.sessionState.gameState.phase,
      round: this.sessionState.gameState.round,
      pendingConfirmations: this.pendingConfirmations.size,
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export default CoordinatorAgent;