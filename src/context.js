const LRU = require('./LRU');

let scriptPath = null;
if (document.currentScript.src) {
	scriptPath = new URL(document.currentScript.src + '/..').href;
	if (scriptPath.slice(-1) === '/') {
		scriptPath = scriptPath.slice(0, -1);
	}
} else {
	console.error('Potree was unable to find its script path using document.currentScript. Is Potree included with a script tag? Does your browser support this function?');
}

let LRUInstance = null;

module.exports = {
	version: {
		major: 1,
		minor: 5,
		suffix: 'RC'
	},
	framenumber: 0,
	pointBudget: 1 * 1000 * 1000,
	scriptPath: scriptPath,
	resourcePath: scriptPath + '/resources',
	getLRU: function () {
		if (LRUInstance === null) {
			LRUInstance = new LRU();
		}

		return LRUInstance;
	}
};
