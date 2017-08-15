const mongoose = require('mongoose');
const Article = mongoose.model('Article');
const Comment = mongoose.model('Comment');
const User = mongoose.model('User');
import ArticleService from './articles';
import SessionService from './session';

let instance = null;

class CommentService {
  constructor() {
    if (!instance) {
      instance = this;
    }
    this.time = new Date();
    this.articleService = new ArticleService();
    this.sessionService = new SessionService();

    return instance;
  }

  getByIds(ids) {
    return Comment.find({
      '_id': {
        $in: ids
      }
    });
  }

  create(args) {
    let userId = this.sessionService.getCurrentUser();

    if (!userId) {
      throw new Error('Not authenticated');
    }

    return Promise.all([
      this.articleService.getById(args.articleId),
      User.findById(userId)
    ]).then(function(results){
      let article = results[0];
      let user = results[1];
      if (!user) {
        throw new Error('No user entry found');
      }

      let comment = new Comment();
      comment.body = args.body;
      comment.article = article;
      comment.author = user;

      return comment.save().then(function(){
        article.comments.push(comment);

        return article.save().then(function(article) {
          return true;
        });
      });
    })
  }

  delete(args) {
    let userId = this.sessionService.getCurrentUser();

    if (!userId) {
      throw new Error('Not authenticated');
    }

    return this.getById(args.id).then(function(comment) {
      if(comment.author.toString() === userId.toString()){
        let articleId = comment.article;

        return instance.articleService.getById(articleId).then(function(article) {

          article.comments.remove(comment._id);
          article.save()
            .then(Comment.find({_id: comment._id}).remove().exec())
            .then(function(){
              return true;
            });
        });
      } else {
        throw new Error('Only the author of the comment can remove his comment');
      }
    })
  }

  getAll(args, req) {
    return this.articleRepo.getArticle(args).then(function(article) {
      return Comment.find({ article: article._id }).populate('author').then(function(comments) {
        return comments;
      });
    });
  }
};

export default CommentService;
