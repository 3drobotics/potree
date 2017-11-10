const GLQueries = require('./webgl/GLQueries');

function Potree () {}

const context = require('./context');
Potree.version = context.version;

console.log('Potree ' + context.version.major + '.' + context.version.minor + context.version.suffix);
console.log('UPDATED VERSION');

Potree.webgl = {
	shaders: {},
	vaos: {},
	vbos: {}
};

Potree.scriptPath = context.scriptPath;
Potree.resourcePath = context.resourcePath;

function legacyGL () {
	return window.viewer.renderer.getContext();
};

Potree.startQuery = function (name, gl) {
	return GLQueries.forGL(gl || legacyGL()).start(name);
};

Potree.endQuery = function (query, gl) {
	return GLQueries.forGL(gl || legacyGL()).end();
};

Potree.resolveQueries = function (gl) {
	return GLQueries.forGL(gl || legacyGL()).resolve();
};

Potree.POCLoader = require('./loader/POCLoader');
Potree.PointSizeType = require('./materials/PointSizeType');
Potree.PointShape = require('./materials/PointShape');
Potree.Viewer = require('./viewer/Viewer');
Potree.loadPointCloud = require('./utils/loadPointCloud');

module.exports = Potree;
