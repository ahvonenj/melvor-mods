

export async function setup(ctx) {
    const { getWikiDescription } = await ctx.loadModule('wikiParser.mjs');

    const simpleDescriptions = [
        "Item ID",
        "Item Category",
        "Item Type",
        "Part of 100% Completion"
    ];

    ctx.patch(BankItemStatsMenu, 'setItem').before(async (bankItem, game) => {    
        const $bankItemDescription = document.querySelector('bank-selected-item-menu > div.row > div.col-8 > div > h5.text-bank-desc > small');
        const originalDescription = bankItem.item.description;
        const wikiDescriptionRaw = await getWikiDescription(bankItem.item.id);
        let wikiDescription = "";

        for(const key in wikiDescriptionRaw) {
            const description = wikiDescriptionRaw[key];
            if(simpleDescriptions.includes(key)) {
                if(key === "Part of 100% Completion")
                    wikiDescription += "\r\n\r\n";
                    
                wikiDescription += `${key}: ${description}\r\n`;
            }
            else {
                if(key === "Item Sources") {
                    wikiDescription += '\r\nItem Sources\r\n';
                    description.forEach((source) => {
                        wikiDescription += `${source.sourceName} ${source.sourceValue}\r\n`;
                    });
                }
                else if(key === "Item Uses") {
                    wikiDescription += '\r\nItem Uses\r\n';
                    wikiDescription += description.join(', ');
                }
            }
        }

        let patchedDescription = "";

        if(originalDescription === "No Item Description.")
            patchedDescription = wikiDescription;
        else
            patchedDescription = originalDescription + "\r\n\r\n" + wikiDescription;

        $bankItemDescription.style.whiteSpace = "break-spaces";
        $bankItemDescription.textContent = patchedDescription;

        //const patchedItem = { ...bankItem.item, description: patchedDescription }
        //const patchedBankItem = { ...bankItem, item: patchedItem }

        return [patchedBankItem, game];
    });
}