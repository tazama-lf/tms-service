const arangojs = require('arangojs');

class MockDatabase {
  constructor(config) {
    return {
      exists() {
        return true;
      },
      isArangoDatabase: true,
      close() {},
    };
  }
}

module.exports = { ...arangojs, Database: MockDatabase };
