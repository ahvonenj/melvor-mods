export function MyComponent(props: { open: boolean }) {
    return {
        $template: '#my-component-template',
        open: props.open,
        setOpen(open : boolean) {
            this.open = open;
        }
    };
}