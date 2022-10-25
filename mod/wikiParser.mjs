const parseActions = {
    "Item ID:": {
        desc: "Item ID",
        action: (cell, html) => {
            return parseInt(cell.childNodes[1].textContent.trim(), 10);
        }
    },
    
    "Category:": {
        desc: "Item Category",
        action: (cell, html) => {
            return cell.querySelector('a').textContent.trim();
        }
    },

    "Type:": {
        desc: "Item Type",
        action: (cell, html) => {
            return cell.childNodes[1].textContent.trim();
        }
    },

    "Item Sources:": {
        desc: "Item Sources",
        action: (cell, html) => {
            const list = [];

            Array.from(
                Array.from(cell.childNodes)
                .find(n => n.nodeName === "UL")
                .childNodes
            ).filter(l => l.nodeName === "LI")
            .forEach(item => {
                if(item.childNodes && item.childNodes[0]) {
                    if(item.childNodes[0].nodeName === '#text') {
                        const sources = Array.from(item.childNodes)
                        .filter(s => s.nodeName === "SPAN")
                        .map(s => s.childNodes[0].title.trim())
                        .join(', ')
                        
                        list.push({ 
                            sourceName: item.childNodes[0].textContent.trim(),
                            sourceValue: sources
                        });
                    }
                    else if(item.childNodes[0].nodeName === "SPAN") {
                        if(item.childNodes[0].childNodes[1]) {
                            list.push({ 
                                sourceName: item.childNodes[0].childNodes[0].childNodes[0].title.trim(),
                                sourceValue: item.childNodes[0].childNodes[1].textContent.trim()
                            });
                        }
                    }
                }
            });

            return list;
        }
    },

    "Item Uses:": {
        desc: "Item Uses",
        action: (cell, html) => {
            const list = [];

            Array.from(
                Array.from(cell.childNodes)
                .find(n => n.nodeName === "UL")
                .childNodes
            ).filter(l => l.nodeName === "LI")
            .forEach(item => {
                if(item.childNodes && item.childNodes[0]) {
                    if(item.childNodes[0].nodeName === "SPAN") {
                        if(item.childNodes[0].childNodes[0]) {
                            list.push(item.childNodes[0].childNodes[0].title.trim());
                        }
                    }
                }
            });

            return list;
        }
    },

    "Part of 100% Completion": {
        desc: "Part of 100% Completion",
        action: (cell, html) => {
            return cell.childNodes[1].textContent.toLowerCase().includes("yes")
        }
    }
}

const melvowWikiBaseUrl = "https://wiki.melvoridle.com/w/";

export async function getWikiDescription(itemId) {
    const id = itemId.includes('melvorD:') ? itemId.replace("melvorD:", "") : itemId;
    const wikiReq = await fetch(`${melvowWikiBaseUrl}${id}`);
    const doc = document.implementation.createHTMLDocument().documentElement;
    doc.innerHTML = await wikiReq.text();
    const dataTable = doc.querySelector('#bodyContent > div > div > table.infobox:nth-child(2)');
    const data = { };

    if(dataTable) {
        for(const row of dataTable.rows) {
            for(const cell of row.cells) {
                const inner = cell.innerHTML;

                Object.keys(parseActions).forEach((action) => {
                    if(inner.includes(action)) {
                        const parsed = parseActions[action].action(cell, inner);
                        data[parseActions[action].desc] = parsed;
                    }
                })
            }
        }
    }

    return data;
}



