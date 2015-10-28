/**
 * Connection class
 * This is the regroupement of all the i/o adapters.
 */

/* Requires ------------------------------------------------------------------*/

/* Local variables -----------------------------------------------------------*/

var callWrapper = {
	origin: {
		hostname: '0.0.0.0',
		port: 80,
		keepAlive: true
	},
	metadata: {
		serviceId: '',
		name: '',
		id: ''
	}
};

/* Methods -------------------------------------------------------------------*/

/**
 *
 */
function loadAdapter(adapter, path, callback) {
	var routes = K.getComponent('routes');

	this.adapters[adapter.name] = adapter;
	if (adapter.autoload || routes.has(adapter.name)) {
		adapter.listen(callback);
	}
	else callback();
}

function main(callback) {
	var utils = K.getComponent('utils');
	var cl = K.getComponent('console');
	var manifest = K.getComponent('manifest');

	cl.log(' - Initializing connections class');
	utils.loader.load('./', '.adapter.js', loadAdapter.bind(this), callback);

	callWrapper.metadata.id = manifest.id;
	callWrapper.metadata.name = K.pkg.name;
}

function createClient(service) {
	if (!service.adapter in this.adapters) {
		return callback('Unknown type "' + service.adapter + '"');
	}

	return this.adapters[service.adapter].createClient(service);
}

function send(service, payload, socket, callback) {
	var config = K.getComponent('config');
	var system = K.getComponent('system');

	if (!service.adapter in this.adapters) {
		return callback('Unknown type "' + service.adapter + '"');
	}

	callWrapper.origin.hostname = system.location;
	callWrapper.origin.port = config.connections[service.adapter].port;
	callWrapper.origin.keepAlive = service.keepAlive;
	callWrapper.metadata.serviceId = service.label;
	callWrapper.payload = payload;

	console.log(callWrapper);

	this.adapters[service.adapter].send(service, callWrapper, socket, callback);
}

function handleRequest(req) {
	console.log('got request from service ' + req.metadata.serviceId);
	var circles = K.getComponent('circles');
	circles.find('global')
		.service(req.metadata.serviceId, req.origin, true)
		.onRequest.dispatch(req);
}

/* Exports -------------------------------------------------------------------*/

module.exports = {
	pkgName: 'connection',
	attributes: {
		adapters: []
	},
	methods: {
		_init: main,
		load: loadAdapter,
		createClient: createClient,
		handleRequest: handleRequest,
		send: send
	}
};