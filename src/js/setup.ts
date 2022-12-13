import { Clippy } from './clippy';
import '../css/styles.css';

export async function setup(ctx : ModContext) {
    ctx.onInterfaceReady(() => {
        const clippy = new Clippy(ctx);
    });
}