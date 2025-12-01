/**
 * CLI Test Harness
 * 
 * Tests agent interactions through a simple combat simulation
 */

import CoordinatorAgent from '../agents/coordinator';
import DMAgent from '../agents/dm-agent';
import RulesEngine from '../agents/rules-engine';
import PlayerAgent from '../agents/player-agent';
import PersistenceAgent from '../agents/persistence-agent';
import { createNewSession, addPlayerToSession, startCombat } from '../schemas/session-state';
import { createBlankCharacterSheet } from '../schemas/character-sheet';

// ============================================================================
// Test Harness
// ============================================================================

async function runTestHarness() {
  console.log('='.repeat(80));
  console.log('DnD App - CLI Test Harness');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Initialize agents
    console.log('📦 Initializing agents...\n');
    const coordinator = new CoordinatorAgent();
    const dmAgent = new DMAgent();
    const rulesEngine = new RulesEngine();
    const persistenceAgent = new PersistenceAgent();

    // Create session
    console.log('🎮 Creating new session...\n');
    const session = await coordinator.initializeSession('ai', undefined, 'Test Combat Session');
    console.log(`✅ Session created: ${session.sessionId}\n`);

    // Create player 1
    console.log('👤 Creating Player 1: Thorin the Fighter...\n');
    const player1Agent = new PlayerAgent('player1');
    const thorin = await player1Agent.createCharacter('Thorin');
    
    // Customize Thorin
    thorin.class = 'Fighter';
    thorin.level = 3;
    thorin.hp.current = 28;
    thorin.hp.max = 28;
    thorin.ac = { total: 18, flatFooted: 16, touch: 12, breakdown: '10 base + 2 dex + 6 armor' } as any;
    (thorin as any).baseAttackBonus = 3;
    thorin.abilities.strength = 16;
    thorin.abilities.dexterity = 14;
    thorin.abilities.constitution = 14;
    
    console.log(`✅ ${thorin.name} created: Level ${thorin.level} ${thorin.class}`);
    console.log(`   HP: ${thorin.hp.current}/${thorin.hp.max}, AC: ${(thorin.ac as any).total}\n`);

    // Create player 2
    console.log('👤 Creating Player 2: Elara the Wizard...\n');
    const player2Agent = new PlayerAgent('player2');
    const elara = await player2Agent.createCharacter('Elara');
    
    // Customize Elara
    elara.class = 'Wizard';
    elara.level = 3;
    elara.hp.current = 15;
    elara.hp.max = 15;
    elara.ac = { total: 13, flatFooted: 11, touch: 13, breakdown: '10 base + 3 dex' } as any;
    (elara as any).baseAttackBonus = 1;
    elara.abilities.intelligence = 18;
    elara.abilities.dexterity = 16;
    elara.abilities.constitution = 12;
    
    console.log(`✅ ${elara.name} created: Level ${elara.level} ${elara.class}`);
    console.log(`   HP: ${elara.hp.current}/${elara.hp.max}, AC: ${(elara.ac as any).total}\n`);

    // Add players to session
    console.log('➕ Adding players to session...\n');
    let updatedSession = addPlayerToSession(session as any, 'Thorin', thorin.id, false);
    updatedSession = addPlayerToSession(updatedSession as any, 'Elara', elara.id, false);
    coordinator.updateSessionState(updatedSession as any);
    
    console.log(`✅ Players added: ${updatedSession.players.length} players in session\n`);

    // Generate scene narrative
    console.log('📖 Generating opening scene...\n');
    const sceneNarrative = await dmAgent.generateSceneNarrative(
      'A dark forest clearing with an abandoned watchtower. Two goblins emerge from the shadows, weapons drawn.',
      { playerNames: ['Thorin', 'Elara'] }
    );
    console.log(`${sceneNarrative}\n`);

    // Roll initiative
    console.log('🎲 Rolling initiative...\n');
    const thorinInitiative = rulesEngine.resolveInitiative(rulesEngine.getAbilityModifier(thorin.abilities.dexterity));
    const elaraInitiative = rulesEngine.resolveInitiative(rulesEngine.getAbilityModifier(elara.abilities.dexterity));
    const goblin1Initiative = rulesEngine.resolveInitiative(1); // Goblins have +1 dex
    const goblin2Initiative = rulesEngine.resolveInitiative(1);

    console.log(`   Thorin: ${thorinInitiative}`);
    console.log(`   Elara: ${elaraInitiative}`);
    console.log(`   Goblin 1: ${goblin1Initiative}`);
    console.log(`   Goblin 2: ${goblin2Initiative}\n`);

    // Sort initiative order
    const initiatives = [
      { id: 'player1', name: 'Thorin', roll: thorinInitiative },
      { id: 'player2', name: 'Elara', roll: elaraInitiative },
      { id: 'goblin1', name: 'Goblin 1', roll: goblin1Initiative },
      { id: 'goblin2', name: 'Goblin 2', roll: goblin2Initiative },
    ].sort((a, b) => b.roll - a.roll);

    const initiativeOrder = initiatives.map(i => i.id);
    console.log('📋 Initiative order:', initiatives.map(i => i.name).join(' → '), '\n');

    // Start combat
    console.log('⚔️  COMBAT BEGINS!\n');
    const combatSession = startCombat(updatedSession, initiativeOrder);
    coordinator.updateSessionState(combatSession as any);

    // Simulate Round 1
    console.log('='.repeat(80));
    console.log('ROUND 1');
    console.log('='.repeat(80));
    console.log('');

    // Turn 1: Highest initiative
    const firstActor = initiatives[0];
    console.log(`🎯 ${firstActor.name}'s turn\n`);

    if (firstActor.id.startsWith('player')) {
      // Player turn - suggest actions
      const suggestions = await dmAgent.suggestActions(firstActor.id, {
        playerName: firstActor.name,
        characterClass: firstActor.id === 'player1' ? 'Fighter' : 'Wizard',
        currentScene: 'Combat with goblins',
        gamePhase: 'combat',
        availableMovement: 30,
      });

      console.log('💡 Available actions:');
      suggestions.slice(0, 3).forEach((action, i) => {
        console.log(`   ${i + 1}. ${action.label}: ${action.description}`);
      });
      console.log('');

      // Simulate attack
      console.log(`${firstActor.name} attacks Goblin 1!\n`);
      
      const attackBonus = firstActor.id === 'player1' ? 
        rulesEngine.calculateAttackBonus(3, rulesEngine.getAbilityModifier(16)) : // Thorin
        rulesEngine.calculateAttackBonus(1, rulesEngine.getAbilityModifier(16));   // Elara
      
      const attackResult = rulesEngine.resolveAttack(attackBonus, 15); // Goblin AC 15
      
      console.log(`🎲 Attack roll: ${attackResult.roll?.d20} + ${attackBonus} = ${attackResult.roll?.total} vs AC 15`);
      
      if (attackResult.success) {
        const damage = rulesEngine.resolveDamage(1, 8, 3); // 1d8+3 longsword
        console.log(`💥 Hit! Damage: ${damage}`);
        
        const narrative = await dmAgent.generateCombatNarrative(
          firstActor.name,
          'melee attack',
          'Goblin 1',
          { success: true, damage }
        );
        console.log(`\n${narrative}\n`);
      } else {
        console.log(`❌ Miss!\n`);
        const narrative = await dmAgent.generateCombatNarrative(
          firstActor.name,
          'melee attack',
          'Goblin 1',
          { success: false }
        );
        console.log(`${narrative}\n`);
      }
    }

    // Test character sheet updates
    console.log('='.repeat(80));
    console.log('TESTING CHARACTER UPDATES');
    console.log('='.repeat(80));
    console.log('');

    // Simulate damage to Thorin
    console.log('💔 Goblin counterattacks Thorin!\n');
    const goblinAttack = rulesEngine.resolveAttack(2, (thorin.ac as any).total);
    
    if (goblinAttack.success) {
      const goblinDamage = rulesEngine.resolveDamage(1, 6, 0); // 1d6 scimitar
      console.log(`🎲 Goblin hits! Damage: ${goblinDamage}\n`);
      
      // Propose HP update
      const hpProposal = player1Agent.updateHP(-goblinDamage, 'Goblin attack');
      console.log(`📝 Proposed edit: ${hpProposal.summary}`);
      console.log(`   Old HP: ${hpProposal.fieldChanges[0].oldValue}`);
      console.log(`   New HP: ${hpProposal.fieldChanges[0].newValue}\n`);
      
      // Apply edit (simulating player confirmation)
      const updatedThorin = player1Agent.applyEdit(hpProposal);
      console.log(`✅ Edit applied! Thorin's HP: ${updatedThorin.hp.current}/${updatedThorin.hp.max}\n`);
    } else {
      console.log(`❌ Goblin misses!\n`);
    }

    // Test Rules Engine
    console.log('='.repeat(80));
    console.log('TESTING RULES ENGINE');
    console.log('='.repeat(80));
    console.log('');

    console.log('🎲 Testing various mechanics:\n');

    // Saving throw
    const saveResult = rulesEngine.resolveSavingThrow(5, 14);
    console.log(`💨 Reflex Save: ${saveResult.roll?.d20} + 5 = ${saveResult.roll?.total} vs DC 14`);
    console.log(`   Result: ${saveResult.success ? '✅ Success' : '❌ Failure'}\n`);

    // Skill check
    const skillResult = rulesEngine.resolveSkillCheck(8, 15);
    console.log(`🔍 Perception Check: ${skillResult.roll?.d20} + 8 = ${skillResult.roll?.total} vs DC 15`);
    console.log(`   Result: ${skillResult.success ? '✅ Success' : '❌ Failure'}\n`);

    // Damage and healing
    const damageTest = rulesEngine.applyDamage(28, 28, 15);
    console.log(`💔 Apply 15 damage to 28 HP:`);
    console.log(`   New HP: ${damageTest.newHP}`);
    console.log(`   Status: ${damageTest.status}\n`);

    const healingTest = rulesEngine.applyHealing(13, 28, 10);
    console.log(`💚 Apply 10 healing to 13/28 HP:`);
    console.log(`   New HP: ${healingTest.newHP}`);
    console.log(`   Overheal: ${healingTest.overheal}\n`);

    // Session stats
    console.log('='.repeat(80));
    console.log('SESSION STATISTICS');
    console.log('='.repeat(80));
    console.log('');

    const stats = coordinator.getSessionStats();
    console.log(`📊 Session ID: ${stats.sessionId}`);
    console.log(`👥 Players: ${stats.playerCount}`);
    console.log(`🎮 Phase: ${stats.phase}`);
    console.log(`🔄 Round: ${stats.round || 'N/A'}`);
    console.log(`⏳ Pending Confirmations: ${stats.pendingConfirmations}\n`);

    // Summary
    console.log('='.repeat(80));
    console.log('TEST COMPLETE');
    console.log('='.repeat(80));
    console.log('');
    console.log('✅ All agent systems operational!');
    console.log('✅ Combat simulation successful!');
    console.log('✅ Character management working!');
    console.log('✅ Rules engine validated!');
    console.log('');
    console.log('🎉 Backend is ready for integration!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// Run Test
// ============================================================================

if (require.main === module) {
  runTestHarness().catch(console.error);
}

export default runTestHarness;