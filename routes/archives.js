/*jslint node: true */
"use strict";

var archiveTools = require('../helpers/archives');
var articleTools = require('../helpers/articles');
var responseHandler = require('../helpers/responseHandler');

var express = require('express'),
	router = express.Router();

var Bottleneck = require('bottleneck');
var newArchiveLimiter = new Bottleneck(1, 1);

router.get('/:archive_id', function(req,res){
	//gets a archive with the associated id
	archiveTools.getArchiveById(req.params.archive_id, function(data){
		responseHandler.handleResponse(data, res);
	});
});

router.get('/a/:archive_id', function(req,res){
	archiveTools.getArchiveById(req.params.archive_id, function(archiveResult){
		articleTools.getArticleById(archiveResult.archive.article, function(articleResult){
			console.log(articleResult);
			responseHandler.handleResponse({archive: archiveResult, article: articleResult}, res);
		});
	});
});


router.post('/', function(req,res){
	//posts a new archive
	archiveTools.createArchive(req.body, function(data){
		responseHandler.handleResponse(data, res);
	});

});

module.exports = router;
