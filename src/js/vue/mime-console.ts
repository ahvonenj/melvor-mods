export function MIMEConsole(props : { open: boolean }) {
    return {
        $template: '#mime-console-template',
        open: props.open,
        setOpen(open: boolean) {
            this.open = open;
        }
    };
}