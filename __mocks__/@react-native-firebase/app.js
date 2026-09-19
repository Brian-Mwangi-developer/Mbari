/** Jest has no Firebase native module; tests behave like a build without google-services.json. */
module.exports = {
  __esModule: true,
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => {
    throw new Error('No Firebase App');
  }),
};
