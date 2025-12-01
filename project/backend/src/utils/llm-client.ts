/**
 * LLM Client for Anthropic Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================================
// Configuration
// ============================================================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '30000');

if (!ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY not set in environment');
}

// ============================================================================
// Client Instance
// ============================================================================

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  maxRetries: MAX_RETRIES,
  timeout: TIMEOUT_MS,
});

// ============================================================================
// Types
// ============================================================================

export interface LLMRequest {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMError {
  error: string;
  message: string;
  retryable: boolean;
}

// ============================================================================
// Main LLM Call Function
// ============================================================================

/**
 * Call Claude API with system prompt and user message
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 1.0,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.userMessage,
        },
      ],
    });

    // Extract text content
    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    return {
      content: textContent,
      stopReason: response.stop_reason || 'unknown',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error: any) {
    // Handle API errors
    const llmError: LLMError = {
      error: error.name || 'LLMError',
      message: error.message || 'Unknown error calling LLM',
      retryable: error.status >= 500 || error.status === 429,
    };

    throw llmError;
  }
}

/**
 * Call Claude API with streaming response
 */
export async function callLLMStreaming(
  request: LLMRequest,
  onChunk: (chunk: string) => void
): Promise<LLMResponse> {
  try {
    const stream = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 1.0,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.userMessage,
        },
      ],
      stream: true,
    });

    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let stopReason = 'unknown';

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = (event as any).delta;
        if (delta.type === 'text_delta') {
          const chunk = delta.text;
          fullContent += chunk;
          onChunk(chunk);
        }
      } else if (event.type === 'message_start') {
        const message = (event as any).message;
        inputTokens = message.usage.input_tokens;
      } else if (event.type === 'message_delta') {
        const delta = (event as any).delta;
        outputTokens = delta.usage?.output_tokens || 0;
        stopReason = delta.stop_reason || 'unknown';
      }
    }

    return {
      content: fullContent,
      stopReason,
      usage: {
        inputTokens,
        outputTokens,
      },
    };
  } catch (error: any) {
    const llmError: LLMError = {
      error: error.name || 'LLMError',
      message: error.message || 'Unknown error calling LLM',
      retryable: error.status >= 500 || error.status === 429,
    };

    throw llmError;
  }
}

/**
 * Parse JSON from LLM response
 * Handles cases where LLM wraps JSON in markdown code blocks
 */
export function parseJSONFromLLM(content: string): any {
  // Try to extract JSON from markdown code blocks
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1]);
  }

  // Try to extract JSON from generic code blocks
  const codeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }

  // Try to parse the entire content as JSON
  return JSON.parse(content);
}

/**
 * Extract narrative and JSON from LLM response
 * Expected format:
 * Narrative text here...
 * 
 * ```json
 * { "data": "here" }
 * ```
 */
export function extractNarrativeAndJSON(content: string): {
  narrative: string;
  json: any;
} {
  // Split on JSON code block
  const parts = content.split(/```json\s*/);
  
  if (parts.length < 2) {
    // No JSON block found, treat entire content as narrative
    return {
      narrative: content.trim(),
      json: null,
    };
  }

  const narrative = parts[0].trim();
  const jsonPart = parts[1].split('```')[0].trim();
  
  try {
    const json = JSON.parse(jsonPart);
    return { narrative, json };
  } catch (error) {
    console.error('Failed to parse JSON from LLM response:', error);
    return {
      narrative: content.trim(),
      json: null,
    };
  }
}

/**
 * Retry LLM call with exponential backoff
 */
export async function callLLMWithRetry(
  request: LLMRequest,
  maxRetries: number = MAX_RETRIES
): Promise<LLMResponse> {
  let lastError: LLMError | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callLLM(request);
    } catch (error: any) {
      lastError = error as LLMError;
      
      if (!lastError.retryable || attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delayMs = Math.pow(2, attempt) * 1000;
      console.log(`LLM call failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  callLLM,
  callLLMStreaming,
  callLLMWithRetry,
  parseJSONFromLLM,
  extractNarrativeAndJSON,
};