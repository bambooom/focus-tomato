/* eslint-disable @typescript-eslint/no-explicit-any */
export default class Mutex {
  queue: ((value?: unknown) => void)[] = [];
  pending: boolean;
  constructor() {
    this.queue = [];
    this.pending = false;
  }

  async exclusive(fn: () => Promise<any>) {
    let release: () => void;
    try {
      release = await this.acquire();
      return await fn();
    } finally {
      release();
    }
  }

  async acquire() {
    const release = () => {
      this.pending = this.queue.length > 0;
      const next = this.queue.shift();
      next && next();
    };

    if (this.pending) {
      await new Promise(resolve => this.queue.push(resolve));
      return release;
    } else {
      this.pending = true;
      return release;
    }
  }
}
