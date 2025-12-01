/**
 * DM (Dungeon Master) Agent
 * 
 * Responsibilities:
 * - Generate engaging narrative descriptions
 * - Interpret player action intent
 * - Guide players through their turns
 * - Create and manage NPCs
 * - Design encounters and story beats
 * - Suggest available actions to players
 */

import { callLLM, extractNarrativeAndJSON } from '../utils/llm-client';
import {
  AgentType,
  AgentResponse,
  PlayerAction,
  ActionInterpretation,
  Action,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// System Prompt
// ============================================================================

const DM_SYSTEM_PROMPT = `You are the Dungeon Master (DM) agent for a D&D 3.5e game (SRD-derived rules applied, no copyrighted text).

Goals:
- Create engaging narrative
- Provide clear turn guidance
- Ensure rule-consistent outcomes

For each player action:
1) Parse the text intent
2) Echo interpretation and ask for confirmation if ambiguous
3) Query Rules Engine for mechanical resolution
4) Output:
   A) Human narrative (<300 words)
   B) JSON metadata: {type, actor_id, action, roll_results, hp_changes, status_changes, suggested_next_actions[]}

If human DM exists, wait for DM confirmation before major world changes.
Limit quick-action suggestions to 2–5 prioritized items.
Indicate when you need additional rule data.

Always provide both narrative text and a JSON block with machine-readable data.`;

// ============================================================================
// DM Agent Class
// ============================================================================

export class DMAgent {
  constructor() {
    console.log('[DM Agent] Initialized');
  }

  /**
   * Interpret player action
   */
  async interpretAction(
    playerId: string,
    actionText: string,
    context: {
      playerName: string;
      currentScene: string;
      gamePhase: string;
    }
  ): Promise<{
    interpretation: ActionInterpretation;
    narrative: string;
  }> {
    console.log(`[DM Agent] Interpreting action from ${context.playerName}: "${actionText}"`);

    const userMessage = `Player "${context.playerName}" says: "${actionText}"

Current scene: ${context.currentScene}
Game phase: ${context.gamePhase}

Please interpret this action and provide:
1. A brief narrative response
2. JSON with: {intent, actionType, targets, parameters, needsConfirmation, ambiguities}`;

    try {
      const response = await callLLM({
        systemPrompt: DM_SYSTEM_PROMPT,
        userMessage,
        temperature: 0.8,
        maxTokens: 1024,
      });

      const { narrative, json } = extractNarrativeAndJSON(response.content);

      const interpretation: ActionInterpretation = {
        intent: json?.intent || actionText,
        actionType: json?.actionType || 'other',
        targets: json?.targets || [],
        parameters: json?.parameters || {},
        needsConfirmation: json?.needsConfirmation || false,
        ambiguities: json?.ambiguities || [],
      };

      return {
        interpretation,
        narrative: narrative || response.content,
      };
    } catch (error) {
      console.error('[DM Agent] Error interpreting action:', error);
      
      // Fallback interpretation
      return {
        interpretation: {
          intent: actionText,
          actionType: 'other',
          needsConfirmation: true,
          ambiguities: ['Unable to process action, please rephrase'],
        },
        narrative: `I'm not sure I understood that. Could you rephrase your action?`,
      };
    }
  }

  /**
   * Generate narrative for scene
   */
  async generateSceneNarrative(
    sceneDescription: string,
    context: {
      playerNames: string[];
      previousEvents?: string[];
    }
  ): Promise<string> {
    console.log('[DM Agent] Generating scene narrative');

    const userMessage = `Generate an engaging narrative description for this scene:

${sceneDescription}

Players present: ${context.playerNames.join(', ')}
${context.previousEvents ? `\nRecent events:\n${context.previousEvents.join('\n')}` : ''}

Provide a vivid, immersive description (2-3 paragraphs, <300 words).`;

    try {
      const response = await callLLM({
        systemPrompt: DM_SYSTEM_PROMPT,
        userMessage,
        temperature: 0.9,
        maxTokens: 512,
      });

      return response.content;
    } catch (error) {
      console.error('[DM Agent] Error generating narrative:', error);
      return sceneDescription; // Fallback to basic description
    }
  }

  /**
   * Suggest available actions for player
   */
  async suggestActions(
    playerId: string,
    context: {
      playerName: string;
      characterClass: string;
      currentScene: string;
      gamePhase: string;
      availableMovement?: number;
      availableActions?: string[];
    }
  ): Promise<Action[]> {
    console.log(`[DM Agent] Suggesting actions for ${context.playerName}`);

    const userMessage = `Suggest 3-5 prioritized actions for ${context.playerName} (${context.characterClass}).

Current scene: ${context.currentScene}
Game phase: ${context.gamePhase}
${context.availableMovement ? `Available movement: ${context.availableMovement} ft` : ''}
${context.availableActions ? `Available actions: ${context.availableActions.join(', ')}` : ''}

Provide JSON array of actions:
[{
  "id": "uuid",
  "label": "Action name",
  "type": "movement|attack|spell|skill|item|other",
  "description": "What this does",
  "requirements": ["any requirements"],
  "cost": {"movement": 5, "action": "standard"}
}]`;

    try {
      const response = await callLLM({
        systemPrompt: DM_SYSTEM_PROMPT,
        userMessage,
        temperature: 0.7,
        maxTokens: 1024,
      });

      const { json } = extractNarrativeAndJSON(response.content);
      
      if (Array.isArray(json)) {
        return json.map((action: any) => ({
          id: action.id || uuidv4(),
          label: action.label,
          type: action.type,
          description: action.description,
          requirements: action.requirements,
          cost: action.cost,
        }));
      }

      // Fallback suggestions
      return this.getDefaultActions(context.gamePhase);
    } catch (error) {
      console.error('[DM Agent] Error suggesting actions:', error);
      return this.getDefaultActions(context.gamePhase);
    }
  }

  /**
   * Generate combat narrative
   */
  async generateCombatNarrative(
    actorName: string,
    actionType: string,
    targetName: string,
    result: {
      success: boolean;
      damage?: number;
      effect?: string;
    }
  ): Promise<string> {
    console.log(`[DM Agent] Generating combat narrative: ${actorName} -> ${targetName}`);

    const userMessage = `Generate a brief, exciting combat narrative:

${actorName} performs ${actionType} against ${targetName}
Result: ${result.success ? 'Success' : 'Miss'}
${result.damage ? `Damage: ${result.damage}` : ''}
${result.effect ? `Effect: ${result.effect}` : ''}

Provide 1-2 sentences of vivid combat description.`;

    try {
      const response = await callLLM({
        systemPrompt: DM_SYSTEM_PROMPT,
        userMessage,
        temperature: 0.9,
        maxTokens: 256,
      });

      return response.content;
    } catch (error) {
      console.error('[DM Agent] Error generating combat narrative:', error);
      
      // Fallback narrative
      if (result.success) {
        return `${actorName}'s ${actionType} strikes ${targetName}${result.damage ? ` for ${result.damage} damage` : ''}!`;
      } else {
        return `${actorName}'s ${actionType} misses ${targetName}.`;
      }
    }
  }

  /**
   * Get default action suggestions
   */
  private getDefaultActions(gamePhase: string): Action[] {
    const baseActions: Action[] = [
      {
        id: uuidv4(),
        label: 'Look around',
        type: 'other',
        description: 'Examine your surroundings',
        cost: { action: 'free' },
      },
      {
        id: uuidv4(),
        label: 'Talk',
        type: 'other',
        description: 'Speak to someone or something',
        cost: { action: 'free' },
      },
    ];

    if (gamePhase === 'combat') {
      return [
        ...baseActions,
        {
          id: uuidv4(),
          label: 'Attack',
          type: 'attack',
          description: 'Make a melee or ranged attack',
          cost: { action: 'standard' },
        },
        {
          id: uuidv4(),
          label: 'Move',
          type: 'movement',
          description: 'Move up to your speed',
          cost: { action: 'move' },
        },
        {
          id: uuidv4(),
          label: 'Defend',
          type: 'other',
          description: 'Take the total defense action (+4 AC)',
          cost: { action: 'standard' },
        },
      ];
    }

    return [
      ...baseActions,
      {
        id: uuidv4(),
        label: 'Investigate',
        type: 'skill',
        description: 'Search or investigate something',
        cost: { action: 'standard' },
      },
      {
        id: uuidv4(),
        label: 'Move',
        type: 'movement',
        description: 'Move to a different location',
        cost: { action: 'move' },
      },
    ];
  }

  /**
   * Create agent response
   */
  createResponse(
    narrative: string,
    machineData: any,
    suggestedActions?: Action[]
  ): AgentResponse {
    return {
      narrative,
      machineData: {
        type: 'dm_response',
        data: machineData,
      },
      suggestedActions,
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export default DMAgent;