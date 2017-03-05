/*jslint node: true */
"use strict";

const genericStatusCodeDescriptions = {
	200: "OK",
	201: "Created",
	300: "Multiple choices",
	301: "Moved Permenantly",
	302: "Found",
	307: "Temporary Redirect",
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	500: "Internal Server Error",
};

var handleResponse = function(data, res){
	if (data.description === undefined){
		data.description = genericStatusCodeDescriptions[data.status];
	}
	if (data.status >= 400) {
		res.status(data.status).json({description:data.description});
	} else if (data.status == 301) {
		res.redirect(data.redirect);
	} else {
		if (data.archive){
			res.status(data.status).json(data.archive);
		}
	}
};

module.exports = {
	handleResponse: handleResponse
};