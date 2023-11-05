// import { formatter } from './LocaleFormat';

function integer(value: number): string {
  return value.toLocaleString();
}

function float(value: number, digits: number): string {
  return value.toLocaleString(navigator.language, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

// function strftime(value, format) {
//   return formatter(format)(value);
// }

function pomodoroCount(count: number): string {
  if (count === 0) {
    return 'No Pomodoros';
  } else if (count === 1) {
    return '1 Pomodoro';
  } else {
    return `${count} Pomodoros"`;
  }
}

function mmss(seconds: number): string {
  let minutes: number | string = Math.floor(seconds / 60);
  let _seconds: number | string = seconds;
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  seconds = Math.floor(seconds % 60);
  if (seconds < 10) {
    _seconds = '0' + seconds;
  }
  return `${minutes}:${_seconds}`;
}

function clamp(value: number, lo: number, hi: number): number {
  if (value <= lo) {
    return lo;
  }

  if (value >= hi) {
    return hi;
  }

  return value;
}

export {
  float,
  integer,
  // strftime.
  pomodoroCount,
  mmss,
  clamp
};
