export function MIMEConsole(props) {
    return {
        $template: '#mime-console-template',
        open: props.open,
        setOpen(open) {
            this.open = open;
        }
    };
}