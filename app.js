/*jslint node: true */
"use strict";

// require('dotenv').config();

var express = require('express');
var app = express();

var cors = require('cors');

app.use(cors());

//var favicon = require('serve-favicon');
var path = require('path');
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var archives = require('./routes/archives');
var articles = require('./routes/articles');
var quickRoutes = require('./routes/quickRoutes');

app.use('/', quickRoutes);
app.use('/archives', archives);
app.use('/articles', articles);

app.get('/', function (req, res) {
	res.send('API: GET /archives/id\n' + 
			'POST /archives/\n' + 
			'GET /validateArchives');
});

app.listen(process.env.PORT || 3000, function () {
	console.log('Plainview listening on port 3000!');
});

module.exports = app;
