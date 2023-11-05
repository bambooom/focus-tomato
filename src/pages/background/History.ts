import Chrome from '@root/utils/Chrome'
import StorageManager from './StorageManager';
import RLE from './RLE';
import Mutex from '@root/utils/Mutex';
import moment from 'moment';

class History {
  storage: StorageManager;
  mutex: Mutex;
  constructor() {
    this.storage = new StorageManager(new HistorySchema(), Chrome.storage.local);
    this.mutex = new Mutex();
  }

  async all() {
    return await this.storage.get();
  }

  async clear() {
    await this.storage.set(this.storage.schema.default);
  }

  async merge(history) {
    return await this.mutex.exclusive(async () => {
      const existing = decompress(await this.storage.get());
      const importing = decompress(history);
      const { count, merged } = merge(existing, importing);
      await this.storage.set(compress(merged));
      return count;
    });
  }

  async toCSV() {
    const {
      pomodoros,
      durations,
      timezones
    } = decompress(await this.storage.get());

    const escape = value => {
      if (value.indexOf(',') < 0) {
        return value;
      }

      return '"' + value.replace(/"/g, '""') + '"';
    };

    const row = values => values.map(v => escape(v.toString())).join(',') + '\n';

    let csv = row([
      'End (ISO 8601)',
      'End Date',
      'End Time (24 Hour)',
      'End Timestamp (Unix)',
      'End Timezone (UTC Offset Minutes)',
      'Duration (Seconds)',
    ]);

    for (let i = 0; i < pomodoros.length; i++) {
      const [timestamp, timezone] = [pomodoros[i] * 60, -timezones[i]];
      const time = moment.unix(timestamp).utcOffset(timezone, true);
      csv += row([
        time.toISOString(true),
        time.format('YYYY-MM-DD'),
        time.format('HH:mm:ss'),
        timestamp,
        timezone,
        durations[i]
      ]);
    }

    return csv;
  }

  async addPomodoro(duration, when = null) {
    await this.mutex.exclusive(async () => {
      const local = await this.storage.get();

      when = when || new Date();
      const timestamp = History.timestamp(when);

      let i = local.pomodoros.length - 1;
      while (i >= 0 && local.pomodoros[i] > timestamp) {
        --i;
      }

      const timezone = when.getTimezoneOffset();

      if (i >= local.pomodoros.length - 1) {
        // Timestamps *should* be monotonically increasing, so we should
        // always be able to quickly append new values.
        RLE.append(local.durations, duration);
        RLE.append(local.timezones, timezone);
        local.pomodoros.push(timestamp);
      } else {
        // If there is a timestamp inversion for some reason, insert values
        // at the correct sorted position.
        const durations = RLE.decompress(local.durations);
        durations.splice(i + 1, 0, duration);
        local.durations = RLE.compress(durations);

        const timezones = RLE.decompress(local.timezones);
        timezones.splice(i + 1, 0, timezone);
        local.timezones = RLE.compress(timezones);

        local.pomodoros.splice(i + 1, 0, timestamp);
      }

      await this.storage.set(local);

      return this.countSince(local.pomodoros, History.today);
    });
  }

  async stats(since) {
    return this.mutex.exclusive(async () => {
      const { pomodoros } = await this.storage.get();

      const total = pomodoros.length;
      const delta = total === 0 ? 0 : ((new Date()).getTime() - History.date(pomodoros[0]).getTime());
      const dayCount = Math.max(delta / 1000 / 60 / 60 / 24, 1);
      const weekCount = Math.max(dayCount / 7, 1);
      const monthCount = Math.max(dayCount / (365.25 / 12), 1);

      return {
        day: this.countSince(pomodoros, History.today),
        dayAverage: total / dayCount,
        week: this.countSince(pomodoros, History.thisWeek),
        weekAverage: total / weekCount,
        month: this.countSince(pomodoros, History.thisMonth),
        monthAverage: total / monthCount,
        period: this.countSince(pomodoros, new Date(since)),
        total: total,
        daily: this.dailyGroups(pomodoros, since),
        pomodoros: pomodoros.map(p => +History.date(p))
      };
    });
  }

  async countToday(pomodoros = null) {
    return this.mutex.exclusive(async () => {
      if (!pomodoros) {
        pomodoros = (await this.storage.get()).pomodoros;
        if (pomodoros.length === 0) {
          return 0;
        }
      }

      return this.countSince(pomodoros, History.today);
    });
  }

  countSince(pomodoros, date) {
    const timestamp = History.timestamp(date);
    const index = search(pomodoros, timestamp);
    return pomodoros.length - index;
  }

  dailyGroups(pomodoros, since) {
    const start = new Date(since);

    const daily = {};
    let base = 0;
    const date = History.today;
    while (date >= start) {
      const countSince = this.countSince(pomodoros, date);
      const count = countSince - base;
      if (count > 0) {
        daily[+date] = count;
        base = countSince;
      }
      date.setDate(date.getDate() - 1);
    }

    return daily;
  }

  static timestamp(date) {
    return Math.floor(+date / 1000 / 60);
  }

  static date(timestamp: number): Date {
    return new Date(timestamp * 60 * 1000);
  }

  static get today() {
    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return today;
  }

  static get thisWeek() {
    const week = new Date();
    week.setDate(week.getDate() - week.getDay());
    week.setHours(0);
    week.setMinutes(0);
    week.setSeconds(0);
    week.setMilliseconds(0);
    return week;
  }

  static get thisMonth() {
    const month = new Date();
    month.setDate(1);
    month.setHours(0);
    month.setMinutes(0);
    month.setSeconds(0);
    month.setMilliseconds(0);
    return month;
  }
}

class HistorySchema
{
  get version() {
    return 1;
  }

  get default() {
    return {
      pomodoros: [],
      durations: [],
      timezones: [],
      version: this.version
    };
  }
}

function decompress(historyRLE) {
  if (!historyRLE) {
    throw new Error('Missing Pomodoro data.');
  }

  const {
    pomodoros,
    durations: durationsRLE,
    timezones: timezonesRLE
  } = historyRLE;

  if (!pomodoros) {
    throw new Error('invalid_duration_data');
  }

  if (!durationsRLE) {
    throw new Error('Missing duration data.');
  }

  if (!Array.isArray(durationsRLE)) {
    throw new Error('Invalid duration data.');
  }

  if (!timezonesRLE) {
    throw new Error('Missing timezone data.');
  }

  if (!Array.isArray(timezonesRLE)) {
    throw new Error('Missing timezone data.');
  }

  const durations = RLE.decompress(durationsRLE);
  const timezones = RLE.decompress(timezonesRLE);

  if (pomodoros.length !== durations.length) {
    throw new Error('Mismatched Pomodoro/duration data.');
  }

  if (pomodoros.length !== timezones.length) {
    throw new Error('Mismatched Pomodoro/timezone data.');
  }

  for (let i = 0; i < pomodoros.length; i++) {
    if (!Number.isInteger(pomodoros[i])) {
      throw new Error('Invalid Pomodoro data.');
    }

    if (!Number.isInteger(durations[i])) {
      throw new Error('Invalid duration data.');
    }

    if (!Number.isInteger(timezones[i])) {
      throw new Error('Invalid timezone data.');
    }
  }

  return {
    ...historyRLE,
    pomodoros,
    durations,
    timezones
  };
}

function compress(history) {
  if (!history) {
    throw new Error('Missing Pomodoro data.');
  }

  if (!history.durations) {
    throw new Error('Missing duration data.');
  }

  if (!Array.isArray(history.durations)) {
    throw new Error('Invalid duration data.');
  }

  if (!history.timezones) {
    throw new Error('Missing timezone data.');
  }

  if (!Array.isArray(history.timezones)) {
    throw new Error('Invalid timezone data.');
  }

  return {
    ...history,
    durations: RLE.compress(history.durations),
    timezones: RLE.compress(history.timezones)
  };
}

function merge(existing, importing) {
  const {
    pomodoros: existingPomodoros,
    durations: existingDurations,
    timezones: existingTimezones
  } = existing;

  const {
    pomodoros: importingPomodoros,
    durations: importingDurations,
    timezones: importingTimezones
  } = importing;

  const pomodoros = [...existingPomodoros];
  const durations = [...existingDurations];
  const timezones = [...existingTimezones];

  let count = 0;
  for (let i = 0; i < importingPomodoros.length; i++) {
    const timestamp = importingPomodoros[i];
    const index = search(pomodoros, timestamp);

    if (pomodoros[index] === timestamp) {
      // Pomodoros with the same timestamp are considered
      // identical and are excluded when being imported.
      continue;
    }

    count++;
    pomodoros.splice(index, 0, timestamp);
    durations.splice(index, 0, importingDurations[i]);
    timezones.splice(index, 0, importingTimezones[i]);
  }

  return {
    count,
    merged: {
      ...existing,
      pomodoros,
      durations,
      timezones
    }
  };
}

// Returns the index in arr for which all elements at or after the index are
// at least min. If all elements are less than min, this returns arr.length.
function search(arr, min, lo = null, hi = null) {
  lo = lo || 0;
  hi = hi || (arr.length - 1);

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] >= min) {
      hi = mid - 1;
    } else if (arr[mid] < min) {
      lo = mid + 1;
    }
  }

  return Math.min(lo, arr.length);
}

export {
  History,
  merge
};
