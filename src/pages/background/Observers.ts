import { EnumOption } from './Enum';
import { Phase, PomodoroTimer } from './Timer';
import { pomodoroCount } from '@root/utils/Filters';
import * as Sounds from "@root/utils/Sounds";
import Notification from './Notification';
import { ExpirationPage } from './Expiration';
import Mutex from '@root/utils/Mutex';
import createTimerSound from '@root/utils/TimerSound';
import { SingletonPage, PageHost } from './SingletonPage';
import Metronome from '@root/utils/Metronome';
import { Noise } from '@root/utils/Noise';
import { PomodoroMenuSelector } from './Menu';

class BadgeObserver {
  onStart({ phase, remaining }) {
    this.updateBadge({ phase, minutes: Math.round(remaining / 60) });
  }

  onTick({ phase, remaining }) {
    this.updateBadge({ phase, minutes: Math.round(remaining / 60) });
  }

  onStop() {
    this.removeBadge();
  }

  onPause({ phase }) {
    this.updateBadge({ phase, text: '—', tooltip: 'Timer Paused' });
  }

  onResume({ phase, remaining }) {
    this.updateBadge({ phase, minutes: Math.round(remaining / 60) });
  }

  onExpire() {
    this.removeBadge();
  }

  updateBadge({ phase, minutes, tooltip, text }: {
    phase: EnumOption,
    minutes?: number,
    tooltip?: string,
    text?: string
  }) {
    const title = {
      [Phase.Focus.toString()]: 'Focus',
      [Phase.ShortBreak.toString()]: 'Short Break',
      [Phase.LongBreak.toString()]: 'Long Break',
    }[phase.toString()];

    if (minutes != null) {
      text = minutes < 1 ? '<1m' : `${minutes}m`;
      tooltip = `${title}: ${text} Remaining`;
    } else {
      tooltip = `${title}: ${tooltip} Remaining`;
    }

    const color = phase === Phase.Focus ? '#bb0000' : '#11aa11';
    chrome.browserAction.setTitle({ title: tooltip });
    chrome.browserAction.setBadgeText({ text });
    chrome.browserAction.setBadgeBackgroundColor({ color });
  }

  removeBadge() {
    chrome.browserAction.setTitle({ title: '' });
    chrome.browserAction.setBadgeText({ text: '' });
  }
}

class TimerSoundObserver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: Record<string, any>;
  mutex: Mutex;
  timerSound: Metronome | Noise | null;
  constructor(settings) {
    this.settings = settings;
    this.mutex = new Mutex();
    this.timerSound = null;
  }

  async onStart({ phase }) {
    const timerSoundSettings = this.settings.focus.timerSound;
    await this.mutex.exclusive(async () => {
      // Cleanup any existing timer sound.
      this.timerSound && await this.timerSound.close();

      if (phase === Phase.Focus && timerSoundSettings) {
        this.timerSound = await createTimerSound(timerSoundSettings);
        this.timerSound.start();
      } else {
        this.timerSound = null;
      }
    });
  }

  async onStop() {
    await this.mutex.exclusive(async () => {
      this.timerSound && await this.timerSound.close();
    });
  }

  async onPause() {
    await this.mutex.exclusive(async () => {
      this.timerSound && await this.timerSound.stop();
    });
  }

  async onResume() {
    await this.mutex.exclusive(async () => {
      this.timerSound && await this.timerSound.start();
    });
  }

  async onExpire() {
    await this.mutex.exclusive(async () => {
      this.timerSound && await this.timerSound.close();
    });
  }
}

class ExpirationSoundObserver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: Record<string, any>;
  constructor(settings) {
    this.settings = settings;
  }

  onExpire({ phase }) {
    const sound = s => s && s.notifications.sound;
    const filename = {
      [Phase.Focus.toString()]: sound(this.settings.focus),
      [Phase.ShortBreak.toString()]: sound(this.settings.shortBreak),
      [Phase.LongBreak.toString()]: sound(this.settings.longBreak)
    }[phase];

    if (filename) {
      Sounds.play(filename);
    }
  }
}

class NotificationObserver {
  timer: PomodoroTimer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: any;
  notification: Notification | null;
  expiration: ExpirationPage | null;
  mutex: Mutex;
  constructor(timer, settings, history) {
    this.timer = timer;
    this.settings = settings;
    this.history = history;
    this.notification = null;
    this.expiration = null;
    this.mutex = new Mutex();
  }

  onStart() {
    this.mutex.exclusive(async () => {
      if (this.notification) {
        this.notification.close();
        this.notification = null;
      }

      if (this.expiration) {
        this.expiration.close();
        this.expiration = null;
      }
    });
  }

  async onExpire({ phase, nextPhase }) {
    const settings = this.settings[{
      [Phase.Focus.toString()]: 'focus',
      [Phase.ShortBreak.toString()]: 'shortBreak',
      [Phase.LongBreak.toString()]: 'longBreak'
    }[phase]];

    const hasLongBreak = this.timer.hasLongBreak;
    const title = {
      [Phase.Focus.toString()]: 'Start Focusing',
      [Phase.ShortBreak.toString()]: hasLongBreak ? 'Take a Short Break' : 'Take a Break',
      [Phase.LongBreak.toString()]: 'Take a Long Break'
    }[nextPhase];

    const buttonText = {
      [Phase.Focus.toString()]: 'Start focusing now',
      [Phase.ShortBreak.toString()]: hasLongBreak ? 'Start short break now' : 'Start break now',
      [Phase.LongBreak.toString()]: 'Start long break now'
    }[nextPhase];

    const action = {
      [Phase.Focus.toString()]: 'Start Focusing',
      [Phase.ShortBreak.toString()]: hasLongBreak ?'Take a Short Break' : 'Take a Break',
      [Phase.LongBreak.toString()]: 'Take a Long Break'
    }[nextPhase];

    let messages = [];
    const remaining = this.timer.pomodorosUntilLongBreak;
    if (remaining > 0) {
      messages.push(`${pomodoroCount(remaining)} until long break`);
    }

    const pomodorosToday = await this.history.countToday();
    // messages.push(M.pomodoros_completed_today(pomodoroCount(pomodorosToday)));

    messages = messages.filter(m => !!m);

    await this.mutex.exclusive(async () => {
      if (settings.notifications.desktop) {
        this.notification = new Notification(title, messages.join('\n'), () => this.timer.start());
        this.notification.addButton(buttonText, () => this.timer.start());
        await this.notification.show();
      }

      if (settings.notifications.tab) {
        const phaseId = {
          [Phase.Focus.toString()]: 'focus',
          [Phase.ShortBreak.toString()]: hasLongBreak ? 'short-break' : 'break',
          [Phase.LongBreak.toString()]: 'long-break'
        }[nextPhase];

        this.expiration = await ExpirationPage.show(
          title,
          messages,
          action,
          pomodorosToday,
          phaseId
        );
      }
    });
  }
}

class HistoryObserver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: any;
  constructor(history) {
    this.history = history;
  }

  async onExpire({ phase, duration }) {
    if (phase !== Phase.Focus) {
      return;
    }

    await this.history.addPomodoro(duration);
  }
}

class CountdownObserver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: Record<string, any>;
  constructor(settings) {
    this.settings = settings;
  }

  async onStart({ phase }) {
    const settings = this.settings[{
      [Phase.Focus.toString()]: 'focus',
      [Phase.ShortBreak.toString()]: 'shortBreak',
      [Phase.LongBreak.toString()]: 'longBreak'
    }[phase]];

    const { host, resolution } = settings.countdown;
    if (!host) {
      return;
    }

    let page = null;
    const url = chrome.extension.getURL('modules/countdown.html');

    if (host === 'tab') {
      page = await SingletonPage.show(url, PageHost.Tab);
      page.focus();
      return;
    }

    if (host !== 'window') {
      return;
    }

    let properties = {};
    if (resolution === 'fullscreen') {
      properties = { state: 'maximized' };
    } else if (Array.isArray(resolution)) {
      const [windowWidth, windowHeight] = resolution;
      const { width: screenWidth, height: screenHeight } = window.screen;
      const left = screenWidth / 2 - windowWidth / 2;
      const top = screenHeight / 2 - windowHeight / 2;
      properties = { width: windowWidth, height: windowHeight, left, top };
    }

    page = await SingletonPage.show(url, PageHost.Window, properties);
    page.focus();
  }
}

class MenuObserver {
  menu: PomodoroMenuSelector;
  constructor(menu: PomodoroMenuSelector) {
    this.menu = menu;
  }

  onStart() {
    this.menu.apply();
  }

  onStop() {
    this.menu.apply();
  }

  onPause() {
    this.menu.apply();
  }

  onResume() {
    this.menu.apply();
  }

  onTick() {
    this.menu.apply();
  }

  onExpire() {
    this.menu.apply();
  }
}

class TraceObserver {
  onStart(...args) {
    console.log('start', ...args);
  }

  onStop(...args) {
    console.log('stop', ...args);
  }

  onPause(...args) {
    console.log('pause', ...args);
  }

  onResume(...args) {
    console.log('resume', ...args);
  }

  onTick(...args) {
    console.log('tick', ...args);
  }

  onExpire(...args) {
    console.log('expire', ...args);
  }
}

export {
  BadgeObserver,
  TimerSoundObserver,
  ExpirationSoundObserver,
  NotificationObserver,
  HistoryObserver,
  CountdownObserver,
  MenuObserver,
  TraceObserver
};
