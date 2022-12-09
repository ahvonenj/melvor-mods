export class WIDMonster {
    monsterId = null;

    gameClone = null;

    dummyEnemy = null;
    dummyPlayer = null;
    dummyMonster = null;

    name = null;
    attackStyle = null;

    canStun = false;
    canSleep = false;
    canFreeze = false;
    stunDamageMultiplier = 1;
    sleepDamageMultiplier = 1;
    freezeDamageMultiplier = 1;
    totalDamageMultiplier = 1;

    combatTriangleMultiplier = 1;

    specialAttacks = [];
    specialAttackChanceTotal = 0;

    normalAttackMaxHit = 0;
    effectiveNormalAttackMaxHit = 0;
    specialAttackMaxHit = 0;
    effectiveSpecialAttackMaxHit = 0;
    maxHit = 0;
    effectiveMaxHit = 0;

    // Internal player values
    _playerAttackStyle = null;
    _playerDamageReduction = 0;

    constructor(monsterId) {
        this.monsterId = monsterId;

        this.gameClone = $.extend(true, {}, game);

        this.dummyEnemy = new Enemy(this.gameClone.combat, this.gameClone);
        this.dummyPlayer = $.extend(true, {}, this.gameClone).combat.player;

        this._playerAttackStyle = this.dummyPlayer.attackType;
    
        /*
            Set monster for the Enemy object via id lookup from game.monsters
            Example id: "melvorF:Umbora"
            Game data stuff can be found:
            https://melvoridle.com/assets/schema/gameData.json
            https://melvoridle.com/assets/data/melvorFull.json
            https://melvoridle.com/assets/data/melvorTotH.json
        */
        this.dummyMonster = this.gameClone.monsters.find(m => m.id === this.monsterId);

        this.dummyEnemy.setMonster(this.dummyMonster);
        this.dummyEnemy.target = this.dummyPlayer;
        this.dummyEnemy.computeMaxHit();

        this.dummyPlayer.computeDamageReduction();
        this._playerDamageReduction = this.dummyPlayer.stats.damageReduction;

        this.specialAttackChanceTotal = 0;
        this.name = this.dummyMonster._name;
        this.attackStyle = this.dummyMonster.attackType;

        this.combatTriangleMultiplier = this._combatTriangleMultiplier();
        
        this.dummyEnemy.availableAttacks.forEach(specialAttack => {

            this.specialAttackChanceTotal += specialAttack.chance;

            let canStun = false;
            let canSleep = false;
            let canFreeze = false;

            // When you are stunned, monsters hit for 30% more
            // We're calculating the worst-case-scenario, so if a monster can stun with any attack,
            // we assume that the 30% always applies
            if(specialAttack.attack.onhitEffects.some((e) => e.type === "Stun") ||
            specialAttack.attack.prehitEffects.some((e) => e.type === "Stun")) {
                canStun = true;
                this.canStun = true;
                this.stunMult = 1.3;
            }

            // When you are sleeping, monsters hit for 20% more
            // We're calculating the worst-case-scenario, so if a monster can sleep with any attack,
            // we assume that the 20% always applies
            if(specialAttack.attack.onhitEffects.some((e) => e.type === "Sleep") ||
            specialAttack.attack.prehitEffects.some((e) => e.type === "Sleep")) {
                canSleep = true;
                this.canSleep = true;
                this.sleepMult = 1.2;
            }

            // When you are frozen, monsters hit for 30% more
            // We're calculating the worst-case-scenario, so if a monster can freeze with any attack,
            // we assume that the 20% always applies
            if(specialAttack.attack.onhitEffects.some((e) => e.type === "Freeze") ||
            specialAttack.attack.prehitEffects.some((e) => e.type === "Freeze")) {
                canFreeze = true;
                this.canFreeze = true;
                this.freezeMult = 1.3;
            }

            const maxHit = this.dummyEnemy.getAttackMaxDamage(specialAttack.attack);

            this.specialAttacks.push({
                specialAttackName: specialAttack.attack.name,
                maxHit,
                canStun,
                canSleep,
                canFreeze,
                originalSpecialAttack: specialAttack.attack
            });
        });

        if(this.canStun || this.canSleep || this.canFreeze) {
            this.totalDamageMultiplier = Math.max(this.stunDamageMultiplier, this.sleepDamageMultiplier, this.freezeDamageMultiplier);
        }

        this.specialAttacks.map(specialAttack => {
            this.dummyPlayer.computeDamageReduction();
            const effectiveMaxHit = Math.ceil(specialAttack.maxHit * this.totalDamageMultiplier * (1 - (this._playerDamageReduction * this.combatTriangleMultiplier / 100)));
            specialAttack.effectiveMaxHit = effectiveMaxHit;
        });

        // Enemy cannot normal attack, if it will always use some special attack and none of them can normal attack
        if(this.specialAttackChanceTotal >= 100 && 
            this.dummyEnemy.availableAttacks.every(a => a.attack.canNormalAttack === false && 
            a.attack.descriptionGenerator.indexOf('Normal attack') === -1)
        ) {
            this.canNormalAttack = false;
        } else {
            this.canNormalAttack = true;
        }  

        this.normalAttackMaxHit = this._calculateStandardMaxHit()
        this.dummyPlayer.computeDamageReduction();
        this.effectiveNormalAttackMaxHit = Math.ceil(this.normalAttackMaxHit * this.totalDamageMultiplier * (1 - (this._playerDamageReduction * this.combatTriangleMultiplier / 100)));

        this.specialAttackMaxHit = this.specialAttacks.reduce((max, specialAttack) => specialAttack.maxHit > max ? specialAttack.maxHit : max, 0);
        this.effectiveSpecialAttackMaxHit = this.specialAttacks.reduce((max, specialAttack) => specialAttack.effectiveMaxHit > max ? specialAttack.effectiveMaxHit : max, 0);

        this.maxHit = Math.max(this.normalAttackMaxHit, this.specialAttackMaxHit);
        this.effectiveMaxHit = Math.max(this.effectiveNormalAttackMaxHit, this.effectiveSpecialAttackMaxHit);
    }

    whatMakesMeDangerous() {
        let explain = {
            monsterName: this.name,
        };

        if(this.normalAttackMaxHit > this.specialAttackMaxHit && this.canNormalAttack) {
            explain.bestAttackName = "Normal Attack";
            explain.maxHit = this.normalAttackMaxHit;
            explain.effectiveMaxHit = this.effectiveNormalAttackMaxHit;
        } else {
            explain.bestAttackName = this.specialAttacks.find(s => s.maxHit === this.specialAttackMaxHit).specialAttackName;
            explain.maxHit = this.specialAttackMaxHit;
            explain.effectiveMaxHit = this.effectiveSpecialAttackMaxHit;
        }

        return explain;
    }

    _combatTriangleMultiplier() {
        const reductions = this.gameClone.currentGamemode.combatTriangle.reductionModifier;
        return reductions[this._playerAttackStyle][this.attackStyle];
    }

    _calculateStandardMaxHit() {
        let maxHit;
        let effectiveLevel;
        let equipmentbonus;

        switch (this.attackStyle) 
        {
            case 'magic':
                let _a;
                if (this.dummyEnemy.spellSelection.ancient !== undefined) {
                    return numberMultiplier * this.dummyEnemy.spellSelection.ancient.specialAttack.damage[0].maxPercent;
                }
                const spell = (_a = this.dummyEnemy.spellSelection.standard) !== null && _a !== void 0 ? _a : this.dummyEnemy.spellSelection.archaic;
                if (spell !== undefined) {
                    maxHit = Math.floor(numberMultiplier * spell.maxHit * (1 + this.dummyEnemy.equipmentStats.magicDamageBonus / 100) * (1 + (this.dummyMonster.levels.Magic + 1) / 200));
                }
                else {
                    maxHit = 0;
                }
                break;
            case 'ranged':
                effectiveLevel = this.dummyMonster.levels.Ranged + 9;
                equipmentbonus = this.dummyEnemy.equipmentStats.rangedStrengthBonus;
                maxHit = Math.floor(numberMultiplier * (1.3 + effectiveLevel / 10 + equipmentbonus / 80 + (effectiveLevel * equipmentbonus) / 640));
                break;
            case 'melee':
                effectiveLevel = this.dummyMonster.levels.Strength + 9;
                equipmentbonus = this.dummyEnemy.equipmentStats.meleeStrengthBonus;
                maxHit = Math.floor(numberMultiplier * (1.3 + effectiveLevel / 10 + equipmentbonus / 80 + (effectiveLevel * equipmentbonus) / 640));
                break;
            default:
                throw new Error();
        }

        return maxHit;
    }
}