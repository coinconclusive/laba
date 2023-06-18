
export type FileSystemFolder
  = { type: 'folder', name: string, children: FileSystemNode[] };

export type FileSystemFile
  = { type: 'file', name: string, content?: string };

export type FileSystemNode = FileSystemFile | FileSystemFolder;

export const createFolderNode = (name: string, children: FileSystemNode[]) =>
  <FileSystemFolder>{ type: 'folder', name, children };

export const createFileNode = (name: string, content?: string) =>
  <FileSystemFile>{ type: 'file', name, content: content };

export interface FileSystem {
  root: FileSystemFolder,
  realPath?: string
};

const fileContent: { [path: string]: string } = {
  '/src/kent.c': `
#include <os/k.h>
#include <os/kgfx.h>

#define forever for (;;)

void kern_entry() {
  kgfx_init();
  kgfx_tty_t tty = {0};
  kgfx_print(&tty, "Hello, World!\\n");

  forever asm volatile ("hlt");
}`.trim() + '\n',

  '/src/kgfx.c': `
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
}`.trim() + '\n'
};


export const filesystem: FileSystem = {
  root: createFolderNode('', [
    createFolderNode('build', [
      createFileNode('kent.c.o'),
      createFileNode('kgfx.c.o'),
      createFileNode('image.iso'),
    ]),
    createFolderNode('include', [
      createFolderNode('os', [
        createFileNode('k.h'),
        createFileNode('kgfx.h'),
      ]),
    ]),
    createFolderNode('src', [
      createFileNode('kent.c', fileContent['/src/kent.c']),
      createFileNode('kgfx.c', fileContent['/src/kgfx.c']),
    ]),
    createFileNode('compile_commands.json'),
    createFileNode('build.ninja'),
  ])
};

export const walk = <T>(
  root: FileSystemNode,
  cb: (f: FileSystemNode, path: string, children?: T[]) => T,
  path: string = ''
): T => root.type == 'folder'
  ? cb(root, path, root.children.map(x => walk(x, cb, path + '/' + x.name)))
  : cb(root, path);
