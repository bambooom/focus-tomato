import { OptionsClient } from './Services';
import { PomodoroTimer } from './Timer';

class Action {
  get title() {
    return '';
  }

  get visible() {
    return false;
  }

  run() {
  }
}

class Menu {
  contexts: chrome.contextMenus.ContextType | chrome.contextMenus.ContextType[];
  groups: MenuGroup[];
  constructor(contexts, ...groups: MenuGroup[]) {
    this.contexts = contexts;
    this.groups = groups;
  }

  addGroup(group: MenuGroup) {
    this.groups.push(group);
  }

  apply() {
    chrome.contextMenus.removeAll();

    let firstGroup = true;
    for (const group of this.groups) {
      let firstItem = true;
      for (const item of group.items) {
        if (!item.visible) {
          continue;
        }

        if (firstItem && !firstGroup) {
          chrome.contextMenus.create({ type: 'separator', contexts: this.contexts });
        }

        firstGroup = false;
        firstItem = false;

        if (item instanceof ParentMenu) {
          const id = chrome.contextMenus.create({
            title: item.title,
            contexts: this.contexts
          });

          for (const child of item.children) {
            if (!child.visible) {
              continue;
            }

            chrome.contextMenus.create({
              title: child.title,
              contexts: this.contexts,
              onclick: () => child.run(),
              parentId: id
            });
          }
        } else {
          chrome.contextMenus.create({
            title: item.title,
            contexts: this.contexts,
            onclick: () => item.run()
          });
        }
      }
    }
  }
}

class MenuGroup {
  items: (Action | ParentMenu)[];
  constructor(...items: (Action | ParentMenu)[]) {
    this.items = items;
  }

  addItem(item: Action | ParentMenu) {
    this.items.push(item);
  }
}

class ParentMenu {
  children: Action[];
  constructor(...children: Action[]) {
    this.children = children;
  }

  addChild(child: Action) {
    this.children.push(child);
  }

  get title() {
    return '';
  }

  get visible() {
    return false;
  }
}

class RestartTimerParentMenu extends ParentMenu {
  constructor(...children: Action[]) {
    super(...children);
  }

  get title() {
    return 'Restart Timer';
  }

  get visible() {
    return true;
  }
}

class StartFocusingAction extends Action {
  timer: PomodoroTimer
  constructor(timer: PomodoroTimer) {
    super();
    this.timer = timer;
  }

  get title() {
    return 'Start focusing now';
  }

  get visible() {
    return true;
  }

  run() {
    this.timer.startFocus();
  }
}

class StartShortBreakAction extends Action {
  timer: PomodoroTimer;
  constructor(timer: PomodoroTimer) {
    super();
    this.timer = timer;
  }

  get title() {
    return this.timer.hasLongBreak ? 'Start Short Break' : 'Start Break';
  }

  get visible() {
    return true;
  }

  run() {
    this.timer.startShortBreak();
  }
}

class StartLongBreakAction extends Action {
  timer: PomodoroTimer;
  constructor(timer: PomodoroTimer) {
    super();
    this.timer = timer;
  }

  get title() {
    return 'Start Long Break';
  }

  get visible() {
    return this.timer.hasLongBreak;
  }

  run() {
    this.timer.startLongBreak();
  }
}

class StopTimerAction extends Action {
  timer: PomodoroTimer;
  constructor(timer: PomodoroTimer) {
    super();
    this.timer = timer;
  }

  get title() {
    return 'Stop Timer';
  }

  get visible() {
    return this.timer.isRunning || this.timer.isPaused;
  }

  run() {
    this.timer.stop();
  }
}

class PauseTimerAction extends Action {
  timer: PomodoroTimer;
  constructor(timer: PomodoroTimer) {
    super();
    this.timer = timer;
  }

  get title() {
    return 'Pause Timer';
  }

  get visible() {
    return this.timer.isRunning;
  }

  run() {
    this.timer.pause();
  }
}

class ResumeTimerAction extends Action {
  timer: PomodoroTimer;
  constructor(timer: PomodoroTimer) {
    super();
    this.timer = timer;
  }

  get title() {
    return 'Resume Timer';
  }

  get visible() {
    return this.timer.isPaused;
  }

  run() {
    this.timer.resume();
  }
}

class PomodoroHistoryAction extends Action
{
  constructor() {
    super();
  }

  get title() {
    return 'Pomodoro History';
  }

  get visible() {
    return true;
  }

  async run() {
    await OptionsClient.once.showHistoryPage();
  }
}

class StartPomodoroCycleAction extends Action {
  timer: PomodoroTimer;
  constructor(timer: PomodoroTimer) {
    super();
    this.timer = timer;
  }

  get title() {
    if (this.timer.isRunning || this.timer.isPaused) {
      return 'Restart Pomodoro Cycle';
    } else {
      return 'Start Pomodoro Cycle';
    }
  }

  get visible() {
    return this.timer.hasLongBreak;
  }

  run() {
    this.timer.startCycle();
  }
}

class PomodoroMenuSelector {
  timer: PomodoroTimer;
  inactive: Menu;
  active: Menu;
  constructor(timer: PomodoroTimer, inactive: Menu, active: Menu) {
    this.timer = timer;
    this.inactive = inactive;
    this.active = active;
  }

  apply() {
    const menu = (this.timer.isRunning || this.timer.isPaused) ? this.active : this.inactive;
    menu.apply();
  }
}

function createPomodoroMenu(timer: PomodoroTimer) {
  const pause = new PauseTimerAction(timer);
  const resume = new ResumeTimerAction(timer);
  const stop = new StopTimerAction(timer);

  const startCycle = new StartPomodoroCycleAction(timer);
  const startFocus = new StartFocusingAction(timer);
  const startShortBreak = new StartShortBreakAction(timer);
  const startLongBreak = new StartLongBreakAction(timer);
  const viewHistory = new PomodoroHistoryAction();

  const inactive = new Menu(['browser_action'],
    new MenuGroup(
      startCycle,
      startFocus,
      startShortBreak,
      startLongBreak
    ),
    new MenuGroup(
      viewHistory
    )
  );

  const active = new Menu(['browser_action'],
    new MenuGroup(
      pause,
      resume,
      stop,
      new RestartTimerParentMenu(
        startFocus,
        startShortBreak,
        startLongBreak
      ),
      startCycle
    ),
    new MenuGroup(
      viewHistory
    )
  );

  return new PomodoroMenuSelector(timer, inactive, active);
}

export {
  type PomodoroMenuSelector,
  createPomodoroMenu
};
