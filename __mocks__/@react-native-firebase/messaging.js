const unsubscribe = () => {};
module.exports = {
  __esModule: true,
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(() => Promise.resolve('test-fcm-token')),
  deleteToken: jest.fn(() => Promise.resolve()),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  onNotificationOpenedApp: jest.fn(() => unsubscribe),
  onMessage: jest.fn(() => unsubscribe),
  onTokenRefresh: jest.fn(() => unsubscribe),
  setBackgroundMessageHandler: jest.fn(),
};
