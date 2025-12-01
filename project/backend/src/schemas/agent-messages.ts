/**
 * Agent Message Schemas with Zod validation
 */

import { z } from 'zod';
import {
  AgentType,
  MessageType,
  ErrorType,
} from '../types';

// ============================================================================
// Base Message Schema
// ============================================================================

export const AgentMessageSchema = z.object({
  from: z.nativeEnum(AgentType),
  to: z.nativeEnum(AgentType),
  messageType: z.nativeEnum(MessageType),
  timestamp: z.string().datetime(),
  sessionId: z.string().uuid(),
  payload: z.any(),
  metadata: z.object({
    requiresConfirmation: z.boolean().optional(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    correlationId: z.string().uuid().optional(),
  }).optional(),
});

// ============================================================================
// Validation Result Schema
// ============================================================================

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  field: z.string().optional(),
  message: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
});

// ============================================================================
// Action Schema
// ============================================================================

export const ActionSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  type: z.enum(['movement', 'attack', 'spell', 'skill', 'item', 'other']),
  description: z.string(),
  requirements: z.array(z.string()).optional(),
  cost: z.object({
    movement: z.number().int().optional(),
    action: z.enum(['standard', 'move', 'full', 'swift', 'free']).optional(),
    resource: z.object({
      name: z.string(),
      amount: z.number().int(),
    }).optional(),
  }).optional(),
});

// ============================================================================
// Agent Response Schema
// ============================================================================

export const AgentResponseSchema = z.object({
  narrative: z.string(),
  machineData: z.object({
    type: z.string(),
    data: z.any(),
    validations: z.array(ValidationResultSchema).optional(),
  }),
  suggestedActions: z.array(ActionSchema).optional(),
  requiresConfirmation: z.boolean().optional(),
  confirmationTargets: z.array(z.string().uuid()).optional(),
});

// ============================================================================
// Error Response Schema
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.nativeEnum(ErrorType),
  message: z.string(),
  details: z.any().optional(),
  suggestedFix: z.string().optional(),
  canRetry: z.boolean(),
});

// ============================================================================
// Roll Result Schema
// ============================================================================

export const RollResultSchema = z.object({
  d20: z.number().int().min(1).max(20),
  modifiers: z.array(z.number().int()),
  total: z.number().int(),
  criticalHit: z.boolean().optional(),
  criticalMiss: z.boolean().optional(),
});

// ============================================================================
// Status Change Schema
// ============================================================================

export const StatusChangeSchema = z.object({
  target: z.string().uuid(),
  type: z.enum(['condition', 'buff', 'resource']),
  change: z.any(),
});

// ============================================================================
// Rules Resolution Schema
// ============================================================================

export const RulesResolutionSchema = z.object({
  success: z.boolean(),
  roll: RollResultSchema.optional(),
  dc: z.number().int().optional(),
  effectSummary: z.string(),
  hpDelta: z.number().int().optional(),
  statusChanges: z.array(StatusChangeSchema).optional(),
  resolutionNotes: z.array(z.string()),
});

// ============================================================================
// Character Edit Proposal Schema
// ============================================================================

export const FieldChangeSchema = z.object({
  path: z.string(),
  oldValue: z.any(),
  newValue: z.any(),
  reason: z.string().optional(),
});

export const CharacterEditProposalSchema = z.object({
  characterId: z.string().uuid(),
  proposedBy: z.string().uuid(),
  timestamp: z.string().datetime(),
  fieldChanges: z.array(FieldChangeSchema),
  requiredConfirmations: z.array(z.string().uuid()),
  summary: z.string(),
});

// ============================================================================
// Player Action Schema
// ============================================================================

export const PlayerActionSchema = z.object({
  playerId: z.string().uuid(),
  actionText: z.string(),
  timestamp: z.string().datetime(),
});

// ============================================================================
// Action Interpretation Schema
// ============================================================================

export const ActionInterpretationSchema = z.object({
  intent: z.string(),
  actionType: z.string(),
  targets: z.array(z.string().uuid()).optional(),
  parameters: z.record(z.any()).optional(),
  needsConfirmation: z.boolean(),
  ambiguities: z.array(z.string()).optional(),
});

// ============================================================================
// Combat Schemas
// ============================================================================

export const InitiativeRollSchema = z.object({
  entityId: z.string().uuid(),
  entityName: z.string(),
  roll: z.number().int().min(1).max(20),
  modifier: z.number().int(),
  total: z.number().int(),
});

export const CombatActionSchema = z.object({
  actorId: z.string().uuid(),
  actionType: z.enum(['attack', 'spell', 'move', 'item', 'other']),
  targetId: z.string().uuid().optional(),
  description: z.string(),
  resolution: RulesResolutionSchema.optional(),
});

// ============================================================================
// Persistence Schemas
// ============================================================================

export const WriteRequestSchema = z.object({
  path: z.string(),
  expectedVersion: z.number().int().positive(),
  content: z.any(),
  modifiedBy: z.string().uuid(),
});

export const WriteResponseSchema = z.object({
  success: z.boolean(),
  newVersion: z.number().int().positive().optional(),
  conflict: z.object({
    expectedVersion: z.number().int(),
    actualVersion: z.number().int(),
    lastModifiedBy: z.string(),
  }).optional(),
  error: z.string().optional(),
});

export const ReadRequestSchema = z.object({
  path: z.string(),
});

export const ReadResponseSchema = z.object({
  success: z.boolean(),
  content: z.any().optional(),
  metadata: z.object({
    id: z.string().uuid(),
    version: z.number().int().positive(),
    lastModified: z.string().datetime(),
    lastModifiedBy: z.string(),
  }).optional(),
  error: z.string().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type AgentMessage = z.infer<typeof AgentMessageSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type RollResult = z.infer<typeof RollResultSchema>;
export type StatusChange = z.infer<typeof StatusChangeSchema>;
export type RulesResolution = z.infer<typeof RulesResolutionSchema>;
export type FieldChange = z.infer<typeof FieldChangeSchema>;
export type CharacterEditProposal = z.infer<typeof CharacterEditProposalSchema>;
export type PlayerAction = z.infer<typeof PlayerActionSchema>;
export type ActionInterpretation = z.infer<typeof ActionInterpretationSchema>;
export type InitiativeRoll = z.infer<typeof InitiativeRollSchema>;
export type CombatAction = z.infer<typeof CombatActionSchema>;
export type WriteRequest = z.infer<typeof WriteRequestSchema>;
export type WriteResponse = z.infer<typeof WriteResponseSchema>;
export type ReadRequest = z.infer<typeof ReadRequestSchema>;
export type ReadResponse = z.infer<typeof ReadResponseSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

export function validateAgentMessage(data: unknown) {
  return AgentMessageSchema.safeParse(data);
}

export function validateAgentResponse(data: unknown) {
  return AgentResponseSchema.safeParse(data);
}

export function validateRulesResolution(data: unknown) {
  return RulesResolutionSchema.safeParse(data);
}

export function validateCharacterEditProposal(data: unknown) {
  return CharacterEditProposalSchema.safeParse(data);
}