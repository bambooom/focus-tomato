import Metronome from './Metronome';
import { Noise, whiteNoise, pinkNoise, brownNoise } from './Noise';

async function createTimerSound(timerSound) {
  if (!timerSound) {
    return null;
  }
  //=== 1.
  // focus.timerSound = {
  //   procedural: value
  // };
  //=== 2.
  // focus.timerSound.metronome.files = value;
  //=== 3.
  // focus.timerSound = {
  //   metronome: {
  //     files: value,
  //     bpm: 60
  //   }
  // }
  if (timerSound.metronome) {
    const { files, bpm } = timerSound.metronome;
    const period = (60 / bpm) * 1000;
    return await Metronome.create(files, period);
  }

  const node = {
    'white-noise': whiteNoise,
    'pink-noise': pinkNoise,
    'brown-noise': brownNoise
  }[timerSound.procedural];

  if (!node) {
    throw new Error('Invalid procedural timer sound.');
  }

  return await Noise.create(node);
}

export default createTimerSound;
