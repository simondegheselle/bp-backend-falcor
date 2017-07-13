import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import falcor from 'falcor';
import falcorExpress from 'falcor-express';
import falcorRouter from 'falcor-router';
import routes from './routes.js';

const app = express();

// This is required by falcor-express middleware to work correctly with falcor-browser
app.use(bodyParser.json({extended: false}))

// will allow you to post usernames and passwords to the backend
app.use(bodyParser.urlencoded({extended: false}));

app.use('/model.json', falcorExpress.dataSourceRoute(function(req, res) {
  return new falcorRouter(routes);
}));

app.use(express.static('.'));

let falcorServer = app.listen(9090, function(err) {
  if(err) {
    console.error(err);
    return;
  }
  console.log('Server is listening, navigate to http://localhost:9090');
});

export default app;
