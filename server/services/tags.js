var mongoose = require('mongoose');
var Article = mongoose.model('Article');

let instance = null;

class TagRepository {
  constructor() {
    if (!instance) {
      instance = this;
    }
    this.time = new Date();

    return instance;
  }

  getAll() {
    return Article.find().distinct('tagList');
  }
}

export default TagRepository;
