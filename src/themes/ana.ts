import createTheme from '../theme';
import { tags as t, Tag } from '@lezer/highlight';
import { TagStyle } from '@codemirror/language';

export const colors = {
  purple: '#8034be',
  green: '#508d44',
  pink: '#c36aa7',
  orange: '#9c5b0c',
  turquoise: '#189486',
  blue: '#3e54cf',
  red: '#823d37',
  gray: '#aaa',
  black: '#000'
};

const C = colors;

const L = (
  tag: Tag | readonly Tag[],
  color: string,
  o: { [key: keyof TagStyle]: any } = {}
) => ({ tag, color, ...o });

export const anaTheme = createTheme({
  variant: 'light',
  settings: {
    background: '#fff',
    foreground: '#000',
    caret: '#000',
    selection: '#3232ea44',
    lineHighlight: '#fafafa',

    htmlBackground: '#fff',
    itemForeground: '#000',
    
    uiBackground: '#f5f5f5',
    uiForeground: '#000',
    uiBorder: '#ddd',
    uiBorderActive: '#212121',
    
    iconFileBackground: '#e4d5ec',
    iconFileForeground: '#cad',
    itemFileBackground: '#ccaadd44',
    
    iconFolderBackground: '#d5e7ec',
    iconFolderForeground: '#acd',
    itemFolderBackground: '#aaccdd44',
  },
  styles: [
    L(t.keyword, C.purple),
    L([t.name, t.deleted, t.character, t.propertyName, t.macroName], C.black),
    L([t.function(t.variableName), t.labelName], C.blue),
    L([t.color, t.constant(t.name), t.standard(t.name)], C.purple),
    L([t.definition(t.name), t.separator], C.black),
    L([t.typeName, t.className], C.orange),
    L([t.changed, t.annotation, t.modifier, t.self, t.namespace], C.blue),
    L([t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
      C.turquoise),
    L([t.number], C.red),
    L([t.meta, t.comment], C.gray),
    L([t.atom, t.bool, t.special(t.variableName)], C.gray ),
    L([t.processingInstruction, t.string, t.inserted], C.green),
    L(t.strong, undefined, { fontWeight: "bold" }),
    L(t.emphasis, undefined, { fontStyle: "italic" }),
    L(t.strikethrough, undefined, { textDecoration: "line-through" }),
    L(t.link, C.gray, { textDecoration: "underline" }),
    L(t.heading, undefined, { fontWeight: "bold"  }),
    L(t.invalid, '#ea2312', { textDecoration: "line-through" }),
  ]
});
