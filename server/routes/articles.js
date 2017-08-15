var mongoose = require('mongoose');
const Article = mongoose.model('Article');
var Promise = require('promise');

var jsonGraph = require('falcor-json-graph');

var $ref = jsonGraph.ref;
var $error = jsonGraph.error;


import ArticleService from '../services/articles';
const articleService = new ArticleService();

const ArticleRoutes = [{
    route: 'article',
    get: (pathSet, args) => {
      const {
        slug
      } = args[0];
      return articleService.getArticleBySlug(slug).then(function(article) {
        if (!article) {
          return {
            path: ['error'],
            value: 'No article found'
          };
        }

        let mongoId = String(article._id);
        let articleRef = $ref(['articlesById', mongoId]);

        return {
          path: ['article'],
          value: articleRef
        };
      });
    }
  },
  {
    route: 'articles[{integers}]',
    get: (pathSet) => {
      let articlesIndex = pathSet[1];
      let params = {};

      return articleService.getAll(params).then(function(articles) {
        let results = [];

        articlesIndex.forEach((index) => {
          let mongoId = String(articles[index]['_id']);
          let articleRef = $ref(['articlesById', mongoId]);

          let articleResult = {
            path: ['articles', index],
            value: articleRef
          };

          results.push(articleResult);
        });

        return results;
      });
    }
  },
  {
    route: "articlesById[{keys}]['title', 'description', 'body', 'comments']",
    get: function(pathSet) {
      let subSelect = pathSet[2];
      let ids = pathSet[1];
      return Article.find({
        '_id': {
          $in: ids
        }
      }).then((articles) => {
        let results = [];

        let articleMap = new Object();

        articles.forEach(function(article) {
          let id = article['_id'];
          articleMap[id] = article;
        });

        ids.forEach(function(id) {
          subSelect.forEach(function(key) {
            let articleRecord = articleMap[id];
            if (!articleRecord  ||  !articleRecord[key]) {
              results.push({
                path: ['articlesById', id, key],
                value: $error('propery not found')
              });
            } else {
              results.push({
                path: ['articlesById', id, key],
                value: articleRecord[key]
              });
            }
          });
        });

        return results;
      });
    }
  },
  {
    route: 'articles.create',
    call: (callPath, args) => {
      return articleService.create(args[0]).then(function(article) {
        let results = [{
          path: ['articles', 'articleId'],
          value: String(article._id)
        }, ];

        return results;
      });
    }
  },
  {
    route: 'articles.delete',
    call: (callPath, args) => {
      let articleToDeleteId = args[0].id;
      return articleService.delete(articleToDeleteId).then((res) => {
        return [{
          path: ["articlesById", articleToDeleteId],
          invalidate: true
        }]
      });
    }
  },
  {
    route: 'articles.update',
    call: (callPath, args) => {
      return articleService.update(args[0]).then((res) => {
        return [{
          path: ["articlesById", res._id],
          value: res
        }];
      });
    }
  },
];

export default ArticleRoutes;
