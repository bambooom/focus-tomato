import packageJson from './package.json';

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: packageJson.appName,
  version: packageJson.version,
  description: packageJson.description,
  author: packageJson.author,
  homepage_url: 'https://github.com/bambooom/focus-tomato',
  offline_enabled: true,
  permissions: [
    'storage',
    'alarms',
    'contextMenus',
    'notifications',
  ],
  options_page: 'src/pages/options/index.html',
  background: {
    service_worker: 'src/pages/background/index.js',
    type: 'module',
  },
  action: {
    // default_popup: 'src/pages/popup/index.html',
    default_icon: 'icon-32.png',
  },
  icons: {
    '128': 'icon-128.png',
  },
  // content_scripts: [
  //   {
  //     matches: ['http://*/*', 'https://*/*', '<all_urls>'],
  //     js: ['src/pages/content/index.js'],
  //     // KEY for cache invalidation
  //     css: ['assets/css/contentStyle<KEY>.chunk.css'],
  //   },
  // ],
  // devtools_page: 'src/pages/devtools/index.html',
  web_accessible_resources: [
    {
      resources: ['assets/js/*.js', 'assets/css/*.css', 'icon-128.png', 'icon-32.png'],
      matches: ['*://*/*'],
    },
  ],
};

export default manifest;
