import Chrome from "@root/utils/Chrome";
import Mutex from "@root/utils/Mutex";


let settings = null;
const mutex = new Mutex();

async function install(timer, settingsManager) {
  settings = await settingsManager.get();
  settingsManager.on('change', async newSettings => {
    settings = newSettings;
    await setAlarm(settings);
  });
  chrome.alarms.onAlarm.addListener(alarm => onAlarm(alarm, timer));
  await setAlarm(settings);
}

async function setAlarm(settings) {
  await mutex.exclusive(async () => {
    await Chrome.alarms.clearAll();

    const time = settings.autostart && settings.autostart.time;
    if (!time) {
      return;
    }

    const now = new Date();

    const startAt = new Date();
    const [hours, minutes] = time.split(':');
    startAt.setHours(Number(hours), Number(minutes), 0, 0);
    if (startAt <= now) {
      // The trigger is in the past. Set it for tomorrow instead.
      startAt.setDate(startAt.getDate() + 1);
    }

    Chrome.alarms.create('autostart', { when: +startAt, });
  });
}

async function onAlarm(alarm, timer) {
  if (alarm.name !== 'autostart') {
    return;
  }

  // Set next autostart alarm.
  await setAlarm(settings);

  if (!timer.isStopped) {
    return;
  }

  // Start a new cycle.
  timer.startCycle();

  Chrome.notifications.create({
    type: 'basic',
    title: 'Autostart Pomodoro',
    message: 'This scheduled Pomodoro was automatically started',
    iconUrl: 'images/128.png',
    isClickable: false,
    requireInteraction: true
  });
}

export { install };
