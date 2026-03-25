module.exports = {
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'https://wisrovi.github.io/wticket',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
};
