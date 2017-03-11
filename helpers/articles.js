/*jslint node: true */
"use strict";

var utils = require('../helpers/tools');
var dbTools = require('../helpers/db');
var shortid = require('shortid');

function getArticleById(id, callback){
	//gets a archive stored in the db based on an id
	if (shortid.isValid(id) === false){
		utils.errorHandler("Invalid id requested: " + id);
		callback({status: 400, description: "Invalid archive id"});
	} else {
		dbTools.getArticleById(id)
		.then(function(result){
			callback({status: result.status, description: result.description, article: result.article});
			return;
		}).catch(function(err){
			callback({status: err.status, description: err.description});
			utils.errorHandler({status: 500, internalDescription: "getArticleById: " + id });
		})
	}
}

module.exports = {
	getArticleById: getArticleById
};