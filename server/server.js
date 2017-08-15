var express = require('express'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    falcor = require('falcor'),
    falcorExpress = require('falcor-express'),
    falcorRouter = require('falcor-router'),
    mongoose = require('mongoose'),
    responseTime = require('response-time');

    // Import all models
    import './models/User';
    import './models/Article';
    import './models/Comment';

    import SessionService from './services/session';

    // require('./config/passport');

    import routes from './routes';

    const app = express();

    // This is required by falcor-express middleware to work correctly with falcor-browser
    app.use(bodyParser.json({extended: false}))

    // will allow you to post usernames and passwords to the backend
    app.use(bodyParser.urlencoded({extended: false}));

    const auth = require('./auth');

    app.use('/model.json', auth);


    app.use(responseTime())

    app.use('/model.json', falcorExpress.dataSourceRoute(function(req, res) {

      if (req.payload && req.payload.id) {
        let sessionService = new SessionService();
        sessionService.setCurrentUser(req.payload.id);
      }


      /* res.on('finish', afterResponse);
      res.on('close', afterResponse);

      let startTime = new Date().getTime();

      function afterResponse() {
        let endTime = new Date().getTime();
        console.log('time: ' + (endTime - startTime));
      }*/

      return new falcorRouter(routes);
    }));


    app.use(express.static('.'));

    var mongoURI = 'mongodb://simondegheselle:graphql-falcor@ds121212.mlab.com:21212/graphql-falcor'
    // var mongoURI = 'mongodb://db:27017/conduit'
    var MongoDB = mongoose.connect(mongoURI).connection;
    console.log(mongoURI);

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
