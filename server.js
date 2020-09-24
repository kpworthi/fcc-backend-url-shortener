'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParse = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
process.env.MONGO_URI='mongodb+srv://<user>:<password>@cluster0.d0zls.mongodb.net/my-first-mongo?retryWrites=true&w=majority'
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParse())

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

//schema and model
var urlSchema = new mongoose.Schema({
  urlIn: {type: String, required: true},
  urlOut: {type: String, required: true}
});
var URLShort = mongoose.model('URLShort', urlSchema);

//creating the sorturl
app.post("/api/shorturl/new", shorten);

function shorten(req, res, next){
  let body = req.body;
  let entries;
  console.log("Received 'shorten' request: ");
  console.log(body);

  if(!body.url.toLowerCase().startsWith("http://")
     && !body.url.toLowerCase().startsWith("https://"))
    return res.json({"error": "invalid URL"});

  let host = body.url.split("//")[1].split("/")[0];

  dns.lookup(host, function(err, addresses){
    if (err) {
      console.log("Error: " + body.url);
      console.log(err);
      return res.json({"error": "invalid host name"});
    }
    else
    URLShort.estimatedDocumentCount((err, count) => {
      entries = count;
      let addEntry = new URLShort({
        urlIn: body.url,
        urlOut: entries+1
      });

      addEntry.save(function (err, entry) {
        if (err) return handleError(err);
      });

      res.json({"url": `https://fcc-backend-url-shortener.kpworthi.repl.co/api/shorturl/${entries+1}`});
    });
  });
}

//fetching the shorturl
app.get("/api/shorturl/:short", redirect);

function redirect(req, res, next){
  let input = req.params.short;
  let output;
  console.log("Received 'fetch' request: ");
  console.log(input);

  URLShort.findOne({"urlOut": input}, function(err, record){
    if (err) res.json({"error": "No such short url."});
    res.redirect(record.urlIn);
  })
}


app.listen(port, function () {
  console.log('Node.js listening ...');
});
