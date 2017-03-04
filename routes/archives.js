/*jslint node: true */
"use strict";

var archiveTools = require('../helpers/archives');
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


router.post('/', function(req,res){
	//posts a new archive
	archiveTools.createArchive(req.body, function(data){
		responseHandler.handleResponse(data, res);
	});

});

module.exports = router;