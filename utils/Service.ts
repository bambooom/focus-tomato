import EventEmitter from 'events';

class ServiceBroker {
  services: Record<string, (...args) => void>;
  static _instance: ServiceBroker;
  constructor() {
    this.services = {};
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
  }

  static get instance() {
    if (!this._instance) {
      this._instance = new ServiceBroker();
    }
    return this._instance;
  }

  static register(service) {
    return this.instance.register(service);
  }

  static async invoke(call) {
    return await this.instance.invoke(call);
  }

  register(service) {
    console.log(service);
    this.services[service.constructor.name] = service;
    return service;
  }

  static unregister(service) {
    delete this._instance.services[service.constructor.name];
  }

  unregister(service) {
    delete this.services[service.constructor.name];
    return service;
  }

  async invoke({ serviceName, methodName, args }) {
    const service = this.services[serviceName];
    if (service) {
      if (service[methodName]) {
        // Service is defined in this context, call method directly.
        return await service[methodName](...args);
      } else {
        throw new Error(`Invalid service request: ${serviceName}.${methodName}.`);
      }
    }

    // Service is defined in another context, use sendMessage to call it.
    return await new Promise((resolve, reject) => {
      const message = { serviceName, methodName, args };
      console.log('message: ', message);
      chrome.runtime.sendMessage(message, ({ result, error }) => {
        if (error !== undefined) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  onMessage({ serviceName, methodName, args }, sender, respond) {
    console.log('on message1111: ', serviceName, methodName, args, sender, respond);
    const service = this.services[serviceName];
    console.log('222');
    if (!service || methodName === undefined) {
      console.log('3333');
      // Service is not defined in this context, so we have nothing to do.
      return;
    }

    console.log('444');

    if (!service[methodName]) {
      console.log('555');
      respond({ error: `Invalid service request: ${serviceName}.${methodName}.` });
      return true;
    }

    console.log('666');

    (async () => {
      try {
        console.log(7777);
        respond({ result: await service[methodName](...args) });
      } catch (e) {
        console.log(888);
        console.error(e);
        respond({ error: `${e}` });
      }
    })();

    return true;
  }
}

class ServiceProxy extends EventEmitter {
  serviceName: string;
  listenersCount: number;
  onMessage: (...args: unknown[]) => void;
  constructor(serviceName) {
    super();
    this.serviceName = serviceName;
    this.listenersCount = 0;

    this.on('removeListener', () => {
      if (--this.listenersCount === 0) {
        chrome.runtime.onMessage.removeListener(this.onMessage);
      }
    });

    this.on('newListener', () => {
      if (++this.listenersCount === 1) {
        this.onMessage = this._onMessage.bind(this);
        chrome.runtime.onMessage.addListener(this.onMessage);
      }
    });
  }

  dispose() {
    this.removeAllListeners();
    chrome.runtime.onMessage.removeListener(this.onMessage);
  }

  get(target, prop) {
    if (this[prop]) {
      return this[prop];
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return async function () {
      const call = {
        serviceName: self.serviceName,
        methodName: prop,
        // eslint-disable-next-line prefer-rest-params
        args: Array.from(arguments),
      };
      return await ServiceBroker.invoke(call);
    };
  }

  _onMessage({ serviceName, eventName, args }) {
    if (serviceName !== this.serviceName || eventName === undefined) {
      return;
    }

    this.emit(eventName, ...args);
  }
}

class Service {
  serviceName: string;
  constructor() {
    // this.clients = {};
    this.serviceName = this.constructor.name;
  }

  emit(eventName, ...args) {
    console.log('emit: ', eventName, args);
    chrome.runtime.sendMessage({
      serviceName: this.serviceName,
      eventName,
      args,
    });
  }

  static get proxy() {
    const serviceName = this.name;
    const create = () => new Proxy(function () {}, new ServiceProxy(serviceName));

    const handler = {
      construct() {
        return create();
      },
      get(target, prop) {
        // Support one-shot service invocations.
        // This creates a client, performs the RPC, then cleans up.
        // Example usage: let result = await SomeClient.once.doThing('abc', 123);

        if (prop !== 'once') {
          return undefined;
        }

        return new Proxy(function () {}, {
          get(target, prop) {
            return (...args) => {
              const client = create();
              try {
                return client[prop](...args);
              } finally {
                client.dispose();
              }
            };
          },
        });
      },
    };

    return new Proxy(function () {}, handler);
  }
}

export { Service, ServiceBroker };
