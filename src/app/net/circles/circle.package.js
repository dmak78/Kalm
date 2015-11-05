/**
 * Circle class
 * @class Circle
 * @exports {Circle}
 */

'use strict'

/* Requires ------------------------------------------------------------------*/

var Signal = require('signals');

/* Methods -------------------------------------------------------------------*/

/**
 * Circle constructor
 * @constructor
 * @param {object} options The configuration options for the circle
 */
function Circle(options) {
	this.label = options.label;
	this.list = {};

	this.onAdding = new Signal();
	this.onRemoving = new Signal();
}

/**
 * Select a service from the circle or creates it
 * @method service
 * @memberof Circle
 * @param {string} name The name of the service to search/add 
 * @param {object} options The configuration in case of creation
 * @return {Service} The desired service
 */
Circle.prototype.service = function(name, options, update) {
	var services = K.getComponent('services');
	var service = this.list[name];

	//Perhaps update?
	if (service) {
		if (update) {
			//TODO: no hardcoding, perhaps add origin to services properties
			service.hostname = options.hostname;
			service.port = options.port;
		}
		return service;
	}

	if (!options) return null;

	this.add(services.create(name, options));
	return this.service(name);
};

/**
 * Adds a service to the circle
 * @method add
 * @memberof Circle 
 * @param {Service} service The service to add
 * @return {Circle} Self reference
 */
Circle.prototype.add = function(service) {
	this.list[service.label] = service;
	this.onAdding.dispatch(service);
	return this;
};

/**
 * Removes a service from the circle
 * @method remove
 * @memberof Circle 
 * @param {Service} service The service to remove
 * @return {Circle} Self reference
 */
Circle.prototype.remove = function(service) {
	if (service.label || service in this.list) {
		delete this.list[service];
		this.onAdding.dispatch(service);
	}
	return this;
};

/* Exports -------------------------------------------------------------------*/

module.exports = Circle;