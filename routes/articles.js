/*jslint node: true */
"use strict";

var articleTools = require('../helpers/articles');
var responseHandler = require('../helpers/responseHandler');

var express = require('express'),
	router = express.Router();

router.get('/:article_id', function(req,res){
	//gets a archive with the associated id
	articleTools.getArticleById(req.params.article_id, function(data){
		responseHandler.handleResponse(data, res);
	});
});

module.exports = router;