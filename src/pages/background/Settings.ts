// Deep clone an object. Assumes only simple types and array/object aggregates of simple types.
// function clone(obj) {
//   if (obj instanceof Array) {
//     const copy = [];
//     for (const el of obj) {
//       copy.push(clone(el));
//     }
//     return copy;
//   } else if (obj instanceof Object) {
//     const copy = {};
//     for (const prop in obj) {
//       copy[prop] = clone(obj[prop]);
//     }
//     return copy;
//   } else {
//     return obj;
//   }
// }

class SettingsSchema {
  get version() {
    return 1;
  }

  get default() {
    return {
      focus: {
        duration: 25,
        timerSound: null,
        countdown: {
          host: null,
          autoclose: true,
          resolution: [500, 500]
        },
        notifications: {
          desktop: true,
          tab: true,
          sound: null
        }
      },
      shortBreak: {
        duration: 5,
        timerSound: null,
        countdown: {
          host: null,
          autoclose: true,
          resolution: [500, 500]
        },
        notifications: {
          desktop: true,
          tab: true,
          sound: null
        }
      },
      longBreak: {
        duration: 15,
        interval: 4,
        timerSound: null,
        countdown: {
          host: null,
          autoclose: true,
          resolution: [500, 500]
        },
        notifications: {
          desktop: true,
          tab: true,
          sound: null
        }
      },
      autostart: {
        time: null,
      },
      version: this.version
    };
  }
}

class PersistentSettings {
  static async create(settingsManager) {
    let settings = await settingsManager.get();

    // When the settings change, we update the underlying settigs object, which
    // allows users of the settings to see the updated values.
    settingsManager.on('change', newSettings => settings = newSettings);

    // We return a proxy object that forwards all getters
    // to the underlying settings object.
    return new Proxy(function() {}, {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get(target, prop, receiver) {
        return settings[prop];
      }
    });
  }
}

export {
  SettingsSchema,
  PersistentSettings
};
