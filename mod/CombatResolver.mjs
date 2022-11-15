export class CombatResolver {

    targetArea = null;
    currentSurvivabilityState = null;
    
    tabComponent = null; 
    tabButton = null;
    tabContent = null;
    
    headerComponentCreated = false;
    _debug = true;

    constructor() {

    }

    _log(str) {
        if(!this._debug) return;
        console.log(str);
    }

    _createHeaderComponent() {
        if(this.headerComponentCreated) return;

        this._log(`WillIDie: Creating header component`);

        // We want to append our own header tab after equipment tab in the header
        const targetTab = document.querySelector('#page-header-equipment-dropdown').parentElement;

        if(!targetTab) {
            console.error(`WillIDie: COULD NOT CREATE HEADER COMPONENT`);
            return;
        }

        // Tab element
        this.tabComponent = createElement('div', {
            id: "will-i-die-header-tab",
            classList: ["dropdown", "d-inline-block", "ml-2"]
        });

        // Button element for the tab
        this.tabButton = createElement('button', {
            id: "will-i-die-header-tab-btn",
            classList: ["btn", "btn-sm", "btn-dual"],
            attributes: [['data-toggle', 'dropdown']]
        });

        this.tabComponent.appendChild(this.tabButton);

        // Dropdown for when the tab is clicked
        const dropdown = createElement('div', {
            id: "will-i-die-header-tab-dropdown",
            classList: ["dropdown-menu", "dropdown-menu-lg", "dropdown-menu-right", "p-0", "border-0", "font-size-sm"]
        });

        dropdown.appendChild(createElement('div', {
            classList: ["p-2", "text-center"]
        }).appendChild(createElement('div', {
            classList: ["dropdown-header"],
            text: "Will I Die?"
        })));

        this.tabContent = createElement('div', {
            classList: ["block-content", "block-content-full", "pt-0", "combat-resolver-tab-content"]
        })

        dropdown.appendChild(this.tabContent);
        this.tabComponent.appendChild(dropdown);
        targetTab.after(this.tabComponent);

        this.headerComponentCreated = true;

        this._reRender();
    }

    // Rerenders all the DOM elements related to this mod with new values
    _reRender() {
        if(!this.headerComponentCreated) return;

        this._log(`WillIDie: Rerendering`);

        // No area target selected or some other issue - can't tell if safe or not so we render ?
        if(!this.currentSurvivabilityState || !this.targetArea) {
            this.tabButton.textContent = "?";
            this.tabButton.classList.remove('combat-resolver-safe');
            this.tabButton.classList.remove('combat-resolver-danger');
            this.tabButton.classList.add('combat-resolver-unknown');

            this.tabContent.innerHTML = `Got to the Combat Area Selection page to first set a combat area target for WillIDie.<br/><br/>
            After you have set the combat area target, WillIDie will begin to calculate whether you will live or die 
            when idling in the selected area, based on your current gear and statistics.`;

            return;
        }

        const { 
            canDie, 
            maxHitReason, 
            maxHit,
            maxHitReduced,
            aaThreshold
        } = this.currentSurvivabilityState;

        const area = this.targetArea;

        if(canDie) {
            this.tabButton.textContent = "DANGER";
            this.tabButton.classList.remove('combat-resolver-unknown');
            this.tabButton.classList.remove('combat-resolver-safe');
            this.tabButton.classList.add('combat-resolver-danger');

            this.tabContent.innerHTML = `<span class = "cr-hl-warn">YOU COULD DIE.</span><br/><br/>
            In the worst case, a monster named 
            <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> in 
            <span class = "cr-hl cr-hl-area">${area.name}</span> could perform 
            <span class = "cr-hl cr-hl-spec">${maxHitReason.attack}</span> and hit you for 
            <span class = "cr-hl cr-hl-dmg">${maxHitReduced}</span> after damage reduction.<br/><br/>As
            <span class = "cr-hl cr-hl-dmg">${maxHitReduced}</span> is greater than your auto-eat threshold of 
            <span class = "cr-hl cr-hl-health">${aaThreshold}</span>,
            <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> could kill you.`;
        }
        else {
            this.tabButton.textContent = "SAFE";
            this.tabButton.classList.remove('combat-resolver-unknown');
            this.tabButton.classList.remove('combat-resolver-danger');
            this.tabButton.classList.add('combat-resolver-safe');

            this.tabContent.innerHTML = `<span class = "cr-hl-ok">YOU SHOULD BE SAFE.</span><br/><br/>
            In the worst case, a monster named 
            <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> in 
            <span class = "cr-hl cr-hl-area">${area.name}</span> could perform 
            <span class = "cr-hl cr-hl-spec">${maxHitReason.attack}</span> and hit you for 
            <span class = "cr-hl cr-hl-dmg">${maxHitReduced}</span> after damage reduction.<br/><br/>As
            <span class = "cr-hl cr-hl-dmg">${maxHitReduced}</span> is less than your auto-eat threshold of 
            <span class = "cr-hl cr-hl-health">${aaThreshold}</span>,
            <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> shouldn't be able to kill you.`;
        }
    }

    setTargetArea(area) {
        this._log(`WillIDie: Setting new target area`);
        this._log(area);

        this.targetArea = area;
        this.recalculateSurvivability();
    }

    /*
        Simulates a player-monster relation
        Makes a deep copy of the player object, dereferencing it
        Also creates a simulated dummy monster
        Uses the player copy and the simulated monster to calculate max hits and the like
    */
    getMonsterData(monsterID) {

        // Create a new Enemy object
        const enemy = new Enemy(game.combat, game);
    
        // Create "dummy" player by taking a copy of the current player
        // so that we can safely set its damage reduction to 0
        // MUST USE $.extend !!!! const dPlayer = { ...game.combat.player } DOES NOT PROPERLY DEREFERENCE
        // ---> dPlayer.stats.damageReduction WOULD SET THE ACTUAL DR TO 0 !!!
        const dPlayer = $.extend(true, {}, game.combat.player);
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
    
        // In case we need to compute all combat stats
        //enemy.computeCombatStats()
    
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

    // Resolves the correct combat triangle DR multiplier, given 2 attack styles
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

    // Meat of this mod
    recalculateSurvivability() {
        if(this.targetArea === null) {
            this._reRender();
            return;
        }

        this._log("WillIDie: Recalculating survivability");

        // Get the auto-eat treshold (not a %, but straight up health value)
        const aaThreshold = game.combat.player.autoEatThreshold;
        
        let currentMaxHit = 0;
        let currentReduced = 0;
        let maxHitReason = {};

        let survivabilityData = {
            aaThreshold: aaThreshold,
            area: { ...this.targetArea },
            monsters: {}
        };

        // Go through each monster of the selected target area
        this.targetArea.monsters
        .map(m => this.getMonsterData(m.id))
        .forEach(monsterDamageData => {
            
            // Get data
            let mName = monsterDamageData.monster.name;
            let playerStyle = game.combat.player.attackType;
            let monsterStyle = monsterDamageData.monster.attackType;
            let triangleMult = this._combatTriangleMultiplier(playerStyle, monsterStyle);
            let stunMult = 1;

            monsterDamageData.specialAttacks.forEach(spec => {
                // Native special attack data
                const ogSpec = spec.originalSpec;

                // When you are stunned, monsters hit for 30% more
                // We're calculating the worst-case-scenario, so if a monster can stun with any attack,
                // we assume that the 30% always applies
                if(ogSpec.onhitEffects.some((e) => e.type === "Stun") ||
                ogSpec.prehitEffects.some((e) => e.type === "Stun")) {
                    stunMult = 1.3;
                    return;
                }
            });

            // Effective normal attack max hit, when we take triangle multiplier into account
            // ASSUMES PLAYER DR TO BE 0
            const effectiveMaxHit = monsterDamageData.normalAttackMaxHit * triangleMult * stunMult;
            
            survivabilityData.monsters[mName] = {
                name: mName,
                status: {
                    specialAttacks: { }
                }
            };

            // Set values for survivabilityData
            survivabilityData.monsters[mName].status.playerStyle = playerStyle;
            survivabilityData.monsters[mName].status.monsterStyle = monsterStyle;
            survivabilityData.monsters[mName].status.triangleMult = triangleMult;
            survivabilityData.monsters[mName].status.maxHit = effectiveMaxHit;
            game.combat.player.computeDamageReduction();
            survivabilityData.monsters[mName].status.maxHitReduced = 
            Math.ceil(effectiveMaxHit * (1 - (game.combat.player.stats.damageReduction / 100)));

            // Check if this attack hits more than 
            // the current maximum hit of the monsters in the area
            if(effectiveMaxHit > currentMaxHit) {
                currentMaxHit = effectiveMaxHit;
                game.combat.player.computeDamageReduction();
                currentReduced = Math.ceil(currentMaxHit * (1 - (game.combat.player.stats.damageReduction / 100)));
                maxHitReason = {
                    explain: `[${mName}] -> <NORMAL ATTACK (Max: ${currentMaxHit}, Red: ${currentReduced})>`,
                    monsterName: mName,
                    attack: "Normal Attack"
                }
            }

            // Check special attacks
            monsterDamageData.specialAttacks.forEach(spec => {
                const effectiveMaxHit = spec.attackMaxHit * stunMult * triangleMult;

                survivabilityData.monsters[mName].status[spec.attackName] = {};
                survivabilityData.monsters[mName].status[spec.attackName].stun = stunMult > 1;
                survivabilityData.monsters[mName].status[spec.attackName].maxHit = effectiveMaxHit;

                game.combat.player.computeDamageReduction();

                survivabilityData.monsters[mName].status[spec.attackName].maxHitReduced = 
                Math.ceil(spec.attackMaxHit * stunMult * triangleMult * (1 - (game.combat.player.stats.damageReduction / 100)));

                if(effectiveMaxHit > currentMaxHit) {
                    currentMaxHit = effectiveMaxHit;
                    game.combat.player.computeDamageReduction();
                    currentReduced = Math.ceil(currentMaxHit * (1 - (game.combat.player.stats.damageReduction / 100)));
                    maxHitReason = {
                        explain: `[${mName}] -> <${spec.attackName.toUpperCase()} (Max: ${currentMaxHit}, Red: ${currentReduced}) !STUN! >`,
                        monsterName: mName,
                        attack: spec.attackName.toUpperCase()
                    }
                }
            });
        });

        // Maximum of all maximum hits that the monsters can do in this area
        survivabilityData.maxHit = currentMaxHit;
        survivabilityData.maxHitReduced = currentReduced;
        survivabilityData.maxHitReason = maxHitReason;
        survivabilityData.canDie = currentReduced >= aaThreshold;

        if(currentReduced >= aaThreshold)
            this._log(`WillIDie: You could die to: ${maxHitReason.explain} -- ${currentReduced} >>> ${aaThreshold}`);
        else
            this._log(`WillIDie: Area is safe, even with: ${maxHitReason.explain} -- ${currentReduced} <<< ${aaThreshold}`);

        this._log(survivabilityData);
        
        this.currentSurvivabilityState = survivabilityData;

        this._reRender();
    }
}