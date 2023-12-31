import Chrome from './Chrome';
import Mutex from './Mutex';

function loadAudio(context: AudioContext, file: string): Promise<AudioBuffer> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const content = await Chrome.files.readBinary(file);
    context.decodeAudioData(content, buffer => resolve(buffer), error => reject(error));
  });
}

function roundUp(value, interval) {
  return interval * Math.ceil(value / interval);
}

class Metronome {
  buffers: AudioBuffer[];
  period: number;
  context: AudioContext;
  interval: NodeJS.Timeout | null;
  scheduledTime: number;
  soundIndex: number;
  contextLock: Mutex;
  constructor(context: AudioContext, buffers: AudioBuffer[], period: number) {
    this.buffers = buffers;
    this.period = period;
    this.context = context;
    this.interval = null;

    this.scheduledTime = 0;
    this.soundIndex = 0;

    this.contextLock = new Mutex();
  }

  static async create(soundFiles: string[], period: number) {
    const context = new AudioContext();
    await context.suspend();

    const buffers = [];
    for (const file of soundFiles) {
      const buffer = await loadAudio(context, file);
      buffers.push(buffer);
    }

    return new Metronome(context, buffers, period);
  }

  async start() {
    await this.contextLock.exclusive(async () => {
      if (!this.context || this.interval) {
        return;
      }

      const schedulePeriod = 15 * 1000;
      const scheduleSize = Math.max(2, 2 * (schedulePeriod / this.period));

      const schedule = () => {
        const frontierTime = roundUp(this.context.currentTime * 1000, this.period) + this.period * scheduleSize;
        while (this.scheduledTime < frontierTime) {
          this.scheduledTime += this.period;
          if (this.scheduledTime <= this.context.currentTime * 1000) {
            continue;
          }

          const source = this.context.createBufferSource();
          source.buffer = this.buffers[this.soundIndex];
          this.soundIndex = (this.soundIndex + 1) % this.buffers.length;

          source.connect(this.context.destination);
          source.start(this.scheduledTime / 1000);
        }
      };

      this.interval = setInterval(() => schedule(), schedulePeriod);
      schedule();

      await this.context.resume();
    });
  }

  async stop() {
    await this.contextLock.exclusive(async () => {
      await this._stop();
    });
  }

  async close() {
    await this.contextLock.exclusive(async () => {
      if (!this.context) {
        return;
      }

      await this._stop();
      await this.context.close();
      this.context = null;
    });
  }

  // Assumes contextLock is held.
  async _stop() {
    if (!this.context || !this.interval) {
      return;
    }

    clearInterval(this.interval);
    this.interval = null;
    await this.context.suspend();
  }
}

export default Metronome;
