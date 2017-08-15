var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var User = mongoose.model('User');

import SessionService from './session';

let instance = null;

class ArticleService {
  constructor() {
    if (!instance) {
      instance = this;
    }
    this.time = new Date();
    this.sessionService = new SessionService();

    return instance;
  }

  getById(id) {
    console.log(id);
    return Article.findById(id  )
      .populate('author')
      .then(function(article) {
        if (!article) {
          throw new Error('Article can\'t be found');
        }
        return article;
      });
  }

  getAll(args) {
    var query = {};
    var limit = 20;
    var offset = 0;

    if (typeof args.limit !== 'undefined') {
      limit = args.limit;
    }

    if (typeof args.offset !== 'undefined') {
      offset = args.offset;
    }

    if (typeof args.tag !== 'undefined') {
      query.tagList = {
        "$in": [args.tag]
      };
    }

    return Promise.all([
      args.author ? User.findOne({username: args.author}) : null,
      args.favorited ? User.findOne({username: args.favorited}) : null,
    ]).then(function(results) {
      var author = results[0];
      var favoriter = results[1];

      if (author) {
        query.author = author._id;
      }

      if(favoriter){
        query._id = {$in: favoriter.favorites};
      } else if(args.favorited){
        query._id = {$in: []};
      }

      return Promise.all([
        Article.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({
          createdAt: 'desc'
        })
        .populate('author')
        .exec(),
        instance.sessionService.isAuthenticated() ? instance.sessionService.getCurrentUser() : null,
      ]).then(function(results) {
        var articles = results[0];
        var user = results[1];

        return articles;
      });
    })
  }

  create(args) {
    let isAuthenticated = this.sessionService.isAuthenticated();

    if (!isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    return User.findById(this.sessionService.getCurrentUser()).then(function(user) {
      const article = new Article();

      if (!user) {
        throw new Error('No user entry found for username');
      }

      if (typeof args.title !== 'undefined') {
        article.title = args.title;
      }

      if (typeof args.description !== 'undefined') {
        article.description = args.description;
      }

      if (typeof args.body !== 'undefined') {
        article.body = args.body;
      }

      if (typeof args.tagList !== 'undefined') {
        article.tagList = args.tagList
      }

      article.author = user;

      const newArticle = article.save().catch(err => {throw new Error('Article could not be added')});

      if (!newArticle) {
        throw new Error('Article could not be added');
      }

      return newArticle;
    });
  }

  update(args) {

    if(args.id === 'undefined') {
      throw new Error('No article id provided');
    }

    return this.getById(args.id).then(function(article) {
      if (!article) {
        throw new Error('Article could not be found');
      }

      if (typeof args.title !== 'undefined') {
        article.title = args.title;
      }

      if (typeof args.description !== 'undefined') {
        article.description = args.description;
      }

      if (typeof args.body !== 'undefined') {
        article.body = args.body;
      }

      if (typeof args.tagList !== 'undefined') {
        article.tagList = args.tagList
      }

      return article.save().then(function(article) {
        return article;
      });
    });
  }

  delete(id) {
    let userId = this.sessionService.getCurrentUser();

    return User.findById(userId).then(function(user) {
      if (!user) {
        throw new Error('No user found');
      }

      return instance.getById(id).then(function(article) {
        if (article.author._id.toString() === userId.toString()) {
          return article.remove().then(function() {
            return true;
          });
        } else {
          return false;
        }
      });
    });
  }

  getArticleBySlug(slug) {
    return Article.findOne({
        slug: slug
      })
      .populate('author')
      .populate('comments')
      .then(function(article) {
        if (!article) {
          throw new Error('Article can\'t be found');
        }
        return article;
      });
  }

  favorite(args, req) {
    return Promise.all([
      this.getArticle(args),
      User.findById(req.payload.id)
    ]).then(function(results) {
      let article = results[0];
      let user = results[1];

      if (!user) {
        throw new Error('No user entry found');
      }

      return user.favorite(article._id).then(function() {
        return article.updateFavoriteCount().then(function(article) {
          return article;
        });
      });
    })
  }

  unfavorite(args, req) {
    return Promise.all([
      this.getArticle(args),
      User.findById(req.payload.id)
    ]).then(function(results) {
      let article = results[0];
      let user = results[1];

      if (!user) {
        throw new Error('No user entry found');
      }

      return user.unfavorite(article._id).then(function() {
        return article.updateFavoriteCount().then(function(article) {
          return article;
        });
      });
    })
  }
};

export default ArticleService;
