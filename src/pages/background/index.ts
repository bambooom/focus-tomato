import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import StorageManager from './StorageManager';
import { PersistentSettings, SettingsSchema } from './Settings';
import Chrome from '@root/utils/Chrome';
import { PomodoroTimer } from './Timer';
import { createPomodoroMenu } from './Menu';
import { History } from './History';
import { HistoryService, SoundsService, SettingsService, PomodoroService, OptionsService } from './Services';
import {
  BadgeObserver,
  TimerSoundObserver,
  ExpirationSoundObserver,
  NotificationObserver,
  HistoryObserver,
  CountdownObserver,
  MenuObserver,
} from './Observers';
import * as Alarms from './Alarms';
import { ServiceBroker } from '@root/utils/Service';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

console.log('background loaded');

async function run() {
  chrome.runtime.onUpdateAvailable.addListener(() => {
    // We must listen to (but do nothing with) the onUpdateAvailable event in order to
    // defer updating the extension until the next time Chrome is restarted. We do not want
    // the extension to automatically reload on update since a Pomodoro might be running.
    // See https://developer.chrome.com/apps/runtime#event-onUpdateAvailable.
  });

  const settingsManager = new StorageManager(new SettingsSchema(), Chrome.storage.sync);
  // this await function cannot get the result in background script (service worker)
  // @todo: find a way to make this work
  const settings = await PersistentSettings.create(settingsManager);
  const timer = new PomodoroTimer(settings);
  const history = new History();
  const menu = createPomodoroMenu(timer);

  timer.observe(new HistoryObserver(history));
  timer.observe(new HistoryObserver(history));
  timer.observe(new BadgeObserver());
  timer.observe(new NotificationObserver(timer, settings, history));
  timer.observe(new ExpirationSoundObserver(settings));
  timer.observe(new TimerSoundObserver(settings));
  timer.observe(new CountdownObserver(settings));
  timer.observe(new MenuObserver(menu));

  menu.apply();
  settingsManager.on('change', () => menu.apply());

  Alarms.install(timer, settingsManager);

  chrome.browserAction.onClicked.addListener(() => {
    if (timer.isRunning) {
      timer.pause();
    } else if (timer.isPaused) {
      timer.resume();
    } else {
      timer.start();
    }
  });

  ServiceBroker.register(new HistoryService(history));
  ServiceBroker.register(new SoundsService());
  ServiceBroker.register(new SettingsService(settingsManager));
  ServiceBroker.register(new PomodoroService(timer));
  ServiceBroker.register(new OptionsService());
}

run();
