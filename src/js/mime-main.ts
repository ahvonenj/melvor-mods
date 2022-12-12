import { VirtualMonster } from './class/mime-virtual-monster';
import { MIMEUtils } from './class/mime-utils';
import { MIMEKeyBinder } from './class/mime-keybinds';
import { Mime } from './model/mime';

export const MIME : Mime = {
    _internal: {
        mimeConsole: null,
    },

    VirtualMonster: (monsterId) => {
        if(!monsterId) 
            throw new Error('MIME: VirtualMonster() requires monsterId parameter');
    
        return new VirtualMonster(monsterId);
    },

    fuzzyGetItem: (query, n = 10) => {
        if(!query) 
            throw new Error('MIME: fuzzyGetItem() requires query parameter');
    
        return MIMEUtils.fuzzySearch(query, game.items.allObjects, "item", n);
    },

    fuzzyGetMonster: (query, n = 10) => {
        if(!query) 
            throw new Error('MIME: fuzzyGetMonster() requires query parameter');
    
        return MIMEUtils.fuzzySearch(query, game.monsters.allObjects, "monster", n);
    },

    querySelectorAsync: async (selector: string) => {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
    
            const observer = new MutationObserver(() => {
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
    },

    querySelectorAllAsync: async (selector: string) => {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(Array.from(document.querySelectorAll(selector)));
            }
    
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    resolve(Array.from(document.querySelectorAll(selector)));
                    observer.disconnect();
                }
            });
    
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    },

    KeyBinder: new MIMEKeyBinder()
}

MIME.KeyBinder.bind('§', () => {
    if(MIME._internal.mimeConsole.open) {
        MIME._internal.mimeConsole.setOpen(false);
    } else {
        const $console = document.querySelector('#mime-console-io') as HTMLInputElement;

        if($console) {
            $console.focus();
        }     

        MIME._internal.mimeConsole.setOpen(true);
    }
}, "console");