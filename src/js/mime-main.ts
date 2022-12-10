import { VirtualMonster } from './class/mime-virtual-monster';
import { MIMEUtils } from './class/mime-utils';
import { MIMEKeyBinder } from './class/mime-keybinds';
import { Mime } from './model/mime';

export const MIME : Mime = {
    _internal: {
        mimeConsole: null,
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

MIME.KeyBinder = new MIMEKeyBinder();

MIME.KeyBinder.bind('§', () => {
    if(MIME._internal.mimeConsole.open) {
        MIME._internal.mimeConsole.setOpen(false);
    } else {
        MIME._internal.mimeConsole.setOpen(true);
    }
}, "console");