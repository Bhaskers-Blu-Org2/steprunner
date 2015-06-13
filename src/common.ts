/// <reference path="./definitions/Q.d.ts" />
import Q = require('q');

var current = Q(null);
exports.execAll = function(func, items, state) {
	var initialState = state;

	items.forEach((item) => {
		current = current.then(function(state) {
			return func(item, state || initialState);
		});	
	});

	return current;
}