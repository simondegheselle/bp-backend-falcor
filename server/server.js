var express = require('express'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    falcor = require('falcor'),
    falcorExpress = require('falcor-express'),
    falcorRouter = require('falcor-router'),
    mongoose = require('mongoose'),
    responseTime = require('response-time');

    // Import all mongoose models
    require('./models/User');
    require('./models/Article');
    require('./models/Comment');

    const SessionService = require('./services/session');
    const routes = require('./routes');
    const auth = require('./auth');

    const app = express();

    // This is required by falcor-express middleware to work correctly with falcor-browser
    app.use(bodyParser.json({extended: false}))

    // will allow you to post usernames and passwords to the backend
    app.use(bodyParser.urlencoded({extended: false}));

    app.use('/model.json', auth);

    // This module calculates the server latency
    app.use(responseTime());

    app.use('/model.json', falcorExpress.dataSourceRoute(function(req, res) {

      if (req.payload && req.payload.id) {
        let sessionService = new SessionService();
        sessionService.setCurrentUser(req.payload.id);
      }

      return new falcorRouter(routes);
    }));


    app.use(express.static('.'));

    var mongoURI = 'mongodb://simondegheselle:graphql-falcor@ds121212.mlab.com:21212/graphql-falcor'
    var MongoDB = mongoose.connect(mongoURI).connection;

    MongoDB.on('error', function(err) { console.log(err.message); });
    MongoDB.once('open', function() {
      console.log("mongodb connection open");
    });

    let PORT = process.env.PORT || 3001;

    let falcorServer = app.listen(PORT, function(err) {
      if(err) {
        console.error(err);
        return;
      }
      console.log('Server is listening, navigate to http://localhost:9090');
    });
