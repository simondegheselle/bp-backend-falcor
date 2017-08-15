var mongoose = require('mongoose');
var jsonGraph = require('falcor-json-graph');
const Comment = mongoose.model('Comment');
var Promise = require('promise');


var $ref = jsonGraph.ref;
var $error = jsonGraph.error;
var $attom = jsonGraph.attom;

import CommentService from '../services/comments';
const commentService = new CommentService();
import ArticleService from '../services/articles';
const articleService = new ArticleService();


const CommentRoutes = [
  {
    route: "articles[{integers:indices}].comments[{integers:commentIndices}]",
    get: function(pathSet) {
      let articleIndices = pathSet.indices;
      let commentIndices = pathSet.commentIndices;
      let params = {}; // args[0]

      return articleService.getAll(params).then(function(articles) {
        let results = [];
        articleIndices.forEach((index) => {
          let articleResult = articles[index];

          if (articleResult == null) {
            results.push({
              path: ['articles', index],
              value: $error('no article')
            });
          } else {
            let comments = articleResult.comments;
            commentIndices.forEach(function(commentIndex) {
              let commentId = comments[commentIndex];
              if (commentId === null) {
                results.push({
                  path: ['articles', index, 'comments', commentIndex],
                  value: $error('no comment')
                });
              } else {
                let mongoId = String(commentId);
                let commentRef = $ref(['commentsById', mongoId]);

                let commentResult = {
                  path: ['articles', index, 'comments', commentIndex],
                  value: commentRef
                };
                results.push(commentResult);
              }
            })
          }
        });

        return results;
      });
    }
  },
  {
    route: 'commentsById[{keys}]["_id", "body", "createdAt"]',
    get: (pathSet) => {
      let subSelect = pathSet[2];
      let ids = pathSet[1];
      return Comment.find({
        '_id': {
          $in: ids
        }
      }).then((comments) => {
        let results = [];
        let commentsMap = new Object();

        comments.forEach(function(comment) {
          let id = comment['_id'];
          commentsMap[id] = comment;
        });

        ids.forEach(function(id) {
          subSelect.forEach(function(key) {
            let commentRecord = commentsMap[id];
            if (!commentRecord || !commentRecord[key]) {
              results.push({
                path: ['commentsById', id, key],
                value: $error('no valid property')
              });
            } else {
              results.push({
                path: ['commentsById', id, key],
                value: String(commentRecord[key])
              });
            }
          });
        });

        return results;
      });
    }
  },
  {
       route: 'articles[{integers:indices}].comments.length',
       get: function(pathSet) {
           return articleService.getAll({}).
               then(function(articles) {
                   return pathSet.indices.map(function(index) {
                       var article = articles[index];

                       // If we determine that there is no genre at the index, we must
                       // be specific and return that it is the genre that is not
                       // present and not the name of the genre.
                       if (article == null) {
                           return { path: ["articles", index], value: undefined };
                       }

                       return {
                           path: ['articles', index, 'comments', 'length'],
                           value: article.comments.length
                       };
                   });
               });
       }
   },
  {
    route: 'comments.create',
    call: (callPath, args) => {
      return commentService.create(args[0]).then(function(comment) {
        let results = [{
          path: ['comments', 'commentId'],
          value: String(comment._id)
        }, ];

        return results;
      });
    }
  },
  {
    route: 'comments.delete',
    call: (callPath, args) => {
      return commentService.delete(args[0]).then(function() {
        return [{
          path: ["commentsById", args.id],
          invalidate: true
        }];
      });
    }
  },
];

export default CommentRoutes;
