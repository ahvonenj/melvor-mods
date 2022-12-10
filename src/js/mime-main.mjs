import { VirtualMonster } from './class/mime-virtual-monster.mjs';
import { MIMEUtils } from './class/mime-utils.mjs';
import { KeyBinder } from './class/mime-keybinds.mjs';

export const MIME = {
    _internal: {
        isConsoleOpen: true
    }
}

MIME.VirtualMonster = (monsterId) => {
    if(!monsterId) 
        throw new Error('MIME: VirtualMonster() requires monsterId parameter');

    return new VirtualMonster(monsterId);
}

MIME.fuzzyGetItem = (query, n = 10) => {
    if(!query) 
        throw new Error('MIME: fuzzyGetItem() requires query parameter');

    return MIMEUtils.fuzzySearch(query, game.items.allObjects, "item", n);
}

MIME.fuzzyGetMonster = (query, n = 10) => {
    if(!query) 
        throw new Error('MIME: fuzzyGetMonster() requires query parameter');

    return MIMEUtils.fuzzySearch(query, game.monsters.allObjects, "monster", n);
}

MIME.KeyBinder = new KeyBinder();

MIME.KeyBinder.bind('§', () => {
    if(MIME._internal.isConsoleOpen) {
        document.getElementById('mime-console').style.display = 'none';
        MIME._internal.isConsoleOpen = false;
    } else {
        document.getElementById('mime-console').style.display = 'block';
        MIME._internal.isConsoleOpen = true;
    }
}, "console");