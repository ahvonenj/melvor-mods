/*
	Function: createTestMonster
	Params: game (Game), monsterID (string)
	Description: 
	Creates a dummy monster from given id, as well as a dummy player object
	and calculates all of the monster max hits when damageReduction = 0
	Author: Swiffy
*/
export const createTestMonster = (game, monsterID) => {

	// Create a new Enemy object
	const monster = new Enemy(game.combat, game);

	// Create "dummy" player by taking a copy of the current player
	// so that we can safely set its damage reduction to 0
	const dPlayer = { ...game.combat.player };
	dPlayer.stats.damageReduction = 0;

	// Container for damage data which we will return
	const monsterDamageData = { 
		normalAttackMaxHit: null,
		specialAttacks: []
	};

	/*
		Set monster for the Enemy object via id lookup from game.monsters
		Example id: "melvorF:Umbora"
		Game data stuff can be found:
		https://melvoridle.com/assets/schema/gameData.json
		https://melvoridle.com/assets/data/melvorFull.json
		https://melvoridle.com/assets/data/melvorTotH.json
	*/
	monster.setMonster(game.monsters.find(m => m.id === monsterID));

	// Set the monster combat target to our dummy player
	monster.target = dPlayer;

	// Compute normal attack max hit
	monster.computeMaxHit();

	// Compute all combat stats just in case or something
	monster.computeCombatStats()

	// Add the computed max hit to the monsterDamageData object
	monsterDamageData.normalAttackMaxHit = monster.stats.maxHit;
	
	// This might be needed, but disabled for now
	//if(monster.availableAttacks.length === 1 && monster.availableAttacks[0].attack === game.normalAttack)
	//	return monsterDamageData;

	// Loop through the special attacks of the monster
	monster.availableAttacks.forEach(selection => {
		monsterDamageData.specialAttacks.push({
			attackName: selection.attack.name,
			attackMaxHit: monster.getAttackMaxDamage(selection.attack)
		});
	});

	return monsterDamageData;
}