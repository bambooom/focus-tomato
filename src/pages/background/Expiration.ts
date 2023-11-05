import { SingletonPage, PageHost } from './SingletonPage';
import { Service, ServiceBroker } from '@root/utils/Service';

class ExpirationService extends Service {
  properties: Record<string, unknown>;
  page: SingletonPage;
  constructor(properties, page) {
    super();
    this.properties = properties;
    this.page = page;
  }

  async getProperties() {
    // When the expiration page asks for properties, it has loaded,
    // so we can focus it now.
    setTimeout(() => this.page.focus(), 0);
    return this.properties;
  }
}

class ExpirationPage {
  page: SingletonPage;
  service: ExpirationService;
  static async show(title, messages, action, pomodoros, phase) {
    const page = await SingletonPage.show(chrome.extension.getURL('modules/expire.html'), PageHost.Tab);
    return new ExpirationPage(page, title, messages, action, pomodoros, phase);
  }

  constructor(page, title, messages, action, pomodoros, phase) {
    this.page = page;

    const properties = { title, messages, pomodoros, action, phase };
    this.service = new ExpirationService(properties, page);
    ServiceBroker.register(this.service);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    chrome.tabs.onRemoved.addListener(function removed(id) {
      if (id !== page.tabId) {
        return;
      }

      // Service no longer needed.
      ServiceBroker.unregister(self.service);
      chrome.tabs.onRemoved.removeListener(removed);
    });
  }

  close() {
    this.page.close();
  }
}

const ExpirationClient = ExpirationService.proxy;

export {
  ExpirationPage,
  ExpirationClient
};
