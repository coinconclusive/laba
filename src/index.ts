import { indentWithTab } from "@codemirror/commands";
import { cpp as cppLang } from "@codemirror/lang-cpp";
import { LanguageSupport } from "@codemirror/language";
import { Compartment, EditorState, Extension, StateEffect } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { basicSetup, EditorView } from "codemirror";
import { filesystem, FileSystemNode, walk } from "./file";
import { H, Q } from "./html";
import { ArrayState, SimpleState, effectNow } from "./state";
import { Theme, themeCssMap } from "./theme";
import { anaTheme } from "./themes/ana";
import { rosePineTheme } from "./themes/rose-pine";

interface SidebarItem {
  name: SimpleState<string>,
  type: SimpleState<'file' | 'folder'>,
  children?: ArrayState<SidebarItem>,
  collapsed?: SimpleState<boolean>
}

const createSidebarItem = (item: SidebarItem, parentPath: string = '') => H(e => {
  const path = parentPath + '/' + item.name.current();

  e.appendChild(H('span', e => {
    effectNow(item.name, v => e.textContent = v);
    effectNow(item.type, (v, old) => old
      ? e.classList.replace(old, v)
      : e.classList.add(v));
  }));

  e.classList.add('sidebar-item');

  if (item.collapsed) {
    effectNow(item.collapsed, (v, old) =>
      old == v ? null : v
      ? e.classList.add('collapsed')
      : e.classList.remove('collapsed')
    );
  }
  
  if (item.children) {
    e.appendChild(H(e => {
      effectNow(item.children, cs => {
        while (e.firstChild) e.removeChild(e.lastChild);
        cs.forEach(x => e.appendChild(createSidebarItem(x, path)));
      });
    }));
  }

  effectNow(openFilePath, (v, old) =>
    !v.startsWith(path) && !old?.startsWith(path) ? null :
      v.startsWith(path)
      ? e.classList.add('active')
      : e.classList.remove('active')
  );

  e.addEventListener('click', ev => {
    if (item.type.current() === 'folder') {
      item.collapsed.update(!item.collapsed.current());
    } else if (item.type.current() === 'file') {
      openFilePath.update(parentPath + '/' + item.name.current());
    }
    ev.stopPropagation();
  });
});

class Setting<V> {
  state: SimpleState<V>;
  compartment: Compartment;

  constructor(initial: V, public extension: (v: V) => Extension) {
    this.state = new SimpleState(initial);
    this.compartment = new Compartment;
  }

  instance() {
    return this.compartment.of(
      this.extension(this.state.current())
    );
  }

  effect(cb: (t: StateEffect<unknown>) => void, checkSame: boolean = false) {
    this.state.effect((v, old) => {
      if (checkSame && v === old) return;
      cb(this.compartment.reconfigure(this.extension(v)));
    });
  }
}

const globalSettings = {
  theme: new Setting<Theme>(anaTheme, x => x)
}

const openFilePath = new SimpleState<string>('/src/kent.c');

interface Buffer {
  state: SimpleState<EditorState>,
  settings: { 
    language: Setting<LanguageSupport>
  }
}

const createBuffer = (doc: string) => {
  const settings = { language: new Setting(cppLang(), x => x) };

  const buffer: Buffer = {
    settings,
    state: new SimpleState(EditorState.create({
      doc: doc?.trimStart(),
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        [ ...Object.values(settings),
          ...Object.values(globalSettings)
        ].map(s => s.instance())
      ]
    }))
  };

  [ ...Object.values(settings),
    ...Object.values(globalSettings)
  ].forEach(setting => {
    setting.effect(effects => {
      buffer.state.update(buffer.state.current().update({ effects }).state);
    });
  });

  return buffer;
}

const buffers: { [path: string]: Buffer } = {};

const sidebarItemFolder = (name: string, children?: SidebarItem[], collapsed?: boolean) =>
  <SidebarItem>({
    name: new SimpleState(name),
    children: new SimpleState(children),
    type: new SimpleState('folder'),
    collapsed: new SimpleState(!!collapsed || !children?.length)
  })

const sidebarItemFile = (name: string, lang: string = 'text') =>
  <SidebarItem>({ name: new SimpleState(name), type: new SimpleState('file') });

function createBuffers(): SidebarItem[] {
  const root = walk<SidebarItem>(filesystem.root, (node, path, children) => {
    if (node.type === 'file') {
      buffers[path] = createBuffer(node.content);
      return sidebarItemFile(node.name);
    }
    return sidebarItemFolder(node.name, children, true);
  });

  return root.children.current();
}

window.onload = () => {
  effectNow(globalSettings.theme.state, v => {
    Object.entries(themeCssMap).forEach(([name, cssName]) => {
      document.body.style.setProperty(
        '--' + cssName,
        v.info.settings[name as keyof typeof v.info.settings]
      );
      document.documentElement.style.backgroundColor = v.info.settings.htmlBackground;
    });
  });

  const sidebar = Q("#sidebar");
  createBuffers()
    .map(x => createSidebarItem(x))
    .forEach(e => sidebar.appendChild(e));
  
  const view = new EditorView({
    state: buffers[openFilePath.current()].state.current(),
    parent: Q("#editor")
  });

  Object.entries(buffers).forEach(([path, f]) => {
    f.state.effect(v => {
      if (path === openFilePath.current())
        view.setState(v);
    });
  });

  openFilePath.effect((p, old) => {
    buffers[old].state.update(view.state);
    if (!buffers[p]) buffers[p] = createBuffer('');
    view.setState(buffers[p].state.current());
  });

  setTimeout(() => {
    globalSettings.theme.state.update(rosePineTheme);
  }, 3000);
};
