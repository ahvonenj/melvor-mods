import clippyImg from "../img/clippy.png";



export class Clippy {
    clippyUrl: string;

    constructor(ctx : ModContext) {
        this.clippyUrl = ctx.getResourceUrl(clippyImg);
        const clippy = document.createElement("img");
        clippy.src = this.clippyUrl;
        clippy.style.position = "absolute";
        clippy.style.bottom = "0";
        clippy.style.right = "0";
        clippy.style.zIndex = "100";
        document.body.appendChild(clippy);
    }
}