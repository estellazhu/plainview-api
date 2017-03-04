/*jslint node: true */
"use strict";

var fs = require('fs');
var winston = require('winston');
var validUrl = require('valid-url');
var shortid = require('shortid');

winston.add(winston.transports.File, { filename: 'dev.log' });

function readFile(filename){
	//reads a file from the file structure and stores it in a variable
	return new Promise(function(resolve,reject){
		if (filename === null) { reject({status: 500, description: "Internal error"}); }
		fs.readFile(filename, function(err, picturedata){
			if (err) { reject({status: 500, description: "Internal error"}); } else {
				resolve(picturedata);
			}
		}) ;
	});
}

function stripHTML(html){
	return html.replace(/<(?:.|\n)*?>/gm, '');
}

function removeSpacesFromString(html){
	return html.replace(/\s/g,'');
}

function deleteFile(filename){
	//deletes a file from the file structure
	return new Promise(function(resolve, reject){
		if (filename === null) { reject({status: 500, description: "Internal error"}); }
		if (fs.existsSync(filename)) { fs.unlink(filename); }
		resolve();
	});
}

function formatUrl(url){
	//returns a valid formatted url
	if (validUrl.is_web_uri(url) === undefined) {
		try {
			url = attemptCreateValidUrl(url);   
		} catch (err) {
			throw new Error("Not a valid url.");
		}
	}
	return url;
}

function getDomain(url) {
	var startOfDomain;
	var endOfDomain;
	if (url.indexOf("www") !== -1) {
		startOfDomain = url.indexOf(".") + 1;
	} else {
		startOfDomain = url.indexOf("/") + 2;
	}
	endOfDomain = url.indexOf(".", startOfDomain);
	return url.substring(startOfDomain, endOfDomain);
}

function countWords(s){
	s = s.replace(/(^\s*)|(\s*$)/gi,"");
	s = s.replace(/[ ]{2,}/gi," ");
	s = s.replace(/\n /,"\n");
	return s.split(' ').length; 
}

function generateIds(n){
	if (n == 1) { return shortid.generate(); }
	var newIds = [];
	for (var i=0; i<n; i++) { newIds.push(shortid.generate()); }
	return newIds;
}

function checkValidId(id){
	return shortid.isValid(id);
}

function formatArchiveText(text){
	text = text.trim();
	return text;
}

function attemptCreateValidUrl(url){
	//attempts to create a valid url from an invalid one
	throw new Error("Not a valid url.");
}

function takeTime(fn){
	return new Promise(function(resolve, reject){
		var start = Date.now();
		fn.then(function(result){
			var end = Date.now();
			resolve({functionReturn: result, time: end-start});
		}, function(err){
			reject(err);
		});
	});
}

function isSimilarArchivePlainText(newText, savedText){
	//checks to see if two texts pass the threshold for similarity
	//TODO: Trailing whitespaces, punctuations
	//      Account for content type (tweet, article, etc.)
	//      No extra characters, useless words, etc.
	if (newText === savedText){
		return {type: "identical"};
	} else if (newText.length > savedText.length) {
		return {type: "original"};
	} else if (newText.length < savedText.length) {
		if (savedText.includes(newText)){
			return {type: "archive"};
		} else {
			return {type: "original"};
		}
	}
}

function errorHandler(error){
	console.log(error);
	//winston.log('error', error);
}

function getSurroundingString(bigStr, subStr, word_buffer) {
	// Check if bigStr contains subStr
	if (bigStr.search(subStr) == -1) {
		return subStr;
	}
	// Get the start and end indexes of subStr
	var start = bigStr.indexOf(subStr);
	var end = start + subStr.length - 1;

	function charBufferStart(start) {
		var count = 0; // count occurrences of space before subStr
		var ocr = bigStr.lastIndexOf(" ", start); // check occurences
		var idx;
		while (count < word_buffer + 1 && ocr !== -1) {
			count++;
			idx = ocr; // save the index of the furthest space needed before subStr if applicable
			ocr = bigStr.lastIndexOf(" ", ocr - 1);
		}
		var newStart;
		if (count < word_buffer + 1) {
			newStart = 0; // when there are fewer than expected buffer words before subStr
		} else {
			newStart = idx + 1; // when there are enough buffer words before subStr
		}
		return newStart;
	}

	function charBufferEnd(end) {
		var count = 0; // count occurrences of space after subStr
		var ocr = bigStr.indexOf(" ", end); // check occurences
		var idx;
		while (count < word_buffer + 1 && ocr !== -1) {
			count++;
			idx = ocr; // save the index of the furthest space needed after subStr if applicable
			ocr = bigStr.indexOf(" ", ocr + 1);
		}
		var newEnd;
		if (count < word_buffer + 1) {
			newEnd = bigStr.length - 1; // when there are fewer buffer words after subStr
		} else {
			newEnd = idx - 1; // when there are enough buffer words after subStr
		}
		return newEnd;
	}

	var newStart = charBufferStart(start);
	var newEnd = charBufferEnd(end);
	var bufferedStr = bigStr.slice(newStart, newEnd + 1);
	return bufferedStr;
}


module.exports = {
	readFile: readFile,
	deleteFile: deleteFile,
	errorHandler: errorHandler,
	formatUrl: formatUrl,
	takeTime: takeTime,
	countWords: countWords,
	generateIds: generateIds,
	checkValidId: checkValidId,
	removeSpacesFromString: removeSpacesFromString,
	formatArchiveText: formatArchiveText,
	isSimilarArchivePlainText: isSimilarArchivePlainText,
	stripHTML: stripHTML,
	getSurroundingString: getSurroundingString,
	getDomain: getDomain
};