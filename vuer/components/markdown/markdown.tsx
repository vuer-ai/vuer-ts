import {
  CSSProperties, PropsWithChildren, ReactElement, useMemo,
} from 'react';
// import ReactMarkdown from "react-markdown";
import rehypeRaw from 'rehype-raw';
import { Remark } from 'react-remark';
import { RemarkRehypeOptions } from 'react-markdown/lib';
import { VuerProps } from '../../interfaces.tsx';
// @ts-ignore: not sure why this errors

type MarkdownProps = VuerProps<{
  children: string | string[];
  style?: CSSProperties;
}>;

export function Markdown(
  {
    _key: key, children, style, ...props
  }: MarkdownProps,
) {
  const { markdown, components } = useMemo(
    () => ({
      markdown: typeof children === 'string' ? children : children.join(' '),
      components: {
        p: ({ style: _style, ..._props }: PropsWithChildren<{ style: CSSProperties }>): ReactElement => <p style={{ ...style, ..._style } as CSSProperties} {..._props} />,
      },
    }),
    [children, style],
  );
  return (
    <Remark
      // @ts-ignore: not sure why this errors
      rehypePlugins={[rehypeRaw]}
      rehypeReactOptions={components as RemarkRehypeOptions}
      remarkToRehypeOptions={{ allowDangerousHtml: true }}
      {...props}
    >
      {markdown}
    </Remark>
  );
}
