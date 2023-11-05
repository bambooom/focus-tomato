import Chrome from './Chrome';

function createNotificationSounds() {
  const sounds = [
    { name: 'Tone', file: 'f62b45bc.mp3' },
    { name: 'Digital Watch', file: 'be75f155.mp3' },
    { name: 'Analog Alarm Clock', file: '0f034826.mp3' },
    { name: 'Digital Alarm Clock', file: 'fee369b7.mp3' },
    { name: 'Electronic Chime', file: '28d6b5be.mp3' },
    { name: 'Gong 1', file: '8bce59b5.mp3' },
    { name: 'Gong 2', file: '85cab25d.mp3' },
    { name: 'Computer Magic', file: '5cf807ce.mp3' },
    { name: 'Fire Pager', file: 'b38e515f.mp3' },
    { name: 'Glass Ping', file: '2ed9509e.mp3' },
    { name: 'Music Box', file: 'ebe7deb8.mp3' },
    { name: 'Pin Drop', file: '2e13802a.mp3' },
    { name: 'Robot Blip 1', file: 'bd50add0.mp3' },
    { name: 'Robot Blip 1', file: '36e93c27.mp3' },
    { name: 'Ship Bell', file: '9404f598.mp3' },
    { name: 'Train Horn', file: '6a215611.mp3' },
    { name: 'Bike Horn', file: '72312dd3.mp3' },
    { name: 'Bell Ring', file: 'b10d75f2.mp3' },
    { name: 'Reception Bell', file: '54b867f9.mp3' },
    { name: 'Toaster Oven', file: 'a258e906.mp3' },
    { name: 'Battle Horn', file: '88736c22.mp3' },
    { name: 'Ding', file: '1a5066bd.mp3' },
    { name: 'Dong', file: '5e122cee.mp3' },
    { name: 'Ding Dong', file: '92ff2a8a.mp3' },
    { name: 'Airplane', file: '72cb1b7f.mp3' }
  ];

  for (const sound of sounds) {
    sound.file = `/audio/${sound.file}`;
  }

  return sounds;
}

function createTimerSounds() {
  const sounds = [
    { name: 'Stopwatch', files: ['4cf03078.mp3', 'edab7b0d.mp3'] },
    { name: 'Wristwatch', files: ['8dc834f8.mp3', '831a5549.mp3'] },
    { name: 'Clock', files: ['af607ff1.mp3', 'fd23aaf3.mp3'] },
    { name: 'Wall Clock', files: ['6103cd58.mp3', 'cad167ea.mp3'] },
    { name: 'Desk Clock', files: ['6a981bfc.mp3', 'fd64de98.mp3'] },
    { name: 'Wind-up Clock', files: ['bc4e3db2.mp3', 'f9efd11b.mp3'] },
    { name: 'Antique Clock', files: ['875326f9.mp3', 'cba5f173.mp3'] },
    { name: 'Small Clock', files: ['89dafd3e.mp3', '0a0ec499.mp3'] },
    { name: 'Large Clock', files: ['2122d2a4.mp3', 'a273ba0c.mp3'] },
    { name: 'Wood Block', files: ['ad6eac9e.mp3'] },
    { name: 'Metronome', files: ['bced7c21.mp3', '9bd67f7e.mp3'] },
    { name: 'Pulse', files: ['fe5d2a62.mp3'] }
  ];

  for (const sound of sounds) {
    sound.files = sound.files.map(file => `/audio/${file}`);
  }

  return sounds;
}

async function play(filename: string) {
  if (!filename) {
    return;
  }

  // We use AudioContext instead of Audio since it works more
  // reliably in different browsers (Chrome, FF, Brave).
  const context = new AudioContext();

  const source = context.createBufferSource();
  source.connect(context.destination);
  // eslint-disable-next-line no-async-promise-executor
  source.buffer = await new Promise(async (resolve, reject) => {
    const content = await Chrome.files.readBinary(filename);
    context.decodeAudioData(content, buffer => resolve(buffer), error => reject(error));
  });

  await new Promise<void>(resolve => {
    // Cleanup audio context after sound plays.
    source.onended = () => {
      context.close();
      resolve();
    }
    source.start();
  });
}

const notification = createNotificationSounds();
const timer = createTimerSounds();

export {
  notification,
  timer,
  play
};
