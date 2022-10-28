export async function setup(ctx) {
    const { myModule } = await ctx.loadModule('myModule.mjs');

    ctx.patch(Class, 'FunctionName').before(() => {    
        
    });
}