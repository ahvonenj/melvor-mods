export async function setup(ctx) {
    const { CombatResolver } = await ctx.loadModule('CombatResolver.mjs');
    ctx.loadStylesheet('willidie.css');

    const combatResolver = new CombatResolver();

    ctx.patch(CombatAreaMenu, 'createMenuElement').replace(function (fnBody, areaData, id) {    
        const openButton = this.container.appendChild(createElement('div', {
            classList: ['col-12', 'col-md-6', 'col-xl-4']
        })).appendChild(createElement('div', {
            classList: ['block', 'block-content', 'block-rounded', 'border-top', 'border-combat', 'border-4x', 'pointer-enabled', 'clickable', ],
            id: 'clickable',
        }));

        const contentContainer = openButton.appendChild(createElement('div', {
            classList: ['media', 'd-flex', 'align-items-center', 'push']
        }));
        const image = createElement('img', {
            classList: ['shop-img'],
            attributes: [['src', areaData.media]]
        });
        const infoContainer = createElement('div', {
            classList: ['media-body']
        });
        contentContainer.append(createElement('div', {
            classList: ['mr-3'],
            children: [image]
        }), infoContainer);
        const unlockedElems = [];
        const lockedElems = [];
        const tutorialDirection = this.createTutorialDirection(areaData);
        unlockedElems.push(this.createName(areaData));
        let reqSpans = [];
        if (areaData.entryRequirements.length > 0) {
            let requirements;
            ({reqSpans, requirements} = this.createRequirements(areaData));
            unlockedElems.push(requirements);
        }
        let table;
        let buttons;
        const effectDescription = createElement('span');
        if (areaData instanceof SlayerArea) {
            unlockedElems.push(this.createEffectInfo(areaData, effectDescription));
        }
        if (areaData instanceof Dungeon) {
            if (areaData.unlockRequirement !== undefined) {
                lockedElems.push(this.createDungeonUnlock(areaData));
            }
            unlockedElems.push(...this.createDungeonInfo(areaData));
            ({table, buttons} = this.createDungeonTable(areaData));
        } else {
            ({table, buttons} = this.createMonsterTable(areaData));
        }
        infoContainer.append(...lockedElems, tutorialDirection, ...unlockedElems);
        hideElement(table);

        // --------------------------------------- OVERRIDE ---------------------------------------
        const resolverAreaTargetButton = openButton.appendChild(createElement('div', {
            classList: ['combat-resolver-set-area-target'],
            text: "T"
        }))

        resolverAreaTargetButton.onclick = (e) => { 
            e.preventDefault(); 
            e.stopPropagation();

            if(e.target.classList.contains('cr-active')) {
                combatResolver.setTargetArea(null);
                e.target.classList.remove('cr-active');
                return;
            }

            combatResolver.setTargetArea(areaData); 

            document.querySelectorAll('.combat-resolver-set-area-target').forEach((e) => {
                e.classList.remove('cr-active');
            })
            
            e.target.classList.add('cr-active');
        }

        // --------------------------------------- !OVERRIDE! -------------------------------------

        openButton.append(table);
        const eventButton = this.createEventStartButton(areaData);
        hideElement(eventButton);
        openButton.append(eventButton);
        const menuElem = {
            table: table,
            image: image,
            requirements: reqSpans,
            fightButtons: buttons,
            isOpen: false,
            lockedElems: lockedElems,
            unlockedElems: unlockedElems,
            isEventActive: false,
            eventButton,
            openButton,
            effectDescription,
        };
        openButton.onclick = ()=>this.toggleTable(areaData, menuElem);
        this.menuElems.set(areaData, menuElem);
    });
}