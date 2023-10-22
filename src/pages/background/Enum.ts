class EnumOption {
  value: string | number; // not sure if number and string enough
  symbol: symbol;
  constructor(name, value) {
    if (!Object.is(value, undefined)) {
      this.value = value;
    }

    this.symbol = Symbol.for(name);

    Object.freeze(this);
  }

  [Symbol.toPrimitive]() {
    return this.value;
  }

  toString() {
    return this.symbol;
  }

  valueOf() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}

class Enum {
  [key: string]: EnumOption;
  constructor(options) {
    for (const key in options) {
      this[key] = new EnumOption(key, options[key]);
    }

    Object.freeze(this);
  }

  // not using this function
  // keys() {
  //   return Object.keys(this);
  // }

  // not sure if this is correct, not using
  // contains(option) {
  //   if (!(option instanceof EnumOption)) {
  //     return false;
  //   }

  //   return this[Symbol.keyFor(option.symbol)] === symbol;
  // }
}

export default Enum;
