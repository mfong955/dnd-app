/**
 * Enhanced Interactive CLI Game
 * 
 * Full-featured D&D game with combat management and enemy AI
 */

import * as readline from 'readline';
import CoordinatorAgent from '../agents/coordinator';
import DMAgent from '../agents/dm-agent';
import RulesEngine from '../agents/rules-engine';
import PlayerAgent from '../agents/player-agent';
import PersistenceAgent from '../agents/persistence-agent';
import { addPlayerToSession } from '../schemas/session-state';
import { CharacterSheet } from '../schemas/character-sheet';
import { CHARACTER_TEMPLATES, listTemplates } from '../schemas/character-templates';
import { characterToMarkdown } from '../utils/character-markdown';
import CombatManager, { Combatant } from '../utils/combat-manager';
import EnemyAI, { createEnemy, ENEMY_TEMPLATES } from '../utils/enemy-ai';

// ============================================================================
// Enhanced Game Class
// ============================================================================

class EnhancedGame {
  private rl: readline.Interface;
  private coordinator: CoordinatorAgent;
  private dmAgent: DMAgent;
  private rulesEngine: RulesEngine;
  private persistenceAgent: PersistenceAgent;
  private playerAgents: Map<string, PlayerAgent> = new Map();
  private characters: Map<string, CharacterSheet> = new Map();
  private combatManager: CombatManager | null = null;
  private enemyAI: EnemyAI;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.coordinator = new CoordinatorAgent();
    this.dmAgent = new DMAgent();
    this.rulesEngine = new RulesEngine();
    this.persistenceAgent = new PersistenceAgent();
    this.enemyAI = new EnemyAI();
  }

  private async question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private log(message: string) {
    console.log(`\n${message}\n`);
  }

  async start() {
    console.clear();
    console.log('='.repeat(80));
    console.log('🎲 D&D 3.5e - Enhanced Interactive Game');
    console.log('='.repeat(80));
    this.log('Welcome! Let\'s begin your adventure.');

    // Initialize session
    const sessionName = await this.question('Session name (or Enter for default): ');
    const session = await this.coordinator.initializeSession(
      'ai',
      undefined,
      sessionName || 'Adventure Session'
    );
    this.log(`✅ Session created: ${session.sessionId}`);

    // Create characters
    await this.createCharacters();

    // Main game loop
    await this.gameLoop();
  }

  private async createCharacters() {
    this.log('📝 CHARACTER CREATION');
    
    const useTemplates = await this.question('Use pre-made characters? (y/n): ');
    
    if (useTemplates.toLowerCase() === 'y') {
      await this.createFromTemplates();
    } else {
      this.log('Custom character creation not yet implemented. Using templates.');
      await this.createFromTemplates();
    }
  }

  private async createFromTemplates() {
    this.log('Available templates:');
    const templates = listTemplates();
    templates.forEach((template, i) => {
      console.log(`  ${i + 1}. ${template.name} (Level ${template.level})`);
    });
    
    const numPlayers = await this.question('\nHow many characters? (1-4): ');
    const count = Math.min(4, Math.max(1, parseInt(numPlayers) || 1));

    for (let i = 0; i < count; i++) {
      const choice = await this.question(`\nCharacter ${i + 1} - Choose (1-4): `);
      const choiceNum = parseInt(choice) || 1;
      const template = templates[Math.min(Math.max(choiceNum - 1, 0), 3)];
      
      const customName = await this.question(`Name (Enter for "${template.name.split(' ')[0]}"): `);
      
      const playerId = `player${i + 1}`;
      const playerAgent = new PlayerAgent(playerId);
      const character = template.createCharacter(playerId, customName || undefined);
      
      await playerAgent.loadCharacter(character);

      this.playerAgents.set(playerId, playerAgent);
      this.characters.set(playerId, character);

      const currentSession = this.coordinator.getSessionState();
      const updatedSession = addPlayerToSession(
        currentSession as any,
        character.name,
        character.id,
        false
      );
      this.coordinator.updateSessionState(updatedSession as any);

      console.log(`✅ ${character.name} - Level ${character.level} ${character.class}`);
      console.log(`   HP: ${character.hp.current}/${character.hp.max}, AC: ${(character.ac as any).total}`);
    }
  }

  private async gameLoop() {
    this.log('🎮 GAME START');
    this.log('Type "help" for commands or just describe what you want to do!');

    while (true) {
      const prompt = this.combatManager?.getState().isActive 
        ? `[Round ${this.combatManager.getState().round}] > `
        : '> ';
      
      const input = await this.question(prompt);
      
      if (!input) continue;

      const [command, ...args] = input.toLowerCase().split(' ');

      try {
        if (await this.handleCommand(command, args, input)) {
          continue;
        }
      } catch (error) {
        console.error('❌ Error:', (error as Error).message);
      }
    }
  }

  private async handleCommand(command: string, args: string[], fullInput: string): Promise<boolean> {
    switch (command) {
      case 'help':
        this.showHelp();
        return true;
      case 'combat':
        await this.startCombat();
        return true;
      case 'attack':
        if (this.combatManager?.getState().isActive) {
          await this.playerAttack();
        } else {
          this.log('❌ Not in combat!');
        }
        return true;
      case 'pass':
      case 'skip':
        if (this.combatManager?.getState().isActive) {
          await this.passTurn();
        } else {
          this.log('❌ Not in combat!');
        }
        return true;
      case 'status':
        this.showStatus();
        return true;
      case 'characters':
        this.showCharacters();
        return true;
      case 'save':
        await this.saveCharacters();
        return true;
      case 'quit':
      case 'exit':
        this.log('Thanks for playing! 👋');
        this.rl.close();
        process.exit(0);
      default:
        return false;
    }
  }

  private showHelp() {
    console.log(`
📖 COMMANDS

Combat:
  combat          - Start combat encounter
  attack          - Attack during your turn
  pass/skip       - Skip your turn
  
Game:
  status          - Show game status
  characters      - List all characters
  save            - Save characters
  help            - Show this help
  quit/exit       - Exit game

During combat, you'll be prompted for actions on your turn.
Enemies act automatically using AI.
    `);
  }

  private async startCombat() {
    this.log('⚔️  STARTING COMBAT!');
    
    // Choose enemy type
    console.log('\nAvailable enemies:');
    Object.entries(ENEMY_TEMPLATES).forEach(([key, template], i) => {
      console.log(`  ${i + 1}. ${template.name} (HP: ${template.hp}, AC: ${template.ac})`);
    });
    
    const enemyChoice = await this.question('\nEnemy type (1-5): ');
    const enemyTypes = Object.keys(ENEMY_TEMPLATES);
    const enemyType = enemyTypes[Math.min(Math.max(parseInt(enemyChoice) - 1, 0), enemyTypes.length - 1)];
    
    const numEnemies = await this.question('How many? (1-4): ');
    const count = Math.min(4, Math.max(1, parseInt(numEnemies) || 2));
    
    // Create combatants
    const combatants: Combatant[] = [];
    
    // Add players
    for (const [playerId, character] of this.characters) {
      const dexMod = this.rulesEngine.getAbilityModifier(character.abilities.dexterity);
      combatants.push({
        id: playerId,
        name: character.name,
        initiative: this.rulesEngine.resolveInitiative(dexMod),
        hp: { current: character.hp.current, max: character.hp.max },
        ac: (character.ac as any).total || character.ac,
        isPlayer: true,
        isDefeated: false,
        character,
      });
    }
    
    // Add enemies
    for (let i = 0; i < count; i++) {
      const enemy = createEnemy(enemyType, `enemy${i + 1}`, this.rulesEngine);
      combatants.push(enemy);
    }
    
    // Start combat
    this.combatManager = new CombatManager(this.rulesEngine, this.dmAgent);
    this.combatManager.startCombat(combatants);
    
    this.log(this.combatManager.getSummary());
    
    // Start combat loop
    await this.combatLoop();
  }

  private async combatLoop() {
    if (!this.combatManager) return;
    
    while (this.combatManager.getState().isActive) {
      const current = this.combatManager.getCurrentCombatant();
      if (!current) break;
      
      this.log(`🎯 ${current.name}'s turn`);
      
      if (current.isPlayer) {
        await this.playerTurn(current);
      } else {
        await this.enemyTurn(current);
      }
      
      // Check if combat ended
      const endCheck = this.combatManager.checkCombatEnd();
      if (endCheck.ended) {
        this.log(endCheck.winners === 'players' ? '🎉 VICTORY!' : '💀 DEFEAT!');
        this.log(this.combatManager.getSummary());
        this.combatManager = null;
        break;
      }
      
      // Next turn
      const { newRound } = this.combatManager.nextTurn();
      if (newRound) {
        this.log(this.combatManager.getSummary());
      }
    }
  }

  private async playerTurn(combatant: Combatant) {
    const enemies = this.combatManager!.getActiveCombatants().filter(c => !c.isPlayer);
    
    console.log('\nTargets:');
    enemies.forEach((enemy, i) => {
      console.log(`  ${i + 1}. ${enemy.name} (HP: ${enemy.hp.current}/${enemy.hp.max}, AC: ${enemy.ac})`);
    });
    
    const action = await this.question('\nAction (attack/pass): ');
    
    if (action.toLowerCase() === 'pass') {
      this.log(`${combatant.name} passes their turn.`);
      return;
    }
    
    const targetNum = await this.question('Target (1-N): ');
    const targetIndex = Math.min(Math.max(parseInt(targetNum) - 1, 0), enemies.length - 1);
    const target = enemies[targetIndex];
    
    if (!target) {
      this.log('Invalid target!');
      return;
    }
    
    // Get attack bonus from character
    const character = combatant.character!;
    const attackBonus = (character as any).baseAttackBonus + 
      this.rulesEngine.getAbilityModifier(character.abilities.strength);
    
    // Determine damage based on class
    let damageRoll = { dice: 1, sides: 8, bonus: this.rulesEngine.getAbilityModifier(character.abilities.strength) };
    if (character.class.toLowerCase() === 'wizard') {
      damageRoll = { dice: 1, sides: 4, bonus: 0 }; // Quarterstaff
    } else if (character.class.toLowerCase() === 'rogue') {
      damageRoll = { dice: 1, sides: 6, bonus: this.rulesEngine.getAbilityModifier(character.abilities.dexterity) };
    }
    
    const result = await this.combatManager!.processAttack(
      combatant.id,
      target.id,
      attackBonus,
      damageRoll
    );
    
    this.log(result.narrative);
    
    // Update character HP if it changed
    if (combatant.character) {
      combatant.character.hp.current = combatant.hp.current;
    }
  }

  private async enemyTurn(combatant: Combatant) {
    const decision = this.enemyAI.decideAction(
      combatant,
      this.combatManager!.getActiveCombatants()
    );
    
    if (decision.action === 'pass' || decision.action === 'defend') {
      this.log(decision.reasoning);
      return;
    }
    
    if (decision.action === 'attack' && decision.targetId) {
      const attackBonus = this.enemyAI.getAttackBonus(combatant);
      const damageRoll = this.enemyAI.getDamageRoll(combatant);
      
      const result = await this.combatManager!.processAttack(
        combatant.id,
        decision.targetId,
        attackBonus,
        damageRoll
      );
      
      this.log(result.narrative);
      
      // Update player character HP if hit
      const target = this.combatManager!.getCombatant(decision.targetId);
      if (target?.character) {
        target.character.hp.current = target.hp.current;
      }
      
      // Small delay for readability
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async playerAttack() {
    const current = this.combatManager?.getCurrentCombatant();
    if (!current || !current.isPlayer) {
      this.log('❌ Not your turn!');
      return;
    }
    
    await this.playerTurn(current);
  }

  private async passTurn() {
    const current = this.combatManager?.getCurrentCombatant();
    if (!current) return;
    
    this.log(`${current.name} passes their turn.`);
  }

  private showStatus() {
    if (this.combatManager?.getState().isActive) {
      console.log(this.combatManager.getSummary());
    } else {
      const stats = this.coordinator.getSessionStats();
      console.log(`
📊 SESSION STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session: ${stats.sessionId}
Players: ${stats.playerCount}
Phase: ${stats.phase}
      `);
    }
  }

  private showCharacters() {
    console.log('\n👥 PARTY\n' + '━'.repeat(80));
    
    for (const [playerId, character] of this.characters) {
      const ac = (character.ac as any).total || character.ac;
      console.log(`
${character.name} - Level ${character.level} ${character.class}
  HP: ${character.hp.current}/${character.hp.max} | AC: ${ac}
  STR ${character.abilities.strength} DEX ${character.abilities.dexterity} CON ${character.abilities.constitution} INT ${character.abilities.intelligence} WIS ${character.abilities.wisdom} CHA ${character.abilities.charisma}
      `);
    }
  }

  private async saveCharacters() {
    this.log('💾 SAVING...');
    
    for (const [playerId, character] of this.characters) {
      const filename = `characters/${character.name.toLowerCase().replace(/\s+/g, '-')}.md`;
      
      const metadata = {
        id: character.id,
        version: character.version,
        lastModified: new Date().toISOString(),
        lastModifiedBy: character.lastModifiedBy,
        confirmedBy: character.confirmedBy,
      };
      
      const markdown = characterToMarkdown(character);
      const result = await this.persistenceAgent.writeMarkdown(filename, { markdown }, metadata);
      
      if (result.success) {
        console.log(`✅ ${character.name}`);
      } else {
        console.log(`❌ ${character.name}: ${result.error}`);
      }
    }
    
    this.log('Characters saved!');
  }
}

// ============================================================================
// Run Game
// ============================================================================

if (require.main === module) {
  const game = new EnhancedGame();
  game.start().catch(console.error);
}

export default EnhancedGame;