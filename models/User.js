/* eslint-env node */

var Snapshot = require('./Snapshot');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.SchemaTypes.ObjectId;

module.exports = mongoose.model('User', new Schema({
	username: String,
	email: String,
	age: Number,
	gender: String,
	browser_for_signup: String,
	browsers_used: [String],
	snapshots: [{type: ObjectId, ref: Snapshot}],
}));