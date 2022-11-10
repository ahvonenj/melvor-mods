export class LocalMods {

    __TAB_HTML = `
    <li class="nav-main-item" id="local-mod-tab">
        <a class="nav-main-link">
            <i class="fas fa-cubes fa-lg text-success mr-2"></i>
            <span>My Local Mods</span>
        </a>
    </li>
    `;
    __PANEL_HTML = `
    <div class="tab-pane h-100" id="local-mod-panel" role="tabpanel">
        <p>Local Mods</p>
    </div>
    `;

    $modBrowserPanelWrapper = null;
    $modBrowserTabWrapper = null;

    observer = null;
    observerConfig = { attributes: true, childList: true, subtree: true };
    swalModalHacked = false;

    constructor() {

        console.log('LocalMods: Attaching MutationObserver');

        this.observer = new MutationObserver(this.onBodyChanged.bind(this));
        this.observer.observe(document.body, this.observerConfig);
    }

    onBodyChanged(mutationList, observer) {
        for (const mutation of mutationList) {
            if (mutation.type === 'childList' && mutation.target.nodeName === "BODY") {
                if(mutation.addedNodes.length > 0) {
                    if(mutation.addedNodes[0] && mutation.addedNodes[0].classList.contains("swal2-container")) {
                        this.onSwalModal();
                    }
                }
            }
        }
    }

    onSwalModal() {
        console.log('SWAL2 OPEN');

        this.$modBrowserPanelWrapper = document.querySelector('#swal2-html-container > div > div > div');
        this.$modBrowserTabWrapper = document.querySelector('#swal2-html-container > div > div > ul');

        if(this.swalModalHacked) return;

        this.$modBrowserPanelWrapper.insertAdjacentHTML("beforeend", this.__PANEL_HTML);
        this.$modBrowserTabWrapper.insertAdjacentHTML("beforeend", this.__TAB_HTML);

        const tab = document.querySelector('#local-mod-tab');
        const panel = document.querySelector('#local-mod-panel');

        this.swalModalHacked = true;
        this.observer.disconnect();
    }
}