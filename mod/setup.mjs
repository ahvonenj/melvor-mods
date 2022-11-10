export async function setup(ctx) {
    const { LocalMods } = await ctx.loadModule('LocalMods.mjs');

    ctx.onInterfaceReady(ctx => {
        console.log("UI RDY");
        const localMods = new LocalMods();
    }); 
}