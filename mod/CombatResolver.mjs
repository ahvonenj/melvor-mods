export class CombatResolver {

    targetArea = null;
    _debug = true;

    constructor() {

    }

    _log(str) {
        if(!this._debug) return;
        console.log(str);
    }

    setTargetArea(area) {
        this._log(`WillIDie: Setting new target area`);
        this._log(area);

        this.targetArea = area;
        this.recalculateSurvivability();
    }

    getMonsterData(monsterID) {

        // Create a new Enemy object
        const enemy = new Enemy(game.combat, game);
    
        // Create "dummy" player by taking a copy of the current player
        // so that we can safely set its damage reduction to 0
        const dPlayer = { ...game.combat.player };
        dPlayer.stats.damageReduction = 0;
    
        // Container for damage data which we will return
        const enhancedDamageData = { 
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
        const monster = game.monsters.find(m => m.id === monsterID);
        enemy.setMonster(monster);
    
        // Set the monster combat target to our dummy player
        enemy.target = dPlayer;
    
        // Compute normal attack max hit
        enemy.computeMaxHit();
    
        // Compute all combat stats just in case or something
        enemy.computeCombatStats()
    
        // Add the computed max hit to the monsterDamageData object
        enhancedDamageData.normalAttackMaxHit = enemy.stats.maxHit;
        
        // This might be needed, but disabled for now
        //if(monster.availableAttacks.length === 1 && monster.availableAttacks[0].attack === game.normalAttack)
        //	return monsterDamageData;
    
        // Loop through the special attacks of the monster
        enemy.availableAttacks.forEach(selection => {
            enhancedDamageData.specialAttacks.push({
                attackName: selection.attack.name,
                attackMaxHit: enemy.getAttackMaxDamage(selection.attack),
                originalSpec: selection.attack
            });
        });

        enhancedDamageData.enemy = enemy;
        enhancedDamageData.monster = monster;
    
        return enhancedDamageData;
    }

    _combatTriangleMultiplier(playerStyle, monsterStyle) {
        let mult = 1;

        switch(playerStyle) {
            case "melee":
                mult = monsterStyle === "melee" ? 1 : monsterStyle === "ranged" ? 1.25 : monsterStyle === "magic" ? 0.5 : 1;
                break;
            case "ranged":
                mult = monsterStyle === "melee" ? 0.75 : monsterStyle === "ranged" ? 1 : monsterStyle === "magic" ? 1.25 : 1;
                break;
            case "magic":
                mult = monsterStyle === "melee" ? 1.25 : monsterStyle === "ranged" ? 0.75 : monsterStyle === "magic" ? 1 : 1;
                break;
            default:
                break;
        }

        return mult;
    }

    recalculateSurvivability() {
        this._log("WillIDie: Recalculating survivability");

        if(this.targetArea === null) return;

        const aaTreshold = game.combat.player.autoEatThreshold;
        
        let currentMaxHit = 0;
        let currentReduced = 0;
        let maxHitReason = null;

        let survivabilityData = {
            aaTreshold: aaTreshold,
            area: { ...this.targetArea },
            monsters: {}
        };

        this.targetArea.monsters
        .map(m => this.getMonsterData(m.id))
        .forEach(monsterDamageData => {
            
            let mName = monsterDamageData.monster.name;

            let playerStyle = game.combat.player.attackType;
            let monsterStyle = monsterDamageData.monster.attackType;
            let triangleMult = this._combatTriangleMultiplier(playerStyle, monsterStyle);
            
            survivabilityData.monsters[mName] = {
                name: mName,
                status: {
                    specialAttacks: { }
                }
            };

            survivabilityData.monsters[mName].status.playerStyle = playerStyle;
            survivabilityData.monsters[mName].status.monsterStyle = monsterStyle;
            survivabilityData.monsters[mName].status.triangleMult = triangleMult;
            survivabilityData.monsters[mName].status.maxHit = monsterDamageData.normalAttackMaxHit * triangleMult;
            game.combat.player.computeDamageReduction();
            survivabilityData.monsters[mName].status.maxHitReduced = 
            Math.ceil(monsterDamageData.normalAttackMaxHit * triangleMult * (1 - (game.combat.player.stats.damageReduction / 100)));

            // Check normal attack
            if(monsterDamageData.normalAttackMaxHit > currentMaxHit) {
                currentMaxHit = monsterDamageData.normalAttackMaxHit * triangleMult;
                game.combat.player.computeDamageReduction();
                currentReduced = Math.ceil(currentMaxHit * (1 - (game.combat.player.stats.damageReduction / 100)));
                maxHitReason = `[${mName}] -> <NORMAL ATTACK (Max: ${currentMaxHit}, Red: ${currentReduced})>`;
            }

            // Check special attacks
            monsterDamageData.specialAttacks.forEach(spec => {
                const ogSpec = spec.originalSpec;
                let stunMult = ogSpec.onhitEffects.some((e) => e.type === "Stun") || ogSpec.prehitEffects.some((e) => e.type === "Stun") ? 1.3 : 1;

                survivabilityData.monsters[mName].status[spec.attackName] = {};
                survivabilityData.monsters[mName].status[spec.attackName].stun = stunMult > 1;

                survivabilityData.monsters[mName].status[spec.attackName].maxHit = spec.attackMaxHit * stunMult * triangleMult;
                game.combat.player.computeDamageReduction();
                survivabilityData.monsters[mName].status[spec.attackName].maxHitReduced = 
                Math.ceil(spec.attackMaxHit * stunMult * triangleMult * (1 - (game.combat.player.stats.damageReduction / 100)));

                if(spec.attackMaxHit > currentMaxHit) {
                    currentMaxHit = spec.attackMaxHit * stunMult * triangleMult;
                    game.combat.player.computeDamageReduction();
                    currentReduced = Math.ceil(currentMaxHit * (1 - (game.combat.player.stats.damageReduction / 100)));
                    maxHitReason = `[${mName}] -> <${spec.attackName.toUpperCase()} (Max: ${currentMaxHit}, Red: ${currentReduced}) !STUN! >`;
                }
            });
        });

        survivabilityData.maxHit = currentMaxHit;
        survivabilityData.maxHitReduced = currentReduced;
        survivabilityData.maxHitReason = maxHitReason;
        survivabilityData.canDie = currentReduced >= aaTreshold;

        if(currentReduced >= aaTreshold)
            this._log(`WillIDie: You could die to: ${maxHitReason} -- ${currentReduced} >>> ${aaTreshold}`);
        else
            this._log(`WillIDie: Area is safe, even with: ${maxHitReason} -- ${currentReduced} <<< ${aaTreshold}`);

        this._log(survivabilityData)

    }
}