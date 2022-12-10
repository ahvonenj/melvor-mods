import { MIME } from './mime-main';
import { MIMEConsole } from './vue/mime-console';
import '../css/styles.css';

export async function setup(ctx : ModContext) {
    Object.keys(MIME).forEach(key => {
        // @ts-ignore Because we're pushing very dynamic bindings to the global api object
        ctx.api({ [key]: MIME[key] });
    });

    const mimeConsole = MIMEConsole({ open: true });

    ctx.onInterfaceReady(() => {
        ui.create(mimeConsole, document.getElementById('main-container'));
    });

    MIME._internal.mimeConsole = mimeConsole;
}