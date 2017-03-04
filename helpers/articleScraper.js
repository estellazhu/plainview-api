/*jslint node: true */
"use strict";

var noodle = require('noodlejs');
var fs = require('fs');
var path = require('path');

var utils = require('./tools');

var getData = function(url){
	return new Promise(function(resolve){
		var content = {};
		var jsonToReturn = {};
		var domainTags;

		var domain = utils.getDomain(url);		
		fs.readFile(path.join(__dirname, "./newspapers/" + domain + ".json"), 'utf8', function (err, data) {
			if (err) throw err;
			domainTags = JSON.parse(data);
			scrape(url, domainTags[domain].tagsRetrieval, 0, content)
				.then(function(content){
					for (var property in content) {
						if (content.hasOwnProperty(property)) {
							jsonToReturn[property] = content[property][0].results.toString();
						}
					}
					resolve(jsonToReturn);
				});
		});
	});
};

function scrape(url, tagInfo, index, content){
		return new Promise(function(resolve){
			noodle.query({
				url: url,
				selector: tagInfo[index].tag,
				type: 'html',
				extract: 'text'
			}).then(function(data){
				content[tagInfo[index].fieldName] = data.results;
				if (tagInfo.length > index+1){
					scrape(url, tagInfo, index+1, content)
						.then(function(content){
							resolve(content);
						});
				} else {
					resolve(content);
				}
			}).catch(function(err){
				utils.errorHandler(err);
				if (tagInfo.length > index+1){
					scrape(url, tagInfo, index+1, content)
						.then(function(content){
							resolve(content);
						});
				} else {
					resolve();
				}
			});
		});
}

module.exports = {
	getData: getData
};