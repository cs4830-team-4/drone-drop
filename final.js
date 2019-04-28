$(document).ready(function() {
	
	//JQuery objects
	var splash = $("#splash");
	var message = $("#message");
	var reticle = $("#reticle");
	var score = $("#score");
	var controls = $("#controls");
	
	//Renderer, scene
	var width = window.innerWidth;
	var height = window.innerHeight;
	var renderer = new THREE.WebGLRenderer({ antialias : true });
	renderer.setSize(width, height);
	document.body.appendChild(renderer.domElement);
	var scene = new THREE.Scene;
	scene.background = new THREE.Color(0xCCCCCC);
		
	//Camera
	var cam = new THREE.PerspectiveCamera(45, width/height, 5, 20000);
	
	//Light
	var lightAmbient = new THREE.AmbientLight(0x404040);
	var lightSun = new THREE.PointLight(0xaabbcc);
	lightSun.position.set(0, 1000, 18);
	
	//Control Data
	var forw, back, left, right, rotLeft, rotRight, up, down, boost;
	var wasForw, wasBack, wasLeft, wasRight, wasRotLeft, wasRotRight, wasUp, wasDown;
	var BOOST, MOVE_FB, MOVE_LR, DELTA_MOVE, ROT, DELTA_ROT, ELEV, DELTA_ELEV, ELEV_OFF;
	var lastElevation;
	
	//Deliveries, score
	var drops = [];
	var toEnable, toRemove;
	var scoreCount = 0;
	var NUMDROPS = 10;
	var dropIndex, dropX, dropY, dropZ, dropRadius, dropName;
	var pkg, pkgSphere;
	var deliver = true;
	
	/*****************************************************************************************************************/
	/* GAME LOOP */
	
	function render() {
		
		//Collisions
		if(	deliver &&
			MOVE_FB > -5.0 &&
			Math.abs(cam.position.x - dropX) < dropRadius &&
			Math.abs(cam.position.y - dropY) < dropRadius + 50 &&
			Math.abs(cam.position.z - dropZ) < dropRadius) {
				toRemove = scene.getObjectByName(dropName);
		        scene.remove(toRemove);
		        drops.splice(dropIndex, 1);
				scoreCount++;
				score.html("Drops: " + scoreCount + "/" + NUMDROPS);
				if(scoreCount == NUMDROPS) {
					stop("DONE! ENTER TO RESET");
					return;
				}
				newPkg();
		}
		else if(
			!deliver &&
			MOVE_FB > -5.0 &&
			Math.abs(cam.position.x - pkg.position.x) < pkgSphere.radius &&
			Math.abs(cam.position.y - pkg.position.y) < pkgSphere.radius &&
			Math.abs(cam.position.z - pkg.position.z) < pkgSphere.radius) {
				newDrop();
		}
		
		/*
		stop("OOPS! ENTER TO RESTART");
		return;
		*/
		
		//Move - Forward & Backward
		if(wasForw) {
			cam.translateZ(MOVE_FB);
			if(MOVE_FB < 0) MOVE_FB += DELTA_MOVE;
			else wasForw = false;
		}
		else if(wasBack) {
			cam.translateZ(-MOVE_FB);
			if(MOVE_FB < 0) MOVE_FB += DELTA_MOVE;
			else wasBack = false;
		}
		else if(forw) {
			if(boost) {
				if(MOVE_FB > -25.0) MOVE_FB -= 0.4;
			}
			else {
				if(MOVE_FB < -8.0) MOVE_FB += 0.25;
			}
			cam.translateZ(MOVE_FB);
			if(MOVE_FB > -8.0) MOVE_FB -= DELTA_MOVE;
		}
		else if(back) {
			cam.translateZ(-MOVE_FB);
			if(MOVE_FB > -8.0) MOVE_FB -= DELTA_MOVE;
		}
		
		//Move - Left & Right
		if(wasLeft) {
			cam.translateX(MOVE_LR);
			if(MOVE_LR < 0) MOVE_LR += DELTA_MOVE;
			else wasLeft = false;
		}
		else if(wasRight) {
			cam.translateX(-MOVE_LR);
			if(MOVE_LR < 0) MOVE_LR += DELTA_MOVE;
			else wasRight = false;
		}
		else if(left) {
			cam.translateX(MOVE_LR);
			if(MOVE_LR > -10.0) MOVE_LR -= DELTA_MOVE;
		}
		else if(right) {
			cam.translateX(-MOVE_LR);
			if(MOVE_LR > -10.0) MOVE_LR -= DELTA_MOVE;
		}
		
		//Rotation
		if(wasRotLeft) {
			cam.rotateY(ROT);
			if(ROT > 0) ROT -= DELTA_ROT;
			else wasRotLeft = false;
		}
		else if(wasRotRight) {
			cam.rotateY(-ROT);
			if(ROT > 0) ROT -= DELTA_ROT;
			else wasRotRight = false;
		}
		else if(rotLeft) {
			cam.rotateY(ROT);
			if(ROT < 0.025) ROT += DELTA_ROT;
		}
		else if(rotRight) {
			cam.rotateY(-ROT);
			if(ROT < 0.025) ROT += DELTA_ROT;
		}
		
		//Elevation
		if(up) {
			if(cam.position.y > lastElevation + DELTA_ELEV) up = false;
			else cam.translateY(ELEV);
		}
		else if(down) {
			if(cam.position.y < 100.0) {
				down = false;
			}
			else {
				if(cam.position.y < lastElevation - DELTA_ELEV) down = false;
				else cam.translateY(-ELEV);
			}
		}
		
		renderer.render(scene, cam);
		requestAnimationFrame(render);
	}
	
	function stop(msg) {
		renderer.setClearColor({ color: 0x000000 });
		renderer.clearColor(true, false, false);
		document.removeEventListener('keydown', doKeyDown);
		document.removeEventListener('keyup', doKeyUp);
		document.addEventListener('keydown', doEnter, false);
		
		scene.remove.apply(scene, scene.children);
		drops = [];
		
		scoreCount = 0;
		
		boost = false;
		forw = false;		wasForw = false;
		back = false;		wasBack = false;
		left = false;		wasLeft = false;
		right = false;		wasRight = false;
		rotLeft = false;	wasRotLeft = false;
		rotRight = false;	wasRotRight = false;
		up = false;
		down = false;
		reticle.hide();
		message.text(msg);
		splash.show();
	}
	
	/*****************************************************************************************************************/
	/* UTILS */
	
	function newDrop() {
		deliver = true;
		pkg.visible = false;
		
		dropIndex = getRandomInt(0, drops.length - 1);
		dropX = drops[dropIndex].center.x;
		dropY = drops[dropIndex].center.y;
		dropZ = drops[dropIndex].center.z;
		dropRadius = drops[dropIndex].radius;
		dropName = drops[dropIndex].name;
		
		toEnable = scene.getObjectByName(dropName);
        toEnable.visible = true;
	}
	
	function newPkg() {
		deliver = false;
		pkg.visible = true;
	}
	
	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min; 
	}
	
	document.addEventListener('keydown', doEnter, false);
	function doEnter(event) {
		if(event.keyCode == 13) {
			document.removeEventListener('keydown', doEnter);
			init();
			splash.hide();
			reticle.html(	"+ - - - -");
			reticle.show();
			score.show();
		}
	}
	
	function doKeyDown(event) {
		var code = event.keyCode;
		switch (code) {
		case 32: // space
			boost = true;
			break;
		case 65: // a
			if(!right) {
				left = true;
				right = false;
			}
			break;
		case 68: // d
			if(!left) {
				right = true;
				left = false;
			}
			break;
		case 87: // w
			if(!back) {
				forw = true;
				back = false;
			}
			break;
		case 83: // s
			if(!forw) {
				back = true;
				forw = false;
			}
			break;
		case 37: // left arrow
			if(!rotRight) {
				rotLeft = true;
				rotRight = false;
			}
			break;
		case 39: // right arrow
			if(!rotLeft) {
				rotRight = true;
				rotLeft = false;
			}
			break;
		}
		switch (code) {
		case 38: // up arrow
			if(!up && !down && !ELEV_OFF) {
				up = true;
				ELEV_OFF = true;
				lastElevation = cam.position.y;
			}
			break;
		case 40: // down arrow
			if(!up && !down && !ELEV_OFF) {
				down = true;
				ELEV_OFF = true;
				lastElevation = cam.position.y;
			}
			break;
		}
	}

	function doKeyUp(event) {
		var code = event.keyCode;
		switch (code) {
		case 32: // space
			boost = false;
			break;
		case 65: // a
			if(!right) {
				left = false;
				wasLeft = true;
			}
			break;
		case 68: // d
			if(!left) {
				right = false;
				wasRight = true;
			}
			break;
		case 87: // w
			if(!back) {
				forw = false;
				wasForw = true;
			}
			break;
		case 83: // s
			if(!forw) {
				back = false;
				wasBack = true;
			}
			break;
		case 37: // left arrow
			if(!rotRight) {
				rotLeft = false;
				wasRotLeft = true;
			}
			break;
		case 39: // right arrow
			if(!rotLeft) {
				rotRight = false;
				wasRotRight = true;
			}
			break;
		}
		switch (code) {
		case 38: // up arrow
			ELEV_OFF = false;
			break;
		case 40: // down arrow
			ELEV_OFF = false;
			break;
		}
	}
	
	/*****************************************************************************************************************/
	/* INIT */
	
	function init() {
		scene.remove.apply(scene, scene.children);
		document.addEventListener('keydown', doKeyDown, false);
		document.addEventListener('keyup', doKeyUp, false);
		controls.html(
			"SPACE:⇪ &nbsp; W:↑ &nbsp; S:↓ &nbsp; A:← &nbsp; D:→ &nbsp; UP: Rise &nbsp; DOWN: Fall &nbsp; LEFT: Rotate Left &nbsp; RIGHT: Rotate Right");
		score.html("Drops: " + scoreCount + "/" + NUMDROPS);
		
		BOOST = -10.0;
		MOVE_FB = 0;
		MOVE_LR = 0;
		DELTA_MOVE = 0.4;
		ROT = 0;
		DELTA_ROT = 0.001;
		ELEV = 4.0;
		DELTA_ELEV = 100.0;
		
		initScene();
		initGround();
		initSky();
		initPkg();
		initDrops();
		
		renderer.render(scene, cam);
		render();
	}
	
	function initScene() {
		cam.position.x = 0;
		cam.position.y = 400;
		cam.position.z = -4500;
		scene.add(cam);
		scene.add(lightAmbient);
		scene.add(lightSun);
	}
	
	function initGround() {
		var grid = new THREE.GridHelper(10000, 50, 0xff0000, 0xcccccc);
		grid.position.y += 1;
		scene.add(grid);
		
		var geoGround = new THREE.PlaneBufferGeometry(10000, 10000);
		var matGround = new THREE.MeshBasicMaterial({ color: 0xffffff });
		
		var ground = new THREE.Mesh(geoGround, matGround);
		ground.rotation.set(Math.PI/-2, 0, 0);
		scene.add(ground);
	}
	
	function initSky() {
		var grid = new THREE.GridHelper(10000, 50, 0xff0000, 0xcccccc);
		scene.add(grid);
		
		var geoSky = new THREE.PlaneBufferGeometry(10000, 10000);
		var matSky = new THREE.MeshBasicMaterial({ color: 0x7ec0ee });
		
		var sky = new THREE.Mesh(geoSky, matSky);
		sky.position.y = 5000;
		sky.rotation.set(Math.PI/2, 0, 0);
		grid.position.y += 4999;
		scene.add(sky);
	}
	
	function initDrops() {
		for(var i = 0; i < 5; i++) {
			var geoDrop = new THREE.SphereGeometry(100, 32, 32);
			var matDrop = new THREE.MeshLambertMaterial({ color: 0xccff00, transparent: true, alphaTest: 0.5 });
			matDrop.transparent = true;
			matDrop.opacity = 0.5;
			var drop = new THREE.Mesh(geoDrop, matDrop);
			drop.name = "d" + i;
			drop.position.x = 1000; 
			drop.position.y = -40.0;
			drop.position.z = i * 1500 - 3000;
			drop.needsUpdate = true;
			
			scene.add(drop);
			drop.visible = false;
			
			var sphere = new THREE.Sphere(drop.position, 100);
			sphere.name = drop.name;
			drops.push(sphere);
		}
		
		for(var i = 5; i < 10; i++) {
			var geoDrop = new THREE.SphereGeometry(100, 32, 32);
			var matDrop = new THREE.MeshLambertMaterial({ color: 0xccff00, transparent: true, alphaTest: 0.5 });
			matDrop.transparent = true;
			matDrop.opacity = 0.5;
			var drop = new THREE.Mesh(geoDrop, matDrop);
			drop.name = "d" + i;
			drop.position.x = -1000; 
			drop.position.y = -40.0;
			drop.position.z = (i - 5) * 1500 - 3000;
			drop.needsUpdate = true;
			
			scene.add(drop);
			drop.visible = false;
			
			var sphere = new THREE.Sphere(drop.position, 100);
			sphere.name = drop.name;
			drops.push(sphere);
		}
		
		newDrop();
		cam.lookAt(new THREE.Vector3(cam.position.x, cam.position.y, cam.position.z + 1000));
	}
	
	function initPkg() {
		var geoPackage = new THREE.SphereGeometry(100, 32, 32);
		var matPackage = new THREE.MeshLambertMaterial({ color: 0xccff00, transparent: true, alphaTest: 0.5 });
		matPackage.transparent = true;
		matPackage.opacity = 0.5;
		pkg = new THREE.Mesh(geoPackage, matPackage);
		pkg.name = "pkg";
		pkg.position.x = 0; 
		pkg.position.y = 300;
		pkg.position.z = -4500;
		pkg.needsUpdate = true;
		
		scene.add(pkg);
		pkg.visible = false;
		
		pkgSphere = new THREE.Sphere(pkg.position, 100);
		pkgSphere.name = pkg.name;
	}
});