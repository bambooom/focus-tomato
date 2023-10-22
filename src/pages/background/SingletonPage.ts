import Chrome from '@root/utils/Chrome';
import Enum from './Enum';

const PageHost = new Enum({
  Tab: 0,
  Window: 1
});

function canonical(url: URL): string {
  // The canonical page URL is the combined origin, path, and sorted query,
  // lowercased, excluding hashes and trailing slashes.
  // This will only reliably work with internal extension pages.
  url.searchParams.sort();
  return `${url.origin}${url.pathname.replace(/\/$/, '')}${url.searchParams}`.toLowerCase();
}

class SingletonPage {
  tabId: number;
  static async show(url: string, host, properties = {}) {
    // Search existing extension pages to see if page is already open.
    const targetUrl = new URL(url);
    const targetCanonical = canonical(targetUrl);

    const windows = chrome.extension.getViews();
    for (const window of windows) {
      if (canonical(new URL(window.location.href)) !== targetCanonical) {
        continue;
      }

      // We found a matching page. Update its hash and return it.
      const tabId = await new Promise(resolve => window.chrome.tabs.getCurrent(tab => resolve(tab.id)));
      window.location.hash = targetUrl.hash;
      return new SingletonPage(tabId);
    }

    // Page does not exist, so create it.
    if (host === PageHost.Tab) {
      const tab = await Chrome.tabs.create({ url, active: false, ...properties });
      return new SingletonPage(tab.id);
    } else if (host === PageHost.Window) {
      const window = await Chrome.windows.create({ url, type: 'popup', ...properties });
      return new SingletonPage(window.tabs[0].id);
    } else {
      throw new Error('Invalid page host.');
    }
  }

  constructor(tabId) {
    this.tabId = tabId;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    chrome.tabs.onRemoved.addListener(function removed(id) {
      if (id === self.tabId) {
        chrome.tabs.onRemoved.removeListener(removed);
        self.tabId = null;
      }
    });
  }

  focus() {
    if (!this.tabId) {
      return;
    }

    const focusWindow = tab => chrome.windows.update(tab.windowId, { focused: true });
    const focusTab = id => {
      try {
        chrome.tabs.update(id, { active: true, highlighted: true }, focusWindow);
      } catch (e) {
        // Firefox doesn't currently allow setting highlighted for chrome.tabs.update()
        // TODO: File a FF bug for this
        chrome.tabs.update(id, { active: true }, focusWindow);
      }
    };

    focusTab(this.tabId);
  }

  close() {
    if (!this.tabId) {
      return;
    }

    chrome.tabs.remove(this.tabId, () => {});
  }
}

export {
  PageHost,
  SingletonPage
};
