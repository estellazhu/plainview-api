/*jslint node: true */
"use strict";

var archiveTools = require('../helpers/archives');
var responseHandler = require('../helpers/responseHandler');
var utils = require('../helpers/tools');

var express = require('express'),
	router = express.Router();

router.get('/checkArchives', function(req, res){
	//checks whether archives match in the db
	archiveTools.validateArchives(req.archives, function(data){
		responseHandler.handleResponse(data, res);
	});
});

module.exports = router;