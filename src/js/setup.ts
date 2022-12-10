import { MyMod } from './mymod.js';
import { MyComponent } from './vue/my-component.js';
import '../css/styles.css';

export async function setup(ctx : ModContext) {
    ctx.onInterfaceReady(() => {
        ui.create(MyComponent({ open: false }), document.getElementById('main-container'));
    });
}