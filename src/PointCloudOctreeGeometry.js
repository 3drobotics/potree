
var nodesLoadTimes = {};

Potree.PointCloudOctreeGeometry = function(){
	Potree.PointCloudOctree.lru = Potree.PointCloudOctree.lru || new LRU();

	this.url = null;
	this.octreeDir = null;
	this.spacing = 0;
	this.boundingBox = null;
	this.root = null;
	this.numNodesLoading = 0;
	this.nodes = null;
	this.pointAttributes = null;
}

Potree.PointCloudOctreeGeometryNode = function(name, pcoGeometry, boundingBox){
	this.name = name;
	this.index = parseInt(name.charAt(name.length-1));
	this.pcoGeometry = pcoGeometry;
	this.boundingBox = boundingBox;
	this.children = {};
	this.numPoints = 0;
	this.level = null;
	
}

Potree.PointCloudOctreeGeometryNode.prototype.addChild = function(child){
	this.children[child.index] = child;
	child.parent = this;
}

Potree.PointCloudOctreeGeometryNode.prototype.load = function(){
	if(this.loading === true || this.pcoGeometry.numNodesLoading > 5){
		return;
	}else{
		this.loading = true;
	}
	
	if(Potree.PointCloudOctree.lru.numPoints + this.numPoints >= Potree.pointLoadLimit){
		Potree.PointCloudOctree.disposeLeastRecentlyUsed(this.numPoints);
	}
	
	
	this.pcoGeometry.numNodesLoading++;
	var pointAttributes = this.pcoGeometry.pointAttributes;
	if(pointAttributes === "LAS" || pointAttributes === "LAZ"){
		// load las or laz node files
		
		var url = this.pcoGeometry.octreeDir + "/" + this.name + "." + pointAttributes.toLowerCase();
		nodesLoadTimes[url] = {};
		nodesLoadTimes[url].start = new Date().getTime();
		LasLazLoader.load(url, new Potree.LasLazBatcher(this, url));
	}else {
		// load binary node files
		
		var url = this.pcoGeometry.octreeDir + "/" + this.name;
		nodesLoadTimes[url] = {};
		nodesLoadTimes[url].start = new Date().getTime();
		var callback = function(node, buffer){
			var geometry = new THREE.BufferGeometry();
			var numPoints = buffer.byteLength / 16;
			
			var positions = new Float32Array(numPoints*3);
			var colors = new Float32Array(numPoints*3);
			var color = new THREE.Color();
			
			var fView = new Float32Array(buffer);
			var uiView = new Uint8Array(buffer);
			
			for(var i = 0; i < numPoints; i++){
				positions[3*i+0] = fView[4*i+0] + node.pcoGeometry.offset.x;
				positions[3*i+1] = fView[4*i+1] + node.pcoGeometry.offset.y;
				positions[3*i+2] = fView[4*i+2] + node.pcoGeometry.offset.z;
				
				color.setRGB(uiView[16*i+12], uiView[16*i+13], uiView[16*i+14]);
				colors[3*i+0] = color.r / 255;
				colors[3*i+1] = color.g / 255;
				colors[3*i+2] = color.b / 255;
			}
			
			geometry.addAttribute('position', new THREE.Float32Attribute(positions, 3));
			geometry.addAttribute('color', new THREE.Float32Attribute(colors, 3));
			geometry.boundingBox = node.boundingBox;
			node.geometry = geometry;
			node.loaded = true;
			node.loading = false;
			node.pcoGeometry.numNodesLoading--;
			
			nodesLoadTimes[url].end = new Date().getTime();
			
			var time = nodesLoadTimes[url].end - nodesLoadTimes[url].start;
		};
		
		nodesLoadTimes[url] = {};
		nodesLoadTimes[url].start = new Date().getTime();
		Potree.BinaryNodeLoader.load(this, callback);
	}
}

Potree.BinaryNodeLoader = function(){

}

Potree.BinaryNodeLoader.load = function(node, callback){
	var url = node.pcoGeometry.octreeDir + "/" + node.name;
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'arraybuffer';
	xhr.overrideMimeType('text/plain; charset=x-user-defined');
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
			if (xhr.status === 200 || xhr.status === 0) {
				var buffer = xhr.response;
				callback(node, buffer);
			} else {
				console.log('Failed to load file! HTTP status: ' + xhr.status + ", file: " + url);
			}
		}
	};
	try{
		xhr.send(null);
	}catch(e){
		console.log("fehler beim laden der punktwolke: " + e);
	}
}


Potree.LasLazBatcher = function(node, url){	
	this.push = function(lasBuffer){
		var ww = Potree.workers.lasdecoder.getWorker();
		var mins = new THREE.Vector3(lasBuffer.mins[0], lasBuffer.mins[1], lasBuffer.mins[2]);
		var maxs = new THREE.Vector3(lasBuffer.maxs[0], lasBuffer.maxs[1], lasBuffer.maxs[2]);
		mins.add(node.pcoGeometry.offset);
		maxs.add(node.pcoGeometry.offset);
		
		ww.onmessage = function(e){
			var geometry = new THREE.BufferGeometry();
			var numPoints = lasBuffer.pointsCount;
			
			var endsWith = function(str, suffix) {
				return str.indexOf(suffix, str.length - suffix.length) !== -1;
			}
			
			var positions = e.data.position;
			var colors = e.data.color;
			var intensities = e.data.intensity;
			var classifications = new Uint8Array(e.data.classification);
			var classifications_f = new Float32Array(classifications.byteLength);
			
			var box = new THREE.Box3();
			
			var fPositions = new Float32Array(positions);
			for(var i = 0; i < numPoints; i++){			
				fPositions[3*i+0] += node.pcoGeometry.offset.x;
				fPositions[3*i+1] += node.pcoGeometry.offset.y;
				fPositions[3*i+2] += node.pcoGeometry.offset.z;
				
				classifications_f[i] = classifications[i];
				
				box.expandByPoint(new THREE.Vector3(fPositions[3*i+0], fPositions[3*i+1], fPositions[3*i+2]));
			}
			
			geometry.addAttribute('position', new THREE.Float32Attribute(positions, 3));
			geometry.addAttribute('color', new THREE.Float32Attribute(colors, 3));
			geometry.addAttribute('intensity', new THREE.Float32Attribute(intensities, 1));
			geometry.addAttribute('classification', new THREE.Float32Attribute(classifications_f, 1));
			//geometry.boundingBox = node.boundingBox;
			geometry.boundingBox = new THREE.Box3(mins, maxs);
			node.boundingBox = geometry.boundingBox;
			
			node.geometry = geometry;
			node.loaded = true;
			node.loading = false;
			node.pcoGeometry.numNodesLoading--;
			
			nodesLoadTimes[url].end = new Date().getTime();
			
			var time = nodesLoadTimes[url].end - nodesLoadTimes[url].start;
			Potree.workers.lasdecoder.returnWorker(ww);
		};
		
		var message = {
			buffer: lasBuffer.arrayb,
			numPoints: lasBuffer.pointsCount,
			pointSize: lasBuffer.pointSize,
			pointFormatID: 2,
			scale: lasBuffer.scale,
			offset: lasBuffer.offset,
			mins: [node.pcoGeometry.boundingBox.min.x, node.pcoGeometry.boundingBox.min.y, node.pcoGeometry.boundingBox.min.z],
			maxs: [node.pcoGeometry.boundingBox.max.x, node.pcoGeometry.boundingBox.max.y, node.pcoGeometry.boundingBox.max.z]
		};
		ww.postMessage(message, [message.buffer]);
	}
};

Potree.PointCloudOctreeGeometryNode.prototype.dispose = function(){
	delete this.geometry;
	this.loaded = false;
}