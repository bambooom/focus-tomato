import Chrome from '@root/utils/Chrome';

class Notification {
  title: string;
  message: string;
  buttons: { title: string; onClick: () => void }[];
  notificationId: null;
  onClick: () => void;
  constructor(title: string, message: string, onClick = null) {
    this.title = title;
    this.message = message;
    this.buttons = [];
    this.notificationId = null;
    this.onClick = onClick;
  }

  addButton(title, onClick) {
    this.buttons.push({ title, onClick });
  }

  async show() {
    if (this.notificationId != null) {
      return;
    }

    const options = {
      type: 'basic',
      title: this.title,
      message: this.message,
      iconUrl: 'images/128.png', // @todo replace icon
      isClickable: !!this.onClick,
      requireInteraction: true,
      buttons: this.buttons.map(b => {
        return {
          title: b.title,
          iconUrl: 'images/start.png' // @todo replace icon
        };
      })
    };

    this.notificationId = await Chrome.notifications.create(options);

    const notificationClicked = notificationId => {
      if (notificationId !== this.notificationId) {
        return;
      }
      this.onClick && this.onClick();
      chrome.notifications.clear(notificationId);
    };

    const buttonClicked = (notificationId, buttonIndex) => {
      if (notificationId !== this.notificationId) {
        return;
      }
      this.buttons[buttonIndex].onClick();
      chrome.notifications.clear(notificationId);
    };

    const notificationClosed = notificationId => {
      if (notificationId !== this.notificationId) {
        return;
      }
      chrome.notifications.onClicked.removeListener(notificationClicked);
      chrome.notifications.onButtonClicked.removeListener(buttonClicked);
      chrome.notifications.onClosed.removeListener(notificationClosed);
      this.notificationId = null;
    };

    chrome.notifications.onClicked.addListener(notificationClicked);
    chrome.notifications.onButtonClicked.addListener(buttonClicked);
    chrome.notifications.onClosed.addListener(notificationClosed);
  }

  close() {
    if (this.notificationId != null) {
      chrome.notifications.clear(this.notificationId);
    }
  }
}

export default Notification;
