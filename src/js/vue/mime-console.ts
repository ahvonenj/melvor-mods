// @ts-nocheck
export function MIMEConsole(props : { open: boolean }) {
    return {
        $template: '#mime-console-template',
        open: props.open,
        consoletext: '',
        setOpen(open: boolean) {
            this.open = open;
        },
        onConsoleInput: (e: KeyboardEvent) => {
            if(this.consoletext.length === 1 && this.consoletext === '§') {
                this.consoletext = '';
                return;
            }
            
            this.consoletext = e.target.value;
        }
    };
}