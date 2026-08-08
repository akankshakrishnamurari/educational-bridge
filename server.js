import path from 'path';
import fs from 'fs';
import React from 'react';
import express from 'express';
import {StaticRouter} from 'react-router-dom/server';
import 'babel-polyfill';
import App from './src/App';
import {Helmet} from 'react-helmet';
import ReactDOMServer from 'react-dom/server';
import { createStore } from 'redux';
import configureStore from './src/store/store';
import { Provider } from 'react-redux';
import { MatchedRoute, matchRoutes } from 'react-router-config';
import route from './src/route';
import rootReducer from './src/store/reducers/rootReducer';

const context = {};
const app = express();
const port = process.env.PORT || 5000;

let cors = require("cors");
app.use(cors());


app.get('/question/view', function(request, response) {
  const store = createStore(rootReducer);
  let promises = [];
  matchRoutes(route, request.path).forEach(({route}) =>{
    if(route.loadData){
      let promedDataResponseReceived = route.loadData(store, request.path, request.query);
      promises.push(promedDataResponseReceived);
    }
  });
  Promise.all(promises).then(() => {
    const app =  ReactDOMServer.renderToString(
      <Provider store = {store}>
        <StaticRouter location={request.url}>
          <App />
        </StaticRouter>
      </Provider>);
    const indexFile = path.resolve('./build/index.html');
  
  
    fs.readFile(indexFile, 'utf8', (err, data) => {
      if (err) {
        console.error('Something went wrong:', err);
        return response.status(500).send('Oops, better luck next time!');
      }
      const helmet = Helmet.renderStatic();
      return response.send(
          data.replace('<div id="root"></div>', `<div id="root"><div>Hello</div>${app}</div>`)
          .replace("</head>", `${helmet.meta.toString()}</head>`)
          .replace("</head>", `${helmet.title.toString()}</head>`)
          .replace("</head>", `${helmet.script.toString()}</head>`)
        );
    });
  })
});

app.get('/', function(request, response) {
  renderGeneralPage(request, response);
});

app.get('/question/upsert', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/questions', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/channels', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/papers', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/paper/new', function(request, response) {
  renderGeneralPage(request, response);
});

app.get('/paper/view', function(request, response) {
  renderGeneralPage(request, response);
});

app.get('/paper/submission/view', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/channels', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/question/view', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/question/submission/view', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/tags/new', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/channel/new', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/papers/instances/me', function(request, response) {
  renderGeneralPage(request, response);
});
app.get('/questions/instances/me', function(request, response) {
  renderGeneralPage(request, response);
});


function renderGeneralPage(request, response) {
  const store = createStore(rootReducer);
  const app =  ReactDOMServer.renderToString(
    <Provider store = {store}>
      <StaticRouter location={request.url}>
        <App />
      </StaticRouter>
    </Provider>);
  const indexFile = path.resolve('./build/index.html');


  fs.readFile(indexFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Something went wrong:', err);
      return response.status(500).send('Oops, better luck next time!');
    }
    return response.send(
        data.replace('<div id="root"></div>', `<div id="root"><div>Hello</div>${app}</div>`)
      );
  });
}

app.use(express.static(path.resolve(__dirname, './build')));

app.listen(port, () => console.log(`Listening on port ${port}`));