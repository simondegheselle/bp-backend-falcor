const articles = require('./articles');
const comments = require('./comments');

module.exports = [
  ...articles,
  ...comments,
];
