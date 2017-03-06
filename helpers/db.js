/*jslint node: true */
"use strict";

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var config = require('../config');

var utils = require('../helpers/tools');

var aws = require('aws-sdk');
	aws.config.update({accessKeyId: config.AWS_ACCESS_KEY, secretAccessKey: config.AWS_SECRET_KEY});
var s3 = new aws.S3();

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(config.MLAB_DB_CONNECTION, function(err){
	if (err) { utils.errorHandler(err); }
});

var Archive = require('../models/Archive');
var Article = require('../models/Article');

function uploadArchiveImage(id, pictureData) {
	//saves an image to the current image database
	// return dbFunctions[config.CURRENT_IMAGE_DB](id, pictureData);
	return new Promise(function(resolve, reject){
		s3.putObject({
			ACL: 'public-read',
			Bucket: config.S3_BUCKET,
			Key: id,
			Body: pictureData,
			ContentType: "image/png"
		}, function(err) {
			if (err) { utils.errorHandler(err); }
			if (err) { reject({status: 500, description: "Internal error"}); } else {
				resolve(null);
			}
		}); 
	});
}

function uploadArchive(id, url, text, timesTaken, articleId){
	//saves a archive to the current database
	//return dbFunctions["postArchiveToMongoDb"+config.CURRENT_DB](id, url, text, timesTaken);
	return new Promise(function(resolve, reject){
		new Archive({
			_id: id,
			url: url,
			text: text,
			screenshot_url: config.AWS_S3_URL + id,
			created_by: "Daniel",
			times: timesTaken,
			article: articleId
		}).save(function(err, newArchive){
			if (err) { console.log(err); reject({status: 500, description: "Internal error"}); } else {
				resolve(newArchive);
			}
		});
	});
}

function uploadArticle(id, url, text, author, date){
	return new Promise(function(resolve, reject){
		new Article({
			_id: id,
			url: url,
			text: text,
			author: author,
			date: date,
		}).save(function(err, newArticle){
			if (err) { console.log(err); reject({status: 500, description: "Internal error"}); } else {
				console.log(newArticle);
				resolve(newArticle);
			}
		});
	});
}

function addArticleRevision(id, text){
	return new Promise(function(resolve, reject){
		Article.findByIdAndUpdate(id,
		{$push: {'text': text}},
		{safe: true, upsert: true}, function(err){
			if (err) {
				utils.errorHandler(err);
				reject({status: 500, description: "Internal error"});
			} else {
				resolve();
			}
		});
	});
}

function getArchiveById(id){
	//saves a archive to the current database
	//return db Functions["getArchiveByIdFromMongoDb"+config.CURRENT_DB](id);
	return new Promise(function(resolve, reject) {
		Archive.findById(id, function (err, found) {
			if (err) {
				utils.errorHandler(err); reject({status: 500, description: "Internal error"}); return;
			} else if (found === null){
				utils.errorHandler("Could not find archive requested: " + id); 
				resolve({status: 404, description: "Could not find archive with id."});
			} else {
				resolve({status: 200, description: "OK", archive: found});
			}
		});
	});
}

function checkForSimilarArticles(url){
	//saves a archive to the current database
	//return dbFunctions["checkForSimilarArchivesFromMongoDb"+config.CURRENT_DB](url, text);
	return new Promise(function(resolve, reject){
		Article.find(
			{'url': url},
			function(err, foundArticles){
				if (err) { utils.errorHandler(err); reject(err); }
				resolve(foundArticles);
			}
		);
	});
}


function checkForSimilarArchives(url, text){
	//saves a archive to the current database
	//return dbFunctions["checkForSimilarArchivesFromMongoDb"+config.CURRENT_DB](url, text);
	return new Promise(function(resolve, reject){
		Archive.find(
			{$and: [
				{'url': url},
				{"text" : text}
			]}, 
			function(err, foundArchives){
				if (err) { utils.errorHandler(err); reject(err); }
				resolve(foundArchives);
			}
		);
	});
}

module.exports = {
	uploadArchiveImage: uploadArchiveImage,
	uploadArchive: uploadArchive,
	uploadArticle: uploadArticle,
	getArchiveById: getArchiveById,
	checkForSimilarArchives: checkForSimilarArchives,
	addArticleRevision: addArticleRevision,
	checkForSimilarArticles: checkForSimilarArticles
};