import { HighlightStyle, syntaxHighlighting, TagStyle } from '@codemirror/language';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export type Color = string;

export interface IThemeInfo {
  variant: 'light' | 'dark',
  settings: {
    background: Color,
    foreground: Color,
    caret: Color,
    selection: Color,
    lineHighlight: Color,

    htmlBackground: Color,

    uiBackground: Color,
    uiForeground: Color,
    uiBorder: Color,
    uiBorderActive: Color,

    iconFileBackground: Color,
    iconFileForeground: Color,
    itemFileBackground: Color,

    iconFolderBackground: Color,
    iconFolderForeground: Color,
    itemFolderBackground: Color,

    itemForeground: Color,
  },
  styles: readonly TagStyle[]
}

export interface Theme {
  info: IThemeInfo,
  extension: Extension
}

export const themeCssMap = {
  uiBackground: 'ui-bg',
  uiForeground: 'ui-fg',
  uiBorder: 'ui-br',
  uiBorderActive: 'ui-br-a',

  iconFileBackground: 'icon-file-bg',
  iconFileForeground: 'icon-file-fg',
  itemFileBackground: 'item-file-bg',

  iconFolderBackground: 'icon-folder-bg',
  iconFolderForeground: 'icon-folder-fg',
  itemFolderBackground: 'item-folder-bg',

  itemForeground: 'item-fg',
};

export default function({ variant, settings, styles }: IThemeInfo): Theme {
  const theme = EditorView.theme({
      '&': {
          backgroundColor: settings.background,
          color: settings.foreground,
      },
      '.cm-content': {
          caretColor: settings.caret,
      },
      '.cm-cursor, .cm-dropCursor': {
          borderLeftColor: settings.caret,
      },
      '&.cm-focused .cm-selectionBackgroundm .cm-selectionBackground, .cm-content ::selection': {
          backgroundColor: settings.selection,
      },
      '.cm-activeLine': {
          backgroundColor: settings.lineHighlight,
      },
      '.cm-gutters': {
          backgroundColor: settings.uiBackground,
          color: settings.uiForeground,
      },
      '.cm-activeLineGutter': {
          backgroundColor: settings.lineHighlight,
      },
  }, {
      dark: variant === 'dark',
  });

  const highlightStyle = HighlightStyle.define(styles);
  const extension = [theme, syntaxHighlighting(highlightStyle)];
  return { info: { variant, settings, styles }, extension };
};
