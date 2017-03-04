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
		utils.takeTime(checkWebpageForText(data.url, data.text, data.html)),
		utils.takeTime(takeScreenshot(data.url, data.newArchiveScreenshotFilename, data.mouseX, data.mouseY))
	]).then(function(times){
		data.timesTaken.website_checked  = times[1].time;
		data.timesTaken.screenshot_taken = times[2].time;
		if (times[0].length > 0){
 			data.archive = times[0][0];
			throw {similarArchiveFound:true};
		}
	}).then(function(){
		return utils.readFile(data.newArchiveScreenshotFilename);
	}).then(function(pictureData){
		return utils.takeTime(dbTools.uploadArchiveImage(data.newArchiveId, pictureData));
	}).then(function(times){
		data.timesTaken.s3_upload = times.time;
		utils.deleteFile(data.newArchiveScreenshotFilename);
		return dbTools.uploadArchive(data.newArchiveId, data.url, data.text, data.surroundingText, data.timesTaken);
	}).then(function(newArchive){
		data.status = 201;
		data.description = "OK";
		data.archive = newArchive;
		callback(data);
	}).catch(function(chainBreaker){
		utils.deleteFile(data.newArchiveScreenshotFilename);
		if (chainBreaker.similarArchiveFound){
			data.status = 200;
			callback(data);
			return;
		} else {
			data.status = chainBreaker.status;
			callback(chainBreaker);
			utils.errorHandler(chainBreaker);
			return;
		}
	});
}

function checkWebpageForText(url, text){
	//checks a webpage for the archive in html
	return new Promise(function(resolve,reject){
	scraper.getData(url)
		.then(function(data){
			if (data.content.indexOf(text) !== -1){
				resolve();
			} else {
				reject({status: 400, description: "Could not find text"});
			}
		});
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
			if (err) { utils.errorHandler(err); reject({status: 500, description: "Internal error"}); } else {
				resolve();
			}
		});
	});
}

function getArchiveById(id, callback){
	//gets a archive stored in the db based on an id
	if (shortid.isValid(id) === false){
		data = {status: 400, description: "Invalid archive id"};
		utils.errorHandler("Invalid id requested: " + id); callback(data);
	} else {
		dbTools.getArchiveById(id)
		.then(function(result){
			callback({status: result.status, description: result.description, archive: result.archive});
		});
	}
}

function validateArchives(archives, callback){
	//checks multiple archives for validity
	//TODO: don't use nested array search
	//make this return a promise
	var pendingArchives = [];
	var passedArchives = [];
	var failedArchives = [];
	archives.forEach(function(archive){
		if (shortid.isValid(archive._id) === false) { failedArchives.push(archive); } else { pendingArchives.push(archive); }
	});
	Archive.find({
		'_id': { $in: pendingArchives }
	}, function(err, foundArchives){
		if (err) { utils.errorHandler(err); callback(err); }
		for (var i=0; i<pendingArchives.length; i++){
			for(var j=0; j<foundArchives.length; j++){
				if (pendingArchives[i]._id === foundArchives[j]._id && utils.isSimilarArchivePlainText(pendingArchives[i],foundArchives[j].surroundingText)){
					passedArchives.push(pendingArchives[i]);
					pendingArchives.splice(i,1);
				}
			}
		}
		failedArchives = failedArchives.concat(pendingArchives);
	});
	callback({status: 200, failedArchives: failedArchives, passedArchives: passedArchives})
}

function isValidArchiveText(text){
	return text && utils.countWords(text) >= 2;
}

module.exports = {
	takeScreenshot: takeScreenshot,
	checkWebpageForText: checkWebpageForText,
	createArchive: createArchive,
	getArchiveById: getArchiveById,
	validateArchives: validateArchives,
};