import { MIME } from './mime-main.mjs';
import { MIMEConsole } from './vue/mime-console.mjs';
import '../css/styles.css';

export async function setup(ctx) {
    Object.keys(MIME).forEach(key => {
        ctx.api({ [key]: MIME[key] });
    });

    const mimeConsole = MIMEConsole({ open: true });

    ctx.onInterfaceReady(() => {
        ui.create(mimeConsole, document.getElementById('main-container'));
    });

    MIME._internal.mimeConsole = mimeConsole;
}