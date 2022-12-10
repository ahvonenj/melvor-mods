import { MIMEKeyBinder } from "../class/mime-keybinds";
import { VirtualMonster } from "../class/mime-virtual-monster";

export interface Mime {
    _internal: {
        mimeConsole: any;
    },
    VirtualMonster?: (monsterId: string) => VirtualMonster,
    fuzzyGetItem?: (query: string, n?: number) => any[],
    fuzzyGetMonster?: (query: string, n?: number) => any[],
    KeyBinder?: MIMEKeyBinder,
}