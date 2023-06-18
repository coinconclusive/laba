import { indentWithTab } from "@codemirror/commands";
import { cpp as cppLang } from "@codemirror/lang-cpp";
import { LanguageSupport } from "@codemirror/language";
import { Compartment, EditorState, Extension, StateEffect } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { basicSetup, EditorView } from "codemirror";
import { Theme, themeCssMap } from "./theme";
import { anaTheme } from "./themes/ana";
import { rosePineTheme } from "./themes/rose-pine";

class State<V, T> {
  private cbs: ((v: V, old: V) => void)[] = [];
  constructor(private value: V, private updater: (v: V, t: T) => V) {}

  current() { return this.value; }
  effect(cb: (v: V, old: V) => void) { this.cbs.push(cb); }
  update(t: T) {
    const old = this.value;
    this.value = this.updater(this.value, t);
    this.cbs.forEach(cb => cb(this.value, old));
  }
}

class SimpleState<V> extends State<V, V> {
  constructor(initial: V) { super(initial, (_, t) => t); }
}

class ArrayState<E> extends State<E[], ['push', E] | ['pop']> {
  constructor(initial: E[]) {
    super(initial, (v, t) => {
      if (t[0] === 'push') v.push(t[1]);
      if (t[0] === 'pop') v.pop();
      return v;
    })
  }

  push(e: E) { this.update(['push', e]); }
  pop() { this.update(['pop']); }
  get(index: number) { return this.current()[index]; }
}

const effectNow = <V, T>(state: State<V, T>, cb: (v: V, old: V) => void, old?: V) => {
  cb(state.current(), old);
  state.effect(cb);
};

const Q = <T extends HTMLElement>(q: string) => document.querySelector<T>(q);

function H(f?: (e: HTMLDivElement) => void): HTMLDivElement;
function H<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  f?: (e: HTMLElementTagNameMap[K]) => void
): HTMLElementTagNameMap[K];

function H<K extends keyof HTMLElementTagNameMap>(
  a?: K | ((e: HTMLDivElement) => void),
  f?: (e: HTMLElementTagNameMap[K]) => void
) {
  if (!a) return document.createElement('div');
  if (typeof a === 'function') { f = a as typeof f; a = 'div' as K; }
  const e = document.createElement<K>(a);
  if (f) f(e);
  return e;
}

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

const sidebarItemFolder = (name: string, children?: SidebarItem[], collapsed?: boolean) =>
  <SidebarItem>({
    name: new SimpleState(name),
    children: new SimpleState(children),
    type: new SimpleState('folder'),
    collapsed: new SimpleState(!!collapsed || !children?.length)
  })

const sidebarItemFile = (name: string, lang: string = 'text') =>
  <SidebarItem>({ name: new SimpleState(name), type: new SimpleState('file') })

const sidebarItems: SidebarItem[] = [
  sidebarItemFolder('build', [
    sidebarItemFile('kent.c.o'),
    sidebarItemFile('kgfx.c.o'),
    sidebarItemFile('image.iso'),
  ]),
  sidebarItemFolder('include', [
    sidebarItemFolder('os', [
      sidebarItemFile('k.h'),
      sidebarItemFile('kgfx.h'),
    ]),
  ], true),
  sidebarItemFolder('src', [
    sidebarItemFile('kent.c'),
    sidebarItemFile('kgfx.c'),
  ]),
  sidebarItemFile('compile_commands.json'),
  sidebarItemFile('build.ninja'),
];

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

interface File {
  state: SimpleState<EditorState>,
  settings: { 
    language: Setting<LanguageSupport>
  }
}

const createFile = (doc: string) => {
  const settings = { language: new Setting(cppLang(), x => x) };

  const file: File = {
    settings,
    state: new SimpleState(EditorState.create({
      doc: doc.trimStart(),
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
      file.state.update(file.state.current().update({ effects }).state);
    });
  });

  return file;
}
const files: { [path: string]: File } = {};
function createFiles() {
  files['/src/kent.c'] = createFile(`
#include <os/k.h>
#include <os/kgfx.h>

#define forever for (;;)

void kern_entry() {
  kgfx_init();
  kgfx_tty_t tty = {0};
  kgfx_print(&tty, "Hello, World!\\n");

  forever asm volatile ("hlt");
}\n`);

  files['/src/kgfx.c'] = createFile(`
#include <os/k.h>

void kgfx_init() {}
void kgfx_write(kgfx_tty_t *tty, char c) {
  switch (c) {
    case '\\n': tty->x = 0; ++tty->y; break;
    default:
      vga_set(tty->x++, tty->y, tty->col, c);
      break;
  }
}
void kgfx_print(kgfx_tty_t *tty, const char *msg) {
  while (*msg) kgfx_write(tty, *(msg++));
}\n`);
}

window.onload = () => {
  createFiles();

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
  sidebarItems
    .map(x => createSidebarItem(x))
    .forEach(e => sidebar.appendChild(e));
  
  const view = new EditorView({
    state: files[openFilePath.current()].state.current(),
    parent: Q("#editor")
  });

  Object.entries(files).forEach(([path, f]) => {
    f.state.effect(v => {
      if (path === openFilePath.current())
        view.setState(v);
    });
  });

  openFilePath.effect((p, old) => {
    files[old].state.update(view.state);
    if (!files[p]) files[p] = createFile('');
    view.setState(files[p].state.current());
  });

  setTimeout(() => {
    globalSettings.theme.state.update(rosePineTheme);
  }, 3000);
};
