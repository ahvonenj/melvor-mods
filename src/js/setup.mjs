import { MIME } from './mime-main.mjs';
import { MIMEConsole } from './vue/mime-console.mjs';
import '../css/styles.css';

export async function setup(ctx) {
    Object.keys(MIME).forEach(key => {
        ctx.api({ [key]: MIME[key] });
    });

    ctx.onInterfaceReady(() => {
        ui.create(MIMEConsole(), document.getElementById('main-container'));
    });
}