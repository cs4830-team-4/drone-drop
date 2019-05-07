$(document).ready(function() {
	
	//JQuery objects
	var splash = $("#splash");
	var message = $("#message");
	var reticle = $("#reticle");
	var score = $("#score");
	var controls = $("#controls");
	var position = $("#position");
	
	//Renderer, scene
	var width = window.innerWidth;
	var height = window.innerHeight;
	var renderer = new THREE.WebGLRenderer({ antialias : false, precision: "lowp" });
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
	
	//Geometry Data
	var RADIUS = 100;
	var dropIndex, dropX, dropY, dropZ, dropName;
	var pkg, pkgPosition;
	
	//Control Data
	var forw, back, left, right, rotLeft, rotRight, up, down, boost;
	var wasForw, wasBack, wasLeft, wasRight, wasRotLeft, wasRotRight, wasUp, wasDown;
	var BOOST, MOVE_FB, MOVE_LR, DELTA_MOVE, ROT, DELTA_ROT, ELEV, DELTA_ELEV, ELEV_OFF;
	var lastElevation;
	
	//Game Data
	var frame = 0;
	var drops = [];
	var toEnable, toRemove;
	var scoreCount = 0;
	var NUMDROPS = 10;
	var deliver = true;
	
	/*****************************************************************************************************************/
	/* GAME LOOP */
	
	function render() {
		frame++;
		
		//Drop collisions
		if(frame % 10 == 0) {
			if(	deliver &&
				MOVE_FB > -5.0 &&
				Math.abs(cam.position.x - dropX) < RADIUS &&
				Math.abs(cam.position.y - dropY) < RADIUS + 50 &&
				Math.abs(cam.position.z - dropZ) < RADIUS) {
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
				Math.abs(cam.position.x - pkgPosition.x) < RADIUS &&
				Math.abs(cam.position.y - pkgPosition.y) < RADIUS + 20 &&
				Math.abs(cam.position.z - pkgPosition.z) < RADIUS) {
					selectDrop();
			}
			frame = 0;
		}
		
		//House collisions
		if(cam.position.y < 220 && cam.position.y > 0) {
			if((cam.position.x < -1190 && cam.position.x > -1620) || (cam.position.x < 1620 && cam.position.x > 1190)){
				if(cam.position.z < -2540 && cam.position.z > -3480) {
					stop("OOPS! ENTER TO RESTART");
					return;
				}
				else if(cam.position.z < -1040 && cam.position.z > -1980) {
					stop("OOPS! ENTER TO RESTART");
					return;
				}
				else if(cam.position.z < 460 && cam.position.z > -480) {
					stop("OOPS! ENTER TO RESTART");
					return;
				}
				else if(cam.position.z < 1950 && cam.position.z > 1020) {
					stop("OOPS! ENTER TO RESTART");
					return;
				}
				else if(cam.position.z < 3460 && cam.position.z > 2520) {
					stop("OOPS! ENTER TO RESTART");
					return;
				}
			}
		}
		else if(cam.position.y < 380 && cam.position.y > 220) {
			if((cam.position.x < -1260 && cam.position.x > -1540) || (cam.position.x < 1540 && cam.position.x > 1260)){
				if(cam.position.z < -2540 && cam.position.z > -3480) {
					stop("OOPS! ENTER TO RESTART");
					return;
				}
				else if(cam.position.z < -1040 && cam.position.z > -1980) {
					stop("OOPS! ENTER TO RESTART");
					return;
				}
				else if(cam.position.z < 460 && cam.position.z > -480) {
					stop("OOPS! ENTER TO RESTART");
					return;
				}
				else if(cam.position.z < 1950 && cam.position.z > 1020) {
					stop("OOPS! ENTER TO RESTART");
					return;
				}
				else if(cam.position.z < 3460 && cam.position.z > 2520) {
					stop("OOPS! ENTER TO RESTART");
					return;
				}
			}	
		}
			
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
		
		position.html("x: " + cam.position.x + "y: " + cam.position.y);
		
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
	function selectDrop() {
		deliver = true;
		pkg.visible = false;
		
		dropIndex = getRandomInt(0, drops.length - 1);
		dropX = drops[dropIndex].x;
		dropY = drops[dropIndex].y;
		dropZ = drops[dropIndex].z;
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
		//initGrids();
		initGround();
		//initSky();
		initPkg();
		initTruck();
		initDrops();
		
		renderer.render(scene, cam);
		render();
	}
	
	function initScene() {
		while(scene.children.length > 0){ 
		    scene.remove(scene.children[0]); 
		}
		cam.position.x = 0;
		cam.position.y = 400;
		cam.position.z = -4500;
		scene.add(cam);
		scene.add(lightAmbient);
		scene.add(lightSun);
	}
	
	function initGrids() {
		var gridGround = new THREE.GridHelper(10000, 50, 0xff0000, 0xcccccc);
		gridGround.position.y += 1;
		scene.add(gridGround);
		
		var gridSky = new THREE.GridHelper(10000, 50, 0xff0000, 0xcccccc);
		grid.position.y += 4999;
		scene.add(gridSky);
	}
	
	function initGround() {
		var texture = new THREE.TextureLoader().load( 'grass.jpg' );
		
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(100, 100);
		
		var geoGround = new THREE.PlaneBufferGeometry(10000, 10000);
		var matGround = new THREE.MeshBasicMaterial({ map: texture });
		
		var ground = new THREE.Mesh(geoGround, matGround);
		ground.rotation.set(Math.PI/-2, 0, 0);
		scene.add(ground);
	}
	
	function initSky() {
		var geoSky = new THREE.PlaneBufferGeometry(10000, 10000);
		var matSky = new THREE.MeshBasicMaterial({ color: 0x7ec0ee });
		
		var sky = new THREE.Mesh(geoSky, matSky);
		sky.position.y = 5000;
		sky.rotation.set(Math.PI/2, 0, 0);
		scene.add(sky);
	}
	
	function initDrops() {
		for(var i = 0; i < 5; i++) {
			var geoDrop = new THREE.SphereGeometry(RADIUS, 16, 16);
			var matDrop = new THREE.MeshLambertMaterial({ color: 0xccff00 });
			var drop = new THREE.Mesh(geoDrop, matDrop);
			drop.name = "d" + i;
			drop.position.x = 1000; 
			drop.position.y = -40.0;
			drop.position.z = i * 1500 - 3000;
			drop.needsUpdate = true;
			
			initHouse(drop.position.x, drop.position.z, 250, -Math.PI / 2, -Math.PI / 2);
			
			drop.position.z -= 100;
			
			scene.add(drop);
			drop.visible = false;
			
			var position = drop.position;
			position.name = drop.name;
			drops.push(position);
		}
		
		for(var i = 5; i < 10; i++) {
			var geoDrop = new THREE.SphereGeometry(RADIUS, 16, 16);
			var matDrop = new THREE.MeshLambertMaterial({ color: 0xccff00 });
			var drop = new THREE.Mesh(geoDrop, matDrop);
			drop.name = "d" + i;
			drop.position.x = -1000; 
			drop.position.y = -40.0;
			drop.position.z = (i - 5) * 1500 - 3000;
			drop.needsUpdate = true;
			
			initHouse(drop.position.x, drop.position.z, -250, -Math.PI / 2, Math.PI / 2);
			
			drop.position.z += 100;
			
			scene.add(drop);
			drop.visible = false;
			
			var position = drop.position;
			position.name = drop.name;
			drops.push(position);
		}
		
		selectDrop();
		cam.lookAt(new THREE.Vector3(cam.position.x, cam.position.y, cam.position.z + 1000));
	}
	
	function initHouse(dropX, dropZ, offX, rotX, rotZ) {
		var loader = new THREE.MTLLoader()
		.setPath('models/')
		.load('polHouse1.mtl', function (materials) {
			materials.preload();
			new THREE.OBJLoader()
				.setMaterials(materials)
				.setPath('models/')
				.load('polHouse1.obj', function (house) {
					house.position.x = dropX + offX;
					house.position.y = 0;
					house.position.z = dropZ;
					house.scale.set(10, 10, 10);
					house.rotation.x = rotX;
					house.rotation.z = rotZ;
					scene.add(house);
				});
		});
	}
	
	function initPkg() {
		var geoPackage = new THREE.SphereGeometry(RADIUS, 16, 16);
		var matPackage = new THREE.MeshLambertMaterial({ color: 0xccff00 });
		pkg = new THREE.Mesh(geoPackage, matPackage);
		pkg.name = "pkg";
		pkg.position.x = 0; 
		pkg.position.y = 250;
		pkg.position.z = -4500;
		pkg.needsUpdate = true;
		
		scene.add(pkg);
		pkg.visible = false;
		
		pkgPosition = pkg.position;
		pkgPosition.name = pkg.name;
	}
	
	function initTruck() {
		var loader = new THREE.MTLLoader()
		.setPath('models/')
		.load('truck.mtl', function (materials) {
			materials.preload();
			new THREE.OBJLoader()
				.setMaterials(materials)
				.setPath('models/')
				.load('truck.obj', function (truck) {
					truck.position.x = pkgPosition.x;
					truck.position.y = 0;
					truck.position.z = pkgPosition.z;
					truck.scale.set(120, 120, 120);
					//truck.rotation.x = rotX;
					//truck.rotation.z = rotZ;
					scene.add(truck);
				});
		});
	}
});