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
	var BOOST, MOVE_FB, MOVE_LR, DELTA_MOVE, ROT, DELTA_ROT, ELEV, ELEV_OFF;
	var lastElevation;
	
	//Deliveries, score
	var drops = [];
	var toRemove;
	var scoreCount = 0;
	var NUMDROPS = 5;
	
	/*****************************************************************************************************************/
	/* GAME LOOP */
	
	function render() {
		
		/*
		if(cam.position.y < 10) {
			stop("OOPS! ENTER TO RESTART");
			return;
		}
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
				if(MOVE_FB > -50.0) MOVE_FB -= 0.5;
			}
			else {
				if(MOVE_FB < -10.0) MOVE_FB += 0.5;
			}
			cam.translateZ(MOVE_FB);
			if(MOVE_FB > -10.0) MOVE_FB -= DELTA_MOVE;
		}
		else if(back) {
			cam.translateZ(-MOVE_FB);
			if(MOVE_FB > -10.0) MOVE_FB -= DELTA_MOVE;
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
			if(ROT < 0.01) ROT += DELTA_ROT;
		}
		else if(rotRight) {
			cam.rotateY(-ROT);
			if(ROT < 0.01) ROT += DELTA_ROT;
		}
		
		//Elevation
		if(up) {
			if(cam.position.y > lastElevation + 50.0) up = false;
			else cam.translateY(ELEV);
		}
		else if(down) {
			if(cam.position.y < 20.0) {
				down = false;
			}
			else {
				if(cam.position.y < lastElevation - 50.0) down = false;
				else cam.translateY(-ELEV);
			}
		}
		
		renderer.render(scene, cam);
		requestAnimationFrame(render);
	}
	
	function stop(msg) {
		document.removeEventListener('keydown', doKeyDown);
		document.removeEventListener('keyup', doKeyUp);
		document.addEventListener('keydown', doEnter, false);
		
		scene.remove.apply(scene, scene.children);
		orbs = [];
		
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
		document.addEventListener('keydown', doKeyDown, false);
		document.addEventListener('keyup', doKeyUp, false);
		controls.html(
			"SPACE:⇪ &nbsp; W:↑ &nbsp; S:↓ &nbsp; A:← &nbsp; D:→ &nbsp; UP: Rise &nbsp; DOWN: Fall &nbsp; LEFT: Rotate Left &nbsp; RIGHT: Rotate Right");
		score.html("Drops: " + scoreCount + "/" + NUMDROPS);
		
		BOOST = -10.0;
		MOVE_FB = 0;
		MOVE_LR = 0;
		DELTA_MOVE = 0.2;
		ROT = 0;
		DELTA_ROT = 0.00025;
		ELEV = 1.0;
		
		initScene();
		initGround();
		initSky();
		
		renderer.render(scene, cam);
		render();
	}
	
	function initScene() {
		cam.position.x = 0;
		cam.position.y = 200;
		cam.position.z = -400;
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
});