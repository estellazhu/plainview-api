/*jslint node: true */
"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');

module.exports = mongoose.model('Article', new Schema({
	_id: {
		type: String,
		'default': shortid.generate
	},
	domain: String,
	url: String,
	text: [String],
	authors: [String],
	date_posted: String
}));