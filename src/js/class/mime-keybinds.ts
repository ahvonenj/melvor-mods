type Bind = {
    key: any;
    action: any;
    name: any;
}

export class MIMEKeyBinder {
    binds: Bind[];
    pressedKeys: Set<string>;

    constructor() {
        this.binds = [];
        this.pressedKeys = new Set();

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    bind(key : string, action: () => void, name: string) {
        if(!key || !action || !name) 
            throw new Error('MIME: bind() requires key, action, and name parameters');

        const bind = {
            key: key,
            action: action,
            name: name
        };

        this.binds.push(bind);
    }

    unbind(key : string, name : string) {
        if(!key || !name) 
            throw new Error('MIME: unbind() requires key and name parameters');
            
        const index = this.binds.findIndex(bind => bind.key === key && bind.name === name);

        if (index !== -1) {
            this.binds.splice(index, 1);
        }
    }

    handleKeyDown(event: any) {
        const binds = this.binds.filter(bind => bind.key === event.key);

        if (binds.length > 0 && !this.pressedKeys.has(event.key)) {
            binds.forEach(bind => bind.action());
            this.pressedKeys.add(event.key);
        }
    }

    handleKeyUp(event: any) {
        this.pressedKeys.delete(event.key);
    }

    listBindings() {
        this.binds.forEach(bind => {
            console.log(`Key: ${bind.key}, Action: ${bind.action}, Name: ${bind.name}`);
        });
    }
}