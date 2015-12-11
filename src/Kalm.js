/**
 * Kalm App singleton
 * Reference to this class will be available accross the components as 
 * this.parent
 * @exports {Kalm}
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

var loader = require('./app/boot/loader');
var configure = require('./app/boot/configure');
var Signal = require('signals');

/* Methods -------------------------------------------------------------------*/

/**
 * Kalm framework constructor
 * @constructor
 * @param {object} pkg The package file for the Kalm distribution
 * @param {object} config The app config of the Kalm project
 */
function Kalm(pkg, config) {
	var _self = this;

	this.pkg = pkg;
	this.appConf = config;
	this.config = {
		environment: 'dev',
		mock: false,
		debug: { noColor: false },
		connections: {
			ipc: {
				port: 4001,
				evt: 'message',
				path: '/tmp/socket-'
			}
		}
	};
	this.components = {};

	this.onReady = new Signal();
	this.onShutdown = new Signal();

	process.on('SIGINT', this.terminate.bind(this));
	process.on('SIGTERM', this.terminate.bind(this));

	process.on('uncaughtException', cl.error.bind(cl));

	loader.load(
		__dirname, 
		'.class.js', 
		this.registerComponent.bind(this), 
		function boot() {
			configure.call(_self, _self);
		}
	);
}

/**
 * Registers a component with Kalm
 * This makes it available accross the project
 * @method registerComponent
 * @memberof Kalm
 * @param {object} pkg The component package to register (component definition)
 * @param {string|null} path The path where the package was found (debug)
 * @param {function} callback The callback method
 */
Kalm.prototype.registerComponent = function(pkg, path, callback) {
	var p;

	if (!pkg.pkgName) {
		process.stdErr('No pkg name! ' + path);
		return false;
	}

	if (this._components[pkg.pkgName]) {
		if (callback) return callback();
	}
	
	p = pkg.attributes || {};

	p.getComponent = this.getComponent.bind(this);
	p.__offSwitch = this.onShutdown;

	if (pkg.methods) {
		Object.keys(pkg.methods).forEach(function(e) {
			if (pkg.methods[e].bind) {
				p[e] = pkg.methods[e].bind(p);
			}
			else {
				process.stdErr(e + 'is not a method in ' + pkg.pkgName);
			}
		});
	}

	this._components[pkg.pkgName] = p;

	if (this._components[pkg.pkgName]._init) {
		this.moduleInits.push(this._components[pkg.pkgName]._init);
	}

	if (callback) callback();
};

/**
 * Handles app termination
 * @method terminate
 * @param {function} callback The callback method
 */
function terminate() {
	var connection = this.getComponent('connection');
	var cl = this.getComponent('console');
	var utils = this.getComponent('utils');

	cl.print('\r  ');
	cl.warn('Shutting down...');

	this.__offSwitch.dispatch();

	utils.async.all(
		Object.keys(connection.adapters).map(function(e){
			return connection.adapters[e].stop;
		}),
		_kill
	);

	//Just in case something goes bad
	setTimeout(_kill, 1500);
}

/**
 * Force-kills the process
 * @private
 * @method _kill
 */ 
function _kill() {
	process.exit();
}

/* Exports -------------------------------------------------------------------*/

module.exports = Kalm;