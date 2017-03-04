/*jslint node: true */
"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.SchemaTypes.ObjectId;
var shortid = require('shortid');

module.exports = mongoose.model('Archive', new Schema({
	_id: {
		type: String,
		'default': shortid.generate
	},
	domain: String,
	url: String,
	text: String,
	surroundingText: String,
	screenshot_url: String,
	times: {
		initiated: {type: Date},
		website_checked: Number,
		screenshot_taken: Number,
		s3_upload: Number,
		db_saved: Number,
		finalized: {type: Date, default: Date.now}
	}
}));