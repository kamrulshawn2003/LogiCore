// Extend Jest timeouts for slow CI/local environments (DB sync can exceed 5s)
jest.setTimeout(60000);
