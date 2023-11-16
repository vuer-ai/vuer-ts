import {comp_list} from "./_components";
import {Node} from "../index.tsx";
import {ElementType} from "react";

type HydrateProps = {
    _key?: string;
    tag: string;
    children: Node[];
    className: string;
    [key: string]: any;
};

export function Hydrate(
    {
        _key,
        tag: Tag = "div",
        children,
        className,
        ...rest
    }: HydrateProps
): JSX.Element {
    const Component = (comp_list[Tag] || Tag) as ElementType;
    // const {sendMsg} = useContext<SocketContextType>(SocketContext);

    const hydratedChildren = (children || []).map((child: Node) => {
        if (typeof child === "string") return child;
        const {key, ..._child} = child;
        // @ts-ignore: not sure how to fix this;
        return <Hydrate key={key} _key={key} {..._child}/>;
    });

    if (typeof Component === "string") {
        return (
            // @ts-ignore: not sure how to fix this;
            <Component key={_key} className={className} {...rest}>
                {hydratedChildren}
            </Component>
        );
    } else {
        return (
            <Component
                key={_key}
                _key={_key}
                className={className}
                // sendMsg={sendMsg}
                {...rest}
            >
                {hydratedChildren}
            </Component>
        );
    }
}
