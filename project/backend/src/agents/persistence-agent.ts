/**
 * Persistence Agent
 * 
 * Responsibilities:
 * - Read/write character sheets
 * - Read/write session state
 * - Implement optimistic locking
 * - Maintain file version control
 * - Handle metadata headers
 * - Manage backup/recovery
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  WriteRequest,
  WriteResponse,
  ReadRequest,
  ReadResponse,
  FileMetadata,
} from '../types';

// ============================================================================
// System Prompt
// ============================================================================

const PERSISTENCE_SYSTEM_PROMPT = `Perform read/write only on Coordinator request.

Use optimistic locking: require incoming write to include expected_version; on write, return new version hash and status: {ok, path, version, error?}.

When "save session" is called, update:
- project/history/decisions.md
- project/plan/progress.md
- ai_system/memory/user_profile.md
- clear project/context/session_notes.md`;

// ============================================================================
// Persistence Agent Class
// ============================================================================

export class PersistenceAgent {
  private basePath: string;

  constructor(basePath: string = '../user_resources') {
    this.basePath = basePath;
    console.log(`[Persistence Agent] Initialized with base path: ${basePath}`);
  }

  /**
   * Read file
   */
  async readFile(request: ReadRequest): Promise<ReadResponse> {
    console.log(`[Persistence Agent] Reading file: ${request.path}`);

    try {
      const fullPath = path.join(this.basePath, request.path);
      const content = await fs.readFile(fullPath, 'utf-8');

      // Try to parse as JSON
      let parsedContent: any;
      let metadata: FileMetadata | undefined;

      try {
        parsedContent = JSON.parse(content);
        
        // Extract metadata if present
        if (parsedContent.id && parsedContent.version) {
          metadata = {
            id: parsedContent.id,
            version: parsedContent.version,
            lastModified: parsedContent.lastModified,
            lastModifiedBy: parsedContent.lastModifiedBy,
          };
        }
      } catch {
        // Not JSON, treat as plain text
        parsedContent = content;
      }

      return {
        success: true,
        content: parsedContent,
        metadata,
      };
    } catch (error: any) {
      console.error(`[Persistence Agent] Error reading file:`, error);
      return {
        success: false,
        error: error.message || 'Failed to read file',
      };
    }
  }

  /**
   * Write file with optimistic locking
   */
  async writeFile(request: WriteRequest): Promise<WriteResponse> {
    console.log(`[Persistence Agent] Writing file: ${request.path}`);

    try {
      const fullPath = path.join(this.basePath, request.path);

      // Check if file exists and verify version
      let currentVersion = 0;
      let lastModifiedBy = '';

      try {
        const existingContent = await fs.readFile(fullPath, 'utf-8');
        const existing = JSON.parse(existingContent);
        currentVersion = existing.version || 0;
        lastModifiedBy = existing.lastModifiedBy || '';

        // Optimistic locking check
        if (currentVersion !== request.expectedVersion) {
          return {
            success: false,
            conflict: {
              expectedVersion: request.expectedVersion,
              actualVersion: currentVersion,
              lastModifiedBy,
            },
          };
        }
      } catch {
        // File doesn't exist or isn't JSON, proceed with write
      }

      // Prepare content with updated version
      const newVersion = currentVersion + 1;
      const contentToWrite = {
        ...request.content,
        version: newVersion,
        lastModified: new Date().toISOString(),
        lastModifiedBy: request.modifiedBy,
      };

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Write file
      await fs.writeFile(
        fullPath,
        JSON.stringify(contentToWrite, null, 2),
        'utf-8'
      );

      console.log(`[Persistence Agent] File written successfully (v${newVersion})`);

      return {
        success: true,
        newVersion,
      };
    } catch (error: any) {
      console.error(`[Persistence Agent] Error writing file:`, error);
      return {
        success: false,
        error: error.message || 'Failed to write file',
      };
    }
  }

  /**
   * Write markdown file (for character sheets, session notes, etc.)
   */
  async writeMarkdown(
    filePath: string,
    content: any,
    metadata: FileMetadata
  ): Promise<WriteResponse> {
    console.log(`[Persistence Agent] Writing markdown file: ${filePath}`);

    try {
      const fullPath = path.join(this.basePath, filePath);

      // Create YAML frontmatter
      const frontmatter = `---
id: ${metadata.id}
version: ${metadata.version}
lastModified: ${metadata.lastModified}
lastModifiedBy: ${metadata.lastModifiedBy}
${metadata.confirmedBy ? `confirmedBy: [${metadata.confirmedBy.join(', ')}]` : ''}
---

`;

      // Convert content to markdown
      const markdownContent = this.toMarkdown(content);
      const fullContent = frontmatter + markdownContent;

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Write file
      await fs.writeFile(fullPath, fullContent, 'utf-8');

      console.log(`[Persistence Agent] Markdown file written successfully`);

      return {
        success: true,
        newVersion: metadata.version,
      };
    } catch (error: any) {
      console.error(`[Persistence Agent] Error writing markdown:`, error);
      return {
        success: false,
        error: error.message || 'Failed to write markdown file',
      };
    }
  }

  /**
   * Read markdown file
   */
  async readMarkdown(filePath: string): Promise<ReadResponse> {
    console.log(`[Persistence Agent] Reading markdown file: ${filePath}`);

    try {
      const fullPath = path.join(this.basePath, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');

      // Parse YAML frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
      let metadata: FileMetadata | undefined;
      let markdownContent = content;

      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        markdownContent = content.slice(frontmatterMatch[0].length);

        // Parse frontmatter (simple key-value parsing)
        const lines = frontmatter.split('\n');
        const parsed: any = {};
        
        for (const line of lines) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            parsed[key.trim()] = valueParts.join(':').trim();
          }
        }

        metadata = {
          id: parsed.id,
          version: parseInt(parsed.version) || 1,
          lastModified: parsed.lastModified,
          lastModifiedBy: parsed.lastModifiedBy,
        };
      }

      return {
        success: true,
        content: markdownContent,
        metadata,
      };
    } catch (error: any) {
      console.error(`[Persistence Agent] Error reading markdown:`, error);
      return {
        success: false,
        error: error.message || 'Failed to read markdown file',
      };
    }
  }

  /**
   * List files in directory
   */
  async listFiles(directoryPath: string): Promise<string[]> {
    console.log(`[Persistence Agent] Listing files in: ${directoryPath}`);

    try {
      const fullPath = path.join(this.basePath, directoryPath);
      const files = await fs.readdir(fullPath);
      return files;
    } catch (error: any) {
      console.error(`[Persistence Agent] Error listing files:`, error);
      return [];
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<boolean> {
    console.log(`[Persistence Agent] Deleting file: ${filePath}`);

    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.unlink(fullPath);
      console.log(`[Persistence Agent] File deleted successfully`);
      return true;
    } catch (error: any) {
      console.error(`[Persistence Agent] Error deleting file:`, error);
      return false;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert object to markdown (simple implementation)
   */
  private toMarkdown(obj: any, level: number = 1): string {
    let markdown = '';

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        markdown += `${'#'.repeat(level + 1)} ${key}\n\n`;
        markdown += this.toMarkdown(value, level + 1);
      } else if (Array.isArray(value)) {
        markdown += `${'#'.repeat(level + 1)} ${key}\n\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            markdown += this.toMarkdown(item, level + 2);
          } else {
            markdown += `- ${item}\n`;
          }
        }
        markdown += '\n';
      } else {
        markdown += `**${key}**: ${value}\n\n`;
      }
    }

    return markdown;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default PersistenceAgent;