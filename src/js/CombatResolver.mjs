import { WIDMonster } from "./widmonster.mjs";

export class CombatResolver {

    targetArea = null;
    currentSurvivabilityState = null;
    
    tabComponent = null; 
    tabButton = null;
    tabContent = null;
    
    headerComponentCreated = false;
    _debug = false;

    _debugValues = {
        monsters: [],
        mostDangerousMonster: null,
        player: {
            damageReduction: 0
        }
    }

    constructor() {

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

        if(this._debug) {
            header.onclick = () => {
                this._printDebugValues();
            }
        }

        dropdown.appendChild(createElement('div', {
            classList: ["p-2", "text-center"]
        }).appendChild(header));

        this.tabContent = createElement('div', {
            classList: ["block-content", "block-content-full", "pt-0", "combat-resolver-tab-content"]
        })

        dropdown.appendChild(this.tabContent);
        this.tabComponent.appendChild(dropdown);
        targetTab.after(this.tabComponent);

        this.headerComponentCreated = true;

        this._reRender();
    }

    _printDebugValues() {
        console.group('WILL I DIE DEBUG VALUES');
        console.log("Target area", this.targetArea);
        console.log("Current survivability state", this.currentSurvivabilityState);
        console.log("Monsters", this._debugValues.monsters);
        console.log("Most dangerous monster", this._debugValues.mostDangerousMonster);
        console.log("Player", this._debugValues.player);
        console.groupEnd();
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
            effectiveMaxHit,
            autoEatThreshold
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
            <span class = "cr-hl cr-hl-spec">${maxHitReason.bestAttackName}</span> and hit you for 
            <span class = "cr-hl cr-hl-dmg">${effectiveMaxHit}</span> after damage reduction.<br/><br/>As
            <span class = "cr-hl cr-hl-dmg">${effectiveMaxHit}</span> is greater than your auto-eat threshold of 
            <span class = "cr-hl cr-hl-health">${autoEatThreshold}</span>,
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
            <span class = "cr-hl cr-hl-spec">${maxHitReason.bestAttackName}</span> and hit you for 
            <span class = "cr-hl cr-hl-dmg">${effectiveMaxHit}</span> after damage reduction.<br/><br/>As
            <span class = "cr-hl cr-hl-dmg">${effectiveMaxHit}</span> is less than your auto-eat threshold of 
            <span class = "cr-hl cr-hl-health">${autoEatThreshold}</span>,
            <span class = "cr-hl cr-hl-enemy">${maxHitReason.monsterName}</span> shouldn't be able to kill you.`;
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

        if(areaData instanceof Dungeon && areaData.unlockRequirement !== undefined && !game.checkRequirements(areaData.unlockRequirement)) {
            this._log("WillIDie: Cancelled area target setting - NOT UNLOCKED");
            return;
        }

        if(e.target.classList.contains('cr-active')) {
            this.targetArea = null;
            this.recalculateSurvivability("Target area set to null");
            e.target.classList.remove('cr-active');
            return;
        }

        document.querySelectorAll('.combat-resolver-set-area-target').forEach((e) => {
            e.classList.remove('cr-active');
        })
        
        e.target.classList.add('cr-active');

        this.targetArea = areaData;
        this.recalculateSurvivability("Target area changed");
    }

    recalculateSurvivability(reason = "") {
        if(this.targetArea === null) {
            this._log(`WillIDie: No target area set, not calculating survivability`);
            this._reRender();
            return;
        }

        if(game.combat.fightInProgress || game.combat.isActive) {
            this._log(`WillIDie: Fight in progress, not calculating survivability`);
            return;
        }

        this._log(`WillIDie: Recalculating survivability (${reason})`);

        const autoEatThreshold = game.combat.player.autoEatThreshold;
        const widMonsters = this.targetArea.monsters.map(m => new WIDMonster(m.id));
        
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

        this.currentSurvivabilityState = {
            maxHit: mostDangerousMonster.maxHit,
            effectiveMaxHit: mostDangerousMonster.effectiveMaxHit,
            maxHitReason: mostDangerousMonster.whatMakesMeDangerous(),
            canDie: mostDangerousMonster.effectiveMaxHit >= autoEatThreshold,
            autoEatThreshold
        }

        this._reRender();
    }
}