/**
 * Interactive CLI Game
 *
 * Play D&D with your own inputs!
 */

import * as readline from 'readline';
import CoordinatorAgent from '../agents/coordinator';
import DMAgent from '../agents/dm-agent';
import RulesEngine from '../agents/rules-engine';
import PlayerAgent from '../agents/player-agent';
import PersistenceAgent from '../agents/persistence-agent';
import { addPlayerToSession, startCombat } from '../schemas/session-state';
import { CharacterSheet } from '../schemas/character-sheet';
import { CHARACTER_TEMPLATES, listTemplates } from '../schemas/character-templates';
import { characterToMarkdown } from '../utils/character-markdown';

// ============================================================================
// Interactive Game
// ============================================================================

class InteractiveGame {
  private rl: readline.Interface;
  private coordinator: CoordinatorAgent;
  private dmAgent: DMAgent;
  private rulesEngine: RulesEngine;
  private persistenceAgent: PersistenceAgent;
  private playerAgents: Map<string, PlayerAgent> = new Map();
  private characters: Map<string, CharacterSheet> = new Map();
  private inCombat: boolean = false;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.coordinator = new CoordinatorAgent();
    this.dmAgent = new DMAgent();
    this.rulesEngine = new RulesEngine();
    this.persistenceAgent = new PersistenceAgent();
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
    console.log('🎲 D&D 3.5e Interactive Game');
    console.log('='.repeat(80));
    this.log('Welcome, adventurer! Let\'s set up your game session.');

    // Initialize session
    const sessionName = await this.question('Enter session name (or press Enter for default): ');
    const session = await this.coordinator.initializeSession(
      'ai',
      undefined,
      sessionName || 'Interactive Session'
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
      await this.createCustomCharacters();
    }
  }

  private async createFromTemplates() {
    this.log('Available templates:');
    const templates = listTemplates();
    templates.forEach((template, i) => {
      console.log(`  ${i + 1}. ${template.name} (Level ${template.level}) - ${template.description}`);
    });
    
    const numPlayers = await this.question('\nHow many characters? (1-4): ');
    const count = Math.min(4, Math.max(1, parseInt(numPlayers) || 1));

    for (let i = 0; i < count; i++) {
      console.log(`\n--- Character ${i + 1} ---`);
      
      const choice = await this.question('Choose template (1-4) or class name: ');
      let template;
      
      const choiceNum = parseInt(choice);
      if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= 4) {
        template = templates[choiceNum - 1];
      } else {
        template = CHARACTER_TEMPLATES[choice.toLowerCase()];
      }
      
      if (!template) {
        this.log('❌ Invalid choice, using Fighter');
        template = CHARACTER_TEMPLATES.fighter;
      }
      
      const customName = await this.question(`Custom name (or Enter for default "${template.name.split(' ')[0]}"): `);
      
      const playerId = `player${i + 1}`;
      const playerAgent = new PlayerAgent(playerId);
      const character = template.createCharacter(playerId, customName || undefined);
      
      // Load into player agent
      await playerAgent.loadCharacter(character);

      this.playerAgents.set(playerId, playerAgent);
      this.characters.set(playerId, character);

      // Add to session
      const currentSession = this.coordinator.getSessionState();
      const updatedSession = addPlayerToSession(
        currentSession as any,
        character.name,
        character.id,
        false
      );
      this.coordinator.updateSessionState(updatedSession as any);

      this.log(`✅ ${character.name} created: Level ${character.level} ${character.class}`);
      console.log(`   HP: ${character.hp.current}/${character.hp.max}, AC: ${(character.ac as any).total}`);
    }
  }

  private async createCustomCharacters() {
    const numPlayers = await this.question('How many player characters? (1-4): ');
    const count = Math.min(4, Math.max(1, parseInt(numPlayers) || 1));

    for (let i = 0; i < count; i++) {
      console.log(`\n--- Character ${i + 1} ---`);
      
      const name = await this.question('Character name: ');
      const charClass = await this.question('Class (Fighter/Wizard/Rogue/Cleric): ');
      const level = await this.question('Level (1-20): ');

      const playerId = `player${i + 1}`;
      const playerAgent = new PlayerAgent(playerId);
      const character = await playerAgent.createCharacter(name);

      // Customize character
      character.class = charClass || 'Fighter';
      character.level = Math.min(20, Math.max(1, parseInt(level) || 1));
      
      // Set basic stats based on class
      this.setClassDefaults(character, character.class);

      this.playerAgents.set(playerId, playerAgent);
      this.characters.set(playerId, character);

      // Add to session
      const currentSession = this.coordinator.getSessionState();
      const updatedSession = addPlayerToSession(
        currentSession as any,
        character.name,
        character.id,
        false
      );
      this.coordinator.updateSessionState(updatedSession as any);

      this.log(`✅ ${character.name} created: Level ${character.level} ${character.class}`);
      console.log(`   HP: ${character.hp.current}/${character.hp.max}, AC: ${(character.ac as any).total}`);
    }
  }

  private setClassDefaults(character: CharacterSheet, charClass: string) {
    const level = character.level;
    
    switch (charClass.toLowerCase()) {
      case 'fighter':
        character.hp.max = 10 + (level - 1) * 6;
        character.hp.current = character.hp.max;
        character.ac = { total: 16, flatFooted: 14, touch: 12 } as any;
        character.abilities.strength = 16;
        character.abilities.dexterity = 14;
        character.abilities.constitution = 14;
        (character as any).baseAttackBonus = level;
        break;
      case 'wizard':
        character.hp.max = 4 + (level - 1) * 3;
        character.hp.current = character.hp.max;
        character.ac = { total: 12, flatFooted: 10, touch: 12 } as any;
        character.abilities.intelligence = 18;
        character.abilities.dexterity = 14;
        character.abilities.constitution = 12;
        (character as any).baseAttackBonus = Math.floor(level / 2);
        break;
      case 'rogue':
        character.hp.max = 6 + (level - 1) * 4;
        character.hp.current = character.hp.max;
        character.ac = { total: 15, flatFooted: 12, touch: 15 } as any;
        character.abilities.dexterity = 18;
        character.abilities.intelligence = 14;
        character.abilities.constitution = 12;
        (character as any).baseAttackBonus = Math.floor(level * 0.75);
        break;
      case 'cleric':
        character.hp.max = 8 + (level - 1) * 5;
        character.hp.current = character.hp.max;
        character.ac = { total: 16, flatFooted: 14, touch: 12 } as any;
        character.abilities.wisdom = 16;
        character.abilities.strength = 14;
        character.abilities.constitution = 14;
        (character as any).baseAttackBonus = Math.floor(level * 0.75);
        break;
      default:
        character.hp.max = 10;
        character.hp.current = 10;
        character.ac = { total: 12, flatFooted: 10, touch: 12 } as any;
    }
  }

  private async gameLoop() {
    this.log('🎮 GAME START');
    this.log('Type "help" for available commands');

    while (true) {
      const input = await this.question('> ');
      
      if (!input) continue;

      const [command, ...args] = input.toLowerCase().split(' ');

      try {
        switch (command) {
          case 'help':
            this.showHelp();
            break;
          case 'scene':
            await this.generateScene(args.join(' '));
            break;
          case 'combat':
            await this.startCombat();
            break;
          case 'attack':
            await this.handleAttack(args);
            break;
          case 'roll':
            await this.handleRoll(args);
            break;
          case 'status':
            this.showStatus();
            break;
          case 'characters':
            this.showCharacters();
            break;
          case 'heal':
            await this.handleHeal(args);
            break;
          case 'damage':
            await this.handleDamage(args);
            break;
          case 'quit':
          case 'exit':
            this.log('Thanks for playing! Goodbye! 👋');
            this.rl.close();
            return;
          default:
            // Treat as narrative action
            await this.handleNarrativeAction(input);
        }
      } catch (error) {
        console.error('❌ Error:', (error as Error).message);
      }
    }
  }

  private showHelp() {
    console.log(`
📖 AVAILABLE COMMANDS:

Scene & Narrative:
  scene <description>     - Generate a scene narrative
  <any text>             - Describe an action (AI interprets it)

Combat:
  combat                 - Start combat encounter
  attack <target>        - Attack a target
  roll <type> <bonus>    - Roll dice (attack/save/skill)
  
Character Management:
  status                 - Show current game status
  characters             - List all characters
  heal <character> <hp>  - Heal a character
  damage <char> <hp>     - Damage a character

General:
  help                   - Show this help
  quit/exit              - Exit game

Examples:
  > scene A dark forest with goblins
  > I search for traps
  > attack goblin
  > roll attack 5
  > heal Thorin 10
    `);
  }

  private async generateScene(description: string) {
    if (!description) {
      this.log('Usage: scene <description>');
      return;
    }

    const playerNames = Array.from(this.characters.values()).map(c => c.name);
    const narrative = await this.dmAgent.generateSceneNarrative(description, { playerNames });
    this.log(`📖 ${narrative}`);
  }

  private async startCombat() {
    this.log('⚔️  STARTING COMBAT!');
    
    // Roll initiative for all characters
    const initiatives: Array<{ id: string; name: string; roll: number }> = [];
    
    for (const [playerId, character] of this.characters) {
      const dexMod = this.rulesEngine.getAbilityModifier(character.abilities.dexterity);
      const roll = this.rulesEngine.resolveInitiative(dexMod);
      initiatives.push({ id: playerId, name: character.name, roll });
      console.log(`🎲 ${character.name}: ${roll}`);
    }

    // Add some enemies
    const numEnemies = await this.question('How many enemies? (1-4): ');
    const enemyCount = Math.min(4, Math.max(1, parseInt(numEnemies) || 2));
    
    for (let i = 0; i < enemyCount; i++) {
      const roll = this.rulesEngine.resolveInitiative(1);
      initiatives.push({ id: `enemy${i + 1}`, name: `Enemy ${i + 1}`, roll });
      console.log(`🎲 Enemy ${i + 1}: ${roll}`);
    }

    // Sort by initiative
    initiatives.sort((a, b) => b.roll - a.roll);
    
    this.log('📋 Initiative Order: ' + initiatives.map(i => i.name).join(' → '));
    
    const initiativeOrder = initiatives.map(i => i.id);
    const currentSession = this.coordinator.getSessionState();
    const combatSession = startCombat(currentSession as any, initiativeOrder);
    this.coordinator.updateSessionState(combatSession as any);
    
    this.inCombat = true;
  }

  private async handleAttack(args: string[]) {
    const target = args.join(' ');
    if (!target) {
      this.log('Usage: attack <target>');
      return;
    }

    const attacker = await this.question('Who is attacking? ');
    const character = Array.from(this.characters.values()).find(
      c => c.name.toLowerCase() === attacker.toLowerCase()
    );

    if (!character) {
      this.log('❌ Character not found');
      return;
    }

    const attackBonus = (character as any).baseAttackBonus + 
      this.rulesEngine.getAbilityModifier(character.abilities.strength);
    
    const targetAC = parseInt(await this.question('Target AC: ')) || 15;
    const result = this.rulesEngine.resolveAttack(attackBonus, targetAC);

    console.log(`\n🎲 Attack: ${result.roll?.d20} + ${attackBonus} = ${result.roll?.total} vs AC ${targetAC}`);

    if (result.success) {
      const damageRoll = await this.question('Damage dice (e.g., 1d8+3): ');
      const [dice, bonus] = this.parseDamage(damageRoll);
      const damage = this.rulesEngine.resolveDamage(dice.count, dice.sides, bonus);
      
      this.log(`💥 HIT! Damage: ${damage}`);
      
      const narrative = await this.dmAgent.generateCombatNarrative(
        character.name,
        'melee attack',
        target,
        { success: true, damage }
      );
      this.log(narrative);
    } else {
      this.log('❌ MISS!');
      const narrative = await this.dmAgent.generateCombatNarrative(
        character.name,
        'melee attack',
        target,
        { success: false }
      );
      this.log(narrative);
    }
  }

  private parseDamage(input: string): [{ count: number; sides: number }, number] {
    const match = input.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (match) {
      return [
        { count: parseInt(match[1]), sides: parseInt(match[2]) },
        parseInt(match[3] || '0')
      ];
    }
    return [{ count: 1, sides: 6 }, 0];
  }

  private async handleRoll(args: string[]) {
    const [type, bonusStr] = args;
    const bonus = parseInt(bonusStr) || 0;

    let result;
    switch (type) {
      case 'attack':
        result = this.rulesEngine.resolveAttack(bonus, 15);
        console.log(`\n🎲 Attack: ${result.roll?.d20} + ${bonus} = ${result.roll?.total}`);
        break;
      case 'save':
        result = this.rulesEngine.resolveSavingThrow(bonus, 15);
        console.log(`\n🎲 Save: ${result.roll?.d20} + ${bonus} = ${result.roll?.total}`);
        console.log(`   ${result.success ? '✅ Success' : '❌ Failure'}`);
        break;
      case 'skill':
        result = this.rulesEngine.resolveSkillCheck(bonus, 15);
        console.log(`\n🎲 Skill: ${result.roll?.d20} + ${bonus} = ${result.roll?.total}`);
        console.log(`   ${result.success ? '✅ Success' : '❌ Failure'}`);
        break;
      default:
        this.log('Usage: roll <attack|save|skill> <bonus>');
    }
  }

  private showStatus() {
    const stats = this.coordinator.getSessionStats();
    console.log(`
📊 SESSION STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session ID: ${stats.sessionId}
Phase: ${stats.phase}
Players: ${stats.playerCount}
${stats.round ? `Round: ${stats.round}` : ''}
${stats.pendingConfirmations > 0 ? `Pending Confirmations: ${stats.pendingConfirmations}` : ''}
    `);
  }

  private showCharacters() {
    console.log('\n👥 CHARACTERS\n' + '━'.repeat(80));
    
    for (const [playerId, character] of this.characters) {
      const ac = (character.ac as any).total || character.ac;
      console.log(`
${character.name} - Level ${character.level} ${character.class}
  HP: ${character.hp.current}/${character.hp.max}
  AC: ${ac}
  STR: ${character.abilities.strength} DEX: ${character.abilities.dexterity} CON: ${character.abilities.constitution}
  INT: ${character.abilities.intelligence} WIS: ${character.abilities.wisdom} CHA: ${character.abilities.charisma}
      `);
    }
  }

  private async handleHeal(args: string[]) {
    const [charName, hpStr] = args;
    const hp = parseInt(hpStr);

    if (!charName || !hp) {
      this.log('Usage: heal <character> <hp>');
      return;
    }

    const entry = Array.from(this.characters.entries()).find(
      ([_, c]) => c.name.toLowerCase() === charName.toLowerCase()
    );

    if (!entry) {
      this.log('❌ Character not found');
      return;
    }

    const [playerId, character] = entry;
    const playerAgent = this.playerAgents.get(playerId)!;
    
    const result = this.rulesEngine.applyHealing(character.hp.current, character.hp.max, hp);
    
    const proposal = playerAgent.proposeEdit(
      [{ path: 'hp.current', oldValue: character.hp.current, newValue: result.newHP, reason: 'Healing' }],
      [playerId],
      `Healed ${hp} HP`
    );
    
    playerAgent.applyEdit(proposal);
    character.hp.current = result.newHP;
    
    this.log(`💚 ${character.name} healed ${hp} HP (${result.overheal > 0 ? `${result.overheal} overheal` : 'full heal'})`);
    console.log(`   New HP: ${character.hp.current}/${character.hp.max}`);
  }

  private async handleDamage(args: string[]) {
    const [charName, hpStr] = args;
    const hp = parseInt(hpStr);

    if (!charName || !hp) {
      this.log('Usage: damage <character> <hp>');
      return;
    }

    const entry = Array.from(this.characters.entries()).find(
      ([_, c]) => c.name.toLowerCase() === charName.toLowerCase()
    );

    if (!entry) {
      this.log('❌ Character not found');
      return;
    }

    const [playerId, character] = entry;
    const playerAgent = this.playerAgents.get(playerId)!;
    
    const result = this.rulesEngine.applyDamage(character.hp.current, character.hp.max, hp);
    
    const proposal = playerAgent.updateHP(-hp, 'Damage taken');
    playerAgent.applyEdit(proposal);
    character.hp.current = result.newHP;
    
    this.log(`💔 ${character.name} took ${hp} damage (${result.status})`);
    console.log(`   New HP: ${character.hp.current}/${character.hp.max}`);
  }

  private async handleNarrativeAction(action: string) {
    const playerName = await this.question('Which character is acting? ');
    const character = Array.from(this.characters.values()).find(
      c => c.name.toLowerCase() === playerName.toLowerCase()
    );

    if (!character) {
      this.log('❌ Character not found. Using first character.');
    }

    const result = await this.dmAgent.interpretAction(
      'player1',
      action,
      {
        playerName: character?.name || 'Unknown',
        currentScene: 'Current scene',
        gamePhase: this.inCombat ? 'combat' : 'exploration'
      }
    );
    
    this.log(`🎭 ${result.narrative}`);
    
    if (result.interpretation.needsConfirmation) {
      const proceed = await this.question('Roll for this action? (y/n): ');
      if (proceed.toLowerCase() === 'y') {
        const bonus = parseInt(await this.question('Modifier: ')) || 0;
        const rollResult = this.rulesEngine.resolveSkillCheck(bonus, 15);
        console.log(`\n🎲 ${rollResult.roll?.d20} + ${bonus} = ${rollResult.roll?.total}`);
        this.log(rollResult.success ? '✅ Success!' : '❌ Failure!');
      }
    }
  }
}

// ============================================================================
// Run Game
// ============================================================================

if (require.main === module) {
  const game = new InteractiveGame();
  game.start().catch(console.error);
}

export default InteractiveGame;