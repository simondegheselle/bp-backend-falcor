const mongoose = require('mongoose');

let instance = null;

class SessionService {
  constructor() {
    if (!instance) {
      instance = this;
    }
    this.time = new Date();

    return instance;
  }

  setCurrentUser(id) {
    this.id = id;
  }

  getCurrentUser() {
    return this.id;
  }

  isAuthenticated() {
    return this.id !== 'undefined';
  }
};

module.exports = SessionService;
