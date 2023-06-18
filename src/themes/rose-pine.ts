import createTheme from "../theme";
import { tags as t, Tag } from '@lezer/highlight';

// Rosé Pine Dawn Theme.
// https://rosepinetheme.com/

export const rosePineTheme = createTheme({
  variant: 'light',
  settings: {
    background: '#faf4ed',
    foreground: '#575279',
    caret: '#575279',
    selection: '#6e6a8614',
    lineHighlight: '#6e6a860d',

    htmlBackground: '#faf4ed',
    itemForeground: '#575279',
    
    uiBackground: '#faf4ed',
    uiForeground: '#575279',
    uiBorder: '#ddd',
    uiBorderActive: '#575279',
    
    iconFileBackground: '#d7827e',
    iconFileForeground: '#b36a66',
    itemFileBackground: '#b36a6625',
    
    iconFolderBackground: '#73b2bd',
    iconFolderForeground: '#56949f',
    itemFolderBackground: '#56949f25',
  },
  styles: [
    {
      tag: t.comment,
      color: '#9893a5',
    },
    {
      tag: [t.bool, t.null],
      color: '#286983',
    },
    {
      tag: t.number,
      color: '#d7827e',
    },
    {
      tag: t.className,
      color: '#d7827e',
    },
    {
      tag: [t.angleBracket, t.tagName, t.typeName],
      color: '#56949f',
    },
    {
      tag: t.attributeName,
      color: '#907aa9',
    },
    {
      tag: t.punctuation,
      color: '#797593',
    },
    {
      tag: [t.keyword, t.modifier],
      color: '#286983',
    },
    {
      tag: [t.string, t.regexp],
      color: '#ea9d34',
    },
    {
      tag: t.variableName,
      color: '#d7827e',
    },
  ],
});
