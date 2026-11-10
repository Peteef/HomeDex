export class Counter {
  count = 0;

  increment(): void {
    if (this.count < 10) {
      this.count += 1;
    }
  }
}

export const rule = {
  create(): number {
    return 1;
  },
  get size(): number {
    return 1;
  },
};

export const greet = (): string => 'hello';
