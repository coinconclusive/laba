#include <kstd/actor/io.h>
#include <kstd/pipe.h>
#include <kstd/msg.h>
#include <kstddef.h>

const ACTOR *io;
const PIPE *pout;

void msg(MSG *m) {
  switch(m->type) {
    case 0: {
      io = find(&IO_UUID);
      send(io, IO_MSG_OPENP, sizeof(IO_OPENPIPE), &(IO_OPENPIPE){ IO_PWRITE | IO_PNOBUF }, 1zu);
    } break;
    case 1: {
      pout = (const PIPE *)m->data;
      pputz(pout, "Hello, World!\n");
      send(io, IO_MSG_EXIT, sizeof(IO_EXIT), &(IO_EXIT){ 0 }, (size_t)(-1));
    } break;
  }
}

#include <kstd++/actor/io.hh>
#include <kstd++/pipe.hh>
#include <kstd++/msg.hh>
#include <cstddef>

const kstd::actor io;
const kstd::pipe pout;

void msg(kstd::message &m) {
  io = kstd::find(&kstd::io::uuid);
  pout = co_await kstd::io::openp(kstd::io::PWRITE | kstd::io::PNOBUF);
  pout.putz("Hello, World!\n");
  co_return kstd::io::exit(0);
}
