import { WIDMonster } from "./widmonster.mjs";

export class CombatResolver {

    targetArea = null;
    targetMonster = null;
    targetSlayerTask = null;
    currentSurvivabilityState = null;
    
    tabComponent = null; 
    tabButton = null;
    tabContent = null;
    safetyFactorElement = null;

    safetyFactor = 1.02;
    skipRequirements = false;

    pendingRecalculation = false;
    
    headerComponentCreated = false;
    _debug = false;

    _ctx = null;

    _debugValues = {
        monsters: [],
        mostDangerousMonster: null,
        player: {
            damageReduction: 0
        }
    }

    constructor() {

    }

    // Called in setup.mjs, after settings have been created
    _init(ctx) {
        this._ctx = ctx;
        this.safetyFactor = 1 + (ctx.settings.section('Safety Factor').get('safety_factor') / 100);
        this.skipRequirements = ctx.settings.section('Requirements').get('skip_requirements');
        this._debug = ctx.settings.section('Debug').get('debug_mode');
    }

    _log(str, ...args) {
        if(!this._debug) return;
        console.log(str, ...args);
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

        const header = createElement('div', {
            classList: ["dropdown-header"],
            text: "Will I Die?"
        });

        this.safetyFactorElement = createElement('div', {
            classList: ["wid-safety-factor"],
            text: `Safety Factor: ${this.safetyFactor}x`
        });

        header.onclick = () => {
            this._printDebugValues();
        }

        dropdown.appendChild(createElement('div', {
            classList: ["p-2", "text-center"]
        }).appendChild(header));

        this.tabContent = createElement('div', {
            classList: ["block-content", "block-content-full", "pt-0", "combat-resolver-tab-content"]
        })

        dropdown.appendChild(this.safetyFactorElement);
        dropdown.appendChild(this.tabContent);
        this.tabComponent.appendChild(dropdown);
        targetTab.after(this.tabComponent);

        this.headerComponentCreated = true;

        this._reRender();
    }

    _printDebugValues() {
        if(!this._debug) return;

        console.group('WILL I DIE DEBUG VALUES');
        console.log("Target area", this.targetArea);
        console.log("Target Monster", this.targetMonster);
        console.log("Target Slayer Task", this.targetSlayerTask);
        console.log("Current survivability state", this.currentSurvivabilityState);
        console.log("Monsters", this._debugValues.monsters);
        console.log("Most dangerous monster", this._debugValues.mostDangerousMonster);
        console.log("Player", this._debugValues.player);
        console.log("Safety Factor", this.safetyFactor);
        console.log("Skip Requirements", this.skipRequirements);
        console.log("Pending Recalculation", this.pendingRecalculation);
        console.groupEnd();
    }

    _reRenderSafetyFactor() {
        this.safetyFactorElement.innerHTML = `Safety Factor: ${this.safetyFactor}x`;

        this.safetyFactorElement.classList.remove('wid-safety-factor-warning');
        this.safetyFactorElement.classList.remove('wid-safety-factor-danger');

        if(this.safetyFactor < 1.05) {
            this.safetyFactorElement.classList.add('wid-safety-factor-danger');
        } else if(this.safetyFactor < 1.07) {
            this.safetyFactorElement.classList.add('wid-safety-factor-warning');
        }
    }

    // Rerenders all the DOM elements related to this mod with new values
    _reRender() {
        if(!this.headerComponentCreated) return;

        this._log(`WillIDie: Rerendering`);

        // No area target selected or some other issue - can't tell if safe or not so we render ?
        if(!this.currentSurvivabilityState) {
            this.tabButton.textContent = "?";
            this.tabButton.classList.remove('combat-resolver-safe');
            this.tabButton.classList.remove('combat-resolver-danger');
            this.tabButton.classList.add('combat-resolver-unknown');

            this.tabContent.innerHTML = `Got to the Combat Area Selection page to first set a combat area target for WillIDie.<br/><br/>
            After you have set the combat area target, WillIDie will begin to calculate whether you will live or die 
            when idling in the selected area, based on your current gear and statistics.`;

            this._reRenderSafetyFactor();

            return;
        }

        const { 
            canDie, 
            maxHitReason, 
            maxHit,
            effectiveMaxHit,
            autoEatThreshold,
            areaName,
            playerIsWorseThanEnemy,
            playerCanKillSelf,
            playerSelfHit
        } = this.currentSurvivabilityState;

        if(canDie || playerCanKillSelf) {
            this.tabButton.textContent = "DANGER";
            this.tabButton.classList.remove('combat-resolver-unknown');
            this.tabButton.classList.remove('combat-resolver-safe');
            this.tabButton.classList.remove('combat-resolver-recalc');
            this.tabButton.classList.add('combat-resolver-danger');

            if(this.pendingRecalculation) {
                this.tabButton.classList.add('combat-resolver-recalc');
            }

            if(playerIsWorseThanEnemy) {
                this.tabContent.innerHTML = `<span class = "cr-hl cr-hl-warn">YOU COULD DIE.</span><br/><br/>
                In the worst case, a player named 
                <span class = "cr-hl cr-hl-enemy">${game.characterName}</span> in 
                <span class = "cr-hl cr-hl-area">their mom's basement</span> could hit themselves for 
                <span class = "cr-hl cr-hl-dmg">${playerSelfHit}</span>.<br/><br/>As
                <span class = "cr-hl cr-hl-dmg">${playerSelfHit}</span> is greater than your auto-eat threshold of 
                <span class = "cr-hl cr-hl-health">${autoEatThreshold}</span>,
                <span class = "cr-hl cr-hl-enemy">this silly mistake</span> could kill you.`;
            } else {
                this.tabContent.innerHTML = `<span class = "cr-hl cr-hl-warn">YOU COULD DIE.</span><br/><br/>
                In the worst case, a monster named 
                <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> in 
                <span class = "cr-hl cr-hl-area">${areaName}</span> could perform 
                <span class = "cr-hl cr-hl-spec">${maxHitReason.bestAttackName}</span> and hit you for 
                <span class = "cr-hl cr-hl-dmg">${effectiveMaxHit}</span> after damage reduction.<br/><br/>As
                <span class = "cr-hl cr-hl-dmg">${effectiveMaxHit}</span> is greater than your auto-eat threshold of 
                <span class = "cr-hl cr-hl-health">${autoEatThreshold}</span>,
                <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> could kill you.`;
            }
            

            this._reRenderSafetyFactor();
        }
        else {
            this.tabButton.textContent = "SAFE";
            this.tabButton.classList.remove('combat-resolver-unknown');
            this.tabButton.classList.remove('combat-resolver-danger');
            this.tabButton.classList.remove('combat-resolver-recalc');
            this.tabButton.classList.add('combat-resolver-safe');

            if(this.pendingRecalculation) {
                this.tabButton.classList.remove('combat-resolver-safe');
                this.tabButton.classList.add('combat-resolver-recalc');

                this.tabContent.innerHTML = `<span class = "cr-hl combat-resolver-recalc">PENDING RECALCULATION.</span><br/><br/>
                In the worst case, a monster named 
                <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> in 
                <span class = "cr-hl cr-hl-area">${areaName}</span> could perform 
                <span class = "cr-hl cr-hl-spec">${maxHitReason.bestAttackName}</span> and hit you for 
                <span class = "cr-hl cr-hl-dmg">${effectiveMaxHit}</span> after damage reduction.<br/><br/>As
                <span class = "cr-hl cr-hl-dmg">${effectiveMaxHit}</span> is less than your auto-eat threshold of 
                <span class = "cr-hl cr-hl-health">${autoEatThreshold}</span>,
                <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> shouldn't be able to kill you.<br/><br/>
                <span class = "cr-hl-warn">THESE VALUES MIGHT NOT BE CORRECT, BECAUSE RECALCULATION IS NEEDED.</span><br/><br/>
                <span class = "cr-hl-warn">LEAVE COMBAT TO RECALCULATE SURVIVABILITY</span>`;
            } else {
                this.tabContent.innerHTML = `<span class = "cr-hl cr-hl-ok">YOU SHOULD BE SAFE.</span><br/><br/>
                In the worst case, a monster named 
                <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> in 
                <span class = "cr-hl cr-hl-area">${areaName}</span> could perform 
                <span class = "cr-hl cr-hl-spec">${maxHitReason.bestAttackName}</span> and hit you for 
                <span class = "cr-hl cr-hl-dmg">${effectiveMaxHit}</span> after damage reduction.<br/><br/>As
                <span class = "cr-hl cr-hl-dmg">${effectiveMaxHit}</span> is less than your auto-eat threshold of 
                <span class = "cr-hl cr-hl-health">${autoEatThreshold}</span>,
                <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> shouldn't be able to kill you.`;
            }

            

            this._reRenderSafetyFactor();
        }
    }

    setTargetArea(e, areaId, areaType) {
        e.preventDefault(); 
        e.stopPropagation();

        this._log(`WillIDie: Setting new target area`);

        let areaData = null;

        if(areaType === 'dungeon') {
            areaData = game.dungeonDisplayOrder.find(d => d.id === areaId);
        } else if(areaType === 'slayer') {
            areaData = game.slayerAreaDisplayOrder.find(d => d.id === areaId);
        } else {
            areaData = game.combatAreaDisplayOrder.find(d => d.id === areaId);
        }

        this._log(areaData);

        if(!this.skipRequirements && areaData instanceof Dungeon && areaData.unlockRequirement !== undefined && !game.checkRequirements(areaData.unlockRequirement)) {
            this._log("WillIDie: Cancelled area target setting - NOT UNLOCKED");
            Toastify({
                text: `Will I Die?: Area is not unlocked`,
                duration: 1500,
                gravity: 'top',
                position: 'center',
                backgroundColor: '#e56767',
                stopOnFocus: false
            }).showToast();
            return;
        }

        if(areaData instanceof SlayerArea) {
            const slayerLevelReq = areaData.slayerLevelRequired;

            if (!this.skipRequirements && !game.checkRequirements(areaData.entryRequirements, false, slayerLevelReq)) {
                this._log("WillIDie: Cancelled area target setting - FAILED REQUIREMENTS");
                Toastify({
                    text: `Will I Die?: Requirements not met`,
                    duration: 1500,
                    gravity: 'top',
                    position: 'center',
                    backgroundColor: '#e56767',
                    stopOnFocus: false
                }).showToast();
                return;
            }
        }

        if(game.combat.fightInProgress || game.combat.isActive) {
            this._log(`WillIDie: Fight in progress, not changing areas`);
            Toastify({
                text: `Will I Die?: Cannot change target area while in combat`,
                duration: 1500,
                gravity: 'top',
                position: 'center',
                backgroundColor: '#e56767',
                stopOnFocus: false
            }).showToast();
            return;
        }

        const unset = this._handleTButton(e, "AREA");

        if(unset)
            return;

        this.targetArea = areaData;
        this.recalculateSurvivability("Target area changed", "AREA", areaData);
    }
    
    setTargetMonster(e, areaId, monsterId, areaType) {
        e.preventDefault(); 
        e.stopPropagation();

        this._log(`WillIDie: Setting new target monster`);

        let areaData = null;

        if(areaType === 'slayer') {
            areaData = game.slayerAreaDisplayOrder.find(d => d.id === areaId);

            if(areaData instanceof SlayerArea) {
                const slayerLevelReq = areaData.slayerLevelRequired;
    
                if (!this.skipRequirements && !game.checkRequirements(areaData.entryRequirements, false, slayerLevelReq)) {
                    this._log("WillIDie: Cancelled area target setting - FAILED REQUIREMENTS");
                    Toastify({
                        text: `Will I Die?: Requirements not met`,
                        duration: 1500,
                        gravity: 'top',
                        position: 'center',
                        backgroundColor: '#e56767',
                        stopOnFocus: false
                    }).showToast();
                    return;
                }
            }
        } else {
            areaData = game.combatAreaDisplayOrder.find(d => d.id === areaId);
        }

        this._log(areaData);
        this._log(monsterId)

        if(game.combat.fightInProgress || game.combat.isActive) {
            this._log(`WillIDie: Fight in progress, not changing monsters`);
            Toastify({
                text: `Will I Die?: Cannot change target monster while in combat`,
                duration: 1500,
                gravity: 'top',
                position: 'center',
                backgroundColor: '#e56767',
                stopOnFocus: false
            }).showToast();
            return;
        }

        const unset = this._handleTButton(e, "MONSTER");

        if(unset)
            return;

        this.recalculateSurvivability("Target area changed", "MONSTER", monsterId, areaData);
    }

    setTargetSlayerTask(e, selectedTier) {
        e.preventDefault(); 
        e.stopPropagation();

        this._log(`WillIDie: Setting new target slayer task`);

        if(game.combat.fightInProgress || game.combat.isActive) {
            this._log(`WillIDie: Fight in progress, not changing slayer task`);
            Toastify({
                text: `Will I Die?: Cannot change target slayer task while in combat`,
                duration: 1500,
                gravity: 'top',
                position: 'center',
                backgroundColor: '#e56767',
                stopOnFocus: false
            }).showToast();
            return;
        }

        const monsters = game.combat.slayerTask.getMonsterSelection(selectedTier);

        if(monsters.length === 0) {
            this._log("WillIDie: Cancelled slayer task target setting - FAILED REQUIREMENTS");
            Toastify({
                text: `Will I Die?: Requirements not met for any monster of this tier`,
                duration: 1500,
                gravity: 'top',
                position: 'center',
                backgroundColor: '#e56767',
                stopOnFocus: false
            }).showToast();
            return;
        }

        this._log(monsters);

        const unset = this._handleTButton(e, "SLAYER");

        if(unset)
            return;

            this.recalculateSurvivability("Target slayer task changed", "SLAYER", monsters);
    }

    recalculateSurvivability(reason = "", areaOrMonster, target) {

        if(game.combat.fightInProgress || game.combat.isActive) {
            this._log(`WillIDie: Fight in progress, not calculating survivability`);
            this.pendingRecalculation = true;
            this._reRender();
            return;
        }

        this.currentSurvivabilityState = null;

        if(areaOrMonster === "NONE") {
            this._log(`WillIDie: Target removed, not calculating survivability`);
            this._reRender();
            return;
        }

        const areas = [...game.combatAreaDisplayOrder, ...game.slayerAreaDisplayOrder, ...game.dungeonDisplayOrder];

        let widMonsters = [];

        if(areaOrMonster === "AREA") {
            widMonsters = target.monsters.map(m => new WIDMonster(m.id, this.safetyFactor, target));
            this.targetArea = target;
            this.targetMonster = null;
            this.targetSlayerTask = null;
        } else if(areaOrMonster === "MONSTER") {
            const areaForMonster = areas.find(a => a.monsters.find(m => m.id === target))
            widMonsters = [new WIDMonster(target, this.safetyFactor, areaForMonster)];
            this.targetMonster = target;
            this.targetArea = null;
            this.targetSlayerTask = null;
        } else if(areaOrMonster === "SLAYER") {
            const areaForMonster = areas.find(a => a.monsters.find(m => m.id === target[0].id))
            widMonsters = target.map(m => new WIDMonster(m.id, this.safetyFactor, areaForMonster));
            this.targetSlayerTask = target;
            this.targetMonster = null;
            this.targetArea = null;
        } else {
            if(this.targetArea && !this.targetMonster && !this.targetSlayerTask) {
                this._log(`WillIDie: Found unambiguous area target for cold function call, recalculating survivability`);
                widMonsters = this.targetArea.monsters.map(m => new WIDMonster(m.id, this.safetyFactor, this.targetArea));
                areaOrMonster === "AREA";
                target = this.targetArea;
            } else if(this.targetMonster && !this.targetArea && !this.targetSlayerTask) {
                this._log(`WillIDie: Found unambiguous monster target for cold function call, recalculating survivability`);
                const areaForMonster = areas.find(a => a.monsters.find(m => m.id === this.targetMonster))
                widMonsters = [new WIDMonster(this.targetMonster, this.safetyFactor, areaForMonster)];
                areaOrMonster === "MONSTER";
                target = this.targetMonster;
            } else if(this.targetSlayerTask && !this.targetArea && !this.targetMonster) {
                this._log(`WillIDie: Found unambiguous slayer target for cold function call, recalculating survivability`);
                const areaForMonster = areas.find(a => a.monsters.find(m => m.id === this.targetSlayerTask[0].id))
                widMonsters = this.targetSlayerTask.map(m => new WIDMonster(m.id, this.safetyFactor, areaForMonster));
                areaOrMonster === "SLAYER";
                target = this.targetSlayerTask;
            } else {
                this._log(`WillIDie: Could not resolve cold function call, not recalculating survivability`);
                this._reRender();
                return;
            }
        }

        this._log(`WillIDie: Recalculating survivability (${reason})`);
        
        const autoEatThreshold = game.combat.player.autoEatThreshold;
        let mostDangerousMonster = null;

        widMonsters.forEach(monster => {
            if(mostDangerousMonster === null) {
                mostDangerousMonster = monster;
                return;
            }

            if(monster.maxHit > mostDangerousMonster.maxHit || monster.effectiveMaxHit > mostDangerousMonster.effectiveMaxHit) {
                mostDangerousMonster = monster;
            }
        });

        if(this._debug) {
            this._debugValues.monsters = widMonsters;
            this._debugValues.mostDangerousMonster = mostDangerousMonster;
            this._debugValues.player.damageReduction = mostDangerousMonster._playerDamageReduction;
        }

        const playerIsWorseThanEnemy = mostDangerousMonster.effectiveDamageTakenPerAttack > mostDangerousMonster.effectiveMaxHit;
        const playerCanKillSelf = (mostDangerousMonster.effectiveDamageTakenPerAttack >= autoEatThreshold && playerIsWorseThanEnemy);

        const area = areas.find(a => a.monsters.find(m => m.id === mostDangerousMonster.monsterId));
        let areaName = area ? area.name : "Unknown";

        this.currentSurvivabilityState = {
            maxHit: mostDangerousMonster.maxHit,
            effectiveMaxHit: mostDangerousMonster.effectiveMaxHit,
            maxHitReason: mostDangerousMonster.whatMakesMeDangerous(),
            canDie: mostDangerousMonster.effectiveMaxHit >= autoEatThreshold,
            autoEatThreshold,
            areaName,

            playerSelfHit: mostDangerousMonster.effectiveDamageTakenPerAttack,
            playerIsWorseThanEnemy,
            playerCanKillSelf
        }
        this.pendingRecalculation = false;
        this._reRender();
    }

    _handleTButton(e) {
        if(e.target.classList.contains('cr-active')) {
            this.targetMonster = null;
            this.targetArea = null;
            this.targetSlayerTask = null;
            this.recalculateSurvivability("Target set to null", "NONE", null);
            e.target.classList.remove('cr-active');
            return true;
        }

        const areaTElements = document.querySelectorAll('.combat-resolver-set-area-target');
        const monsterTElements = document.querySelectorAll('.combat-resolver-set-monster-target');
        const slayerTaskTElements = document.querySelectorAll('.combat-resolver-set-slayer-task-target');
        const TElements = [...areaTElements, ...monsterTElements, ...slayerTaskTElements];

        TElements.forEach((e) => {
            e.classList.remove('cr-active');
        })
        
        e.target.classList.add('cr-active');

        return false;
    }
}