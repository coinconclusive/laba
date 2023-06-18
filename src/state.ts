export default class State<V, T> {
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

export class SimpleState<V> extends State<V, V> {
  constructor(initial: V) { super(initial, (_, t) => t); }
}

export class ArrayState<E> extends State<E[], ['push', E] | ['pop']> {
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

export const effectNow = <V, T>(state: State<V, T>, cb: (v: V, old: V) => void, old?: V) => {
  cb(state.current(), old);
  state.effect(cb);
};
