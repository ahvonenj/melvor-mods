// @ts-nocheck

function waitForElm (selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

export async function setup(ctx : ModContext) {
    ctx.onInterfaceReady(() => {
        (async () => {
            const filterButtonContainer = await waitForElm('#itemlog-container > div.row > div:nth-child(3)');
            const filterDrops = `<button role="button" class="btn btn-sm btn-info m-1" onclick="filterItemLog(5);">Only drops</button>`;
            const filterDropsNotObtained = `<button role="button" class="btn btn-sm btn-info m-1" onclick="filterItemLog(6);">Only unobtained drops</button>`;
            const filterDropsObtained = `<button role="button" class="btn btn-sm btn-info m-1" onclick="filterItemLog(7);">Only obtained drops</button>`;

            if(filterButtonContainer === null) {
                console.error('Could not find filter button container');
                return;
            }

            filterButtonContainer.innerHTML += `${filterDrops}${filterDropsNotObtained}${filterDropsObtained}`;

            window['filterItemLog'] = (filter: number) => {
                $('#searchTextbox-items').val('');

                let shouldShow;
                let monsterDroppedItems = [];
                let missingMonsterDroppedItems = [];
                let notMissingMonsterDroppedItems = [];

                if([5, 6, 7].includes(filter)) {
                    monsterDroppedItems = game.items.allObjects.filter(item => game.monsters.allObjects.some(monster => monster.lootTable.drops.find(drop => drop.item.id === item.id)));
                    missingMonsterDroppedItems = monsterDroppedItems.filter(item => game.stats.itemFindCount(item) === 0);
                    notMissingMonsterDroppedItems = monsterDroppedItems.filter(item => game.stats.itemFindCount(item) > 0);
                }

                switch (filter) 
                {
                    case 0:
                        shouldShow = (item,found)=>found || !item.ignoreCompletion;
                        break;
                    case 1:
                        shouldShow = (_,found)=>found;
                        break;
                    case 2:
                        shouldShow = (item,found)=>!found && !item.ignoreCompletion;
                        break;
                    case 3:
                        shouldShow = (item,_)=>(item.namespace == 'melvorD' || item.namespace == 'melvorF') && !item.ignoreCompletion;
                        break;
                    case 4:
                        shouldShow = (item,_)=>item.namespace == 'melvorTotH' && !item.ignoreCompletion;
                        break;
                    // MODDED
                    case 5:
                        shouldShow = (item,_)=> monsterDroppedItems.find(mi => item.id === mi.id) && !item.ignoreCompletion;
                        break;
                    case 6:
                        shouldShow = (item,_)=> missingMonsterDroppedItems.find(mi => item.id === mi.id) && !item.ignoreCompletion;
                        break;
                    case 7:
                        shouldShow = (item,_)=> notMissingMonsterDroppedItems.find(mi => item.id === mi.id) && !item.ignoreCompletion;
                        break;
                }

                game.items.forEach((item) => {
                    const element = completionLogMenu.items.get(item);

                    if (element === undefined)
                        return;

                    const found = game.stats.itemFindCount(item) > 0;

                    if(shouldShow(item, found))
                        showElement(element);
                    else
                        hideElement(element);
                }
                );
            }
        })();
    });
}