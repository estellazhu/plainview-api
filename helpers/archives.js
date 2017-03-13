/*jslint node: true */
"use strict";

var utils = require('../helpers/tools');
var dbTools = require('../helpers/db');
var scraper = require('../helpers/articleScraper');

var shortid = require('shortid');
var webshot = require('webshot');
var fetchUrl = require("fetch").fetchUrl;

var Archive = require('../models/Archive');

function createArchive(data, callback){
	//pipeline for creating a new archive
	data.newArchiveId = data._id;

	try {
		data.url = utils.formatUrl(data.url);
		if (isValidArchiveText(data.text) !== true) {
			data.status = 400;
			data.description = "Invalid archive";
			callback(data); return;
		}
	} catch (err) {
		data.status = 400;
		data.description = "Invalid url";
		callback(data); return;
	}
	if (utils.checkValidId(data.newArchiveId) !== true) { data.newArchiveId = utils.generateIds(1); }
	data.text = utils.formatArchiveText(data.text);

	data.timesTaken = {};
	data.timesTaken.initiated = Date.now();

	data.newArchiveScreenshotFilename = data.newArchiveId + '.png';
	//use a library instead

	Promise.all([
		dbTools.checkForSimilarArchives(data.url, data.text),
		utils.takeTime(takeScreenshot(data.url, data.newArchiveScreenshotFilename, data.mouseX, data.mouseY)),
		utils.takeTime(scraper.getData(data.url)),
		dbTools.checkForSimilarArticles(data.url)
	]).then(function(results){
		try {
			if (results[0].length > 0 && false){
	 			data.archive = results[0][0];
				throw {similarArchiveFound:true};
			} else {
				data.timesTaken.website_scraped = results[2].time;
				data.timesTaken.screenshot_taken = results[1].time;
				data.article = results[2].functionReturn;
				if (data.article.headline.indexOf(data.text) === -1 && data.article.content.indexOf(data.text) === -1){
					throw {status: 400, description: "Could not find text"};
				}
				if (results[3].length === 0 || results[3] === null || results[3] === undefined){
					data.article.id = utils.generateIds(1);
					data.articleId = data.article.id;
					dbTools.uploadArticle(data.article);
				} else if (results[3].length > 0 && results[3].content != data.article.content){
					data.articleId = results[3]._id;
					dbTools.addArticleRevision(results[3]._id, data.article.content);
				} else {
					data.articleId = results[3]._id;
				}
			}
		} catch (err) {
			if (err.similarArchiveFound){
				throw (err);
			} else {
				utils.errorHandler(err);
				if (err.status && err.description) { throw(err); } else {
					throw {status: 500, description: "Internal error"};
				}
			}
		}
	}).then(function(){
		return utils.readFile(data.newArchiveScreenshotFilename);
	}).then(function(pictureData){
		//return utils.takeTime(dbTools.uploadArchiveImage(data.newArchiveId, pictureData));
	}).then(function(times){
		try {
			//data.timesTaken.s3_upload = times.time;
		} catch (err){
			throw {status: 500, description: "Internal error"};
		}
		utils.deleteFile(data.newArchiveScreenshotFilename);
		return dbTools.uploadArchive(data.newArchiveId, data.url, data.text, data.timesTaken, data.articleId);
	}).then(function(newArchive){
		try {
			data.archive = newArchive;
			callback({archive: newArchive, status: 201, description: "OK"});
		} catch (err) {
			utils.errorHandler(err);
			throw {status: 500, description: "Internal error"};
		}
		return;
	}).catch(function(chainBreaker){
		console.log(chainBreaker);
		utils.deleteFile(data.newArchiveScreenshotFilename);
		if (chainBreaker.similarArchiveFound){
			callback({archive: chainBreaker.similarArchiveFound, status: 200, description: "OK"});
			return;
		} else {
			data.status = chainBreaker.status;
			callback(chainBreaker);
			utils.errorHandler(chainBreaker);
			return;
		}
	});
}

function takeScreenshot(url, filename, mouseX, mouseY){
	//takes a screenshot of a webpage and saves it to the file system
	//TODO: Mouse coordinates
	return new Promise(function(resolve,reject){
		var options = {
			shotSize: {
				width: 'all', 
				height: 'all'
			}
		};
		webshot(url, filename, function(err) {
			if (err) { 
				reject({
					status: 500, description: "Internal error", 
					internalDescription: "takeScreenshot: " + url + " " + filename
				}); 
		} else {
				resolve();
			}
		});
	});
}

function getArchiveById(id, callback){
	//gets a archive stored in the db based on an id
	if (shortid.isValid(id) === false){
		utils.errorHandler("Invalid id requested: " + id);
		callback({status: 400, description: "Invalid archive id"});
	} else {
		dbTools.getArchiveById(id)
		.then(function(result){
			callback({status: result.status, description: result.description, archive: result.archive});
			return;
		}).catch(function(err){
			callback({status: err.status, description: err.description});
			utils.errorHandler({status: 500, internalDescription: "getArchiveById: " + id })
		})
	}
}

function validateArchives(archives, callback){
	//checks multiple archives for validity
	//TODO: don't use nested array search
	//make this return a promise
	var pendingArchives = [];
	var validArchives = [];
	var failedArchives = [];
	var pendingArchivesIds = [];
	if (archives === undefined || archives === null) { callback({status: 400, description: "No archives"}); return; }
	archives.forEach(function(archive){
		if (shortid.isValid(archive._id) === false) { failedArchives.push(archive); } else { pendingArchivesIds.push(archive._id); pendingArchives.push(archive); }
	});
	Archive.find({
		'_id': { $in: pendingArchivesIds }
	}, function(err, foundArchives){
		if (err) { utils.errorHandler(err); callback(err); }
		for (var i=0; i<pendingArchives.length; i++){
			for(var j=0; j<foundArchives.length; j++){
				if (pendingArchives[i]._id === foundArchives[j]._id && utils.isSimilarArchivePlainText(pendingArchives[i].text,foundArchives[j].text)){
					validArchives.push(pendingArchives[i]._id);
				}
			}
		}
		failedArchives = failedArchives.concat(pendingArchives);
		callback({status: 200, validArchives: validArchives});
	});
	return;
}

function isValidArchiveText(text){
	return text && utils.countWords(text) >= 2;
}

module.exports = {
	takeScreenshot: takeScreenshot,
	createArchive: createArchive,
	getArchiveById: getArchiveById,
	validateArchives: validateArchives,
};