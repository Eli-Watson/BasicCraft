			// need to dos:
			//-make mobile work better
			// add more texture and possibly a bigger menu
			
			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			let selectedTexture = "./resources/dirt.jpg"; // Default texture dosen't work. for future eli to fix
			// let showWelcome = 'true' // varible to see whether or not to display welcome modal
			
			document.addEventListener("DOMContentLoaded", (event) => {
			// Unfinished Finction to make the welcome screen not show up evrey time.
			// function CheckWelcome() {
			// 	if (welcome === true) {
			// 		 welcome = false;
			// 		Welcome.closeModal();
			// 	}
				
			// }
			// if (welcome == 'false')	{
			// 	// localStorage.setItem('WelcomeModal', 'false')
			// 	console.log('Welcome Modal Is disabled')
			// }
			
			// else {
			// 	// localStorage.setItem('WelcomeModal','true')
			// 	Welcome.showModal();
			// }
			Welcome.showModal();
			});

			// Function to change cube texture
			function updateCubeTexture(texturePath) {
    			cubeMaterial.map = THREE.ImageUtils.loadTexture(texturePath);
    			cubeMaterial.needsUpdate = true; 
			}

			// Add event listeners to all items
			document.querySelectorAll('#item').forEach(function (item) {
    		item.addEventListener('click', function () {
        	const texturePath = item.getAttribute('data-texture'); 
        	selectedTexture = texturePath; 
        	updateCubeTexture(texturePath); 
    			});
			});


			var container, stats;
			var camera, scene, renderer;
			var projector, plane, cube;
			var mouse2D, mouse3D, ray,
			rollOveredFace, isShiftDown = false,
			theta = 45, isCtrlDown = false;

			var rollOverMesh, rollOverMaterial, voxelPosition = new THREE.Vector3(), tmpVec = new THREE.Vector3();
			var cubeGeo, cubeMaterial;
			var i, intersector;

			

			init();
			animate();
			onWindowResize();

			// Add touch support for movement and clicking
			document.addEventListener('touchstart', onDocumentTouchStart, false);

			// Add event listener to call onWindowResize when the window resizes
			window.addEventListener('resize', onWindowResize, false);
			
			document.getElementById("rotateLeft").addEventListener("click", function () {
				theta -= 10; // Adjust rotation speed if needed
				updateCameraPosition();
			});
			
			document.getElementById("rotateRight").addEventListener("click", function () {
				theta += 10;
				updateCameraPosition();
			});
			
			// Function to update camera position based on theta for rotation
			function updateCameraPosition() {
				camera.position.x = 1400 * Math.sin(theta * Math.PI / 360);
				camera.position.z = 1400 * Math.cos(theta * Math.PI / 360);
				camera.lookAt(scene.position);
			}
			


			// Adjust camera and renderer size on window resize
			function onWindowResize() {
    			camera.aspect = window.innerWidth / window.innerHeight;
    			camera.updateProjectionMatrix();
    			renderer.setSize(window.innerWidth, window.innerHeight);
			}

			// Add touch support for mobile devices
			function onDocumentTouchStart(event) {
   				event.preventDefault();
 			    const touch = event.touches[0];
    			mouse2D.x = (touch.clientX / window.innerWidth) * 2 - 1;
    			mouse2D.y = -(touch.clientY / window.innerHeight) * 2 + 1;
			}
			
			function init() {
				// the writing on top
				container = document.createElement( 'div' );
				document.body.appendChild( container );
				var info = document.createElement( 'div' );
				info.style.position = 'absolute';
				info.style.top = '10px';
				info.style.width = '100%';
				info.style.textAlign = 'center';
				info.innerHTML = ' BasicCraft<br><strong>click</strong>: add voxel, <strong>control + click</strong>: remove voxel, <strong>shift + click</strong>: rotate, <a href="javascript:save();return false;">save .png</a>';
				container.appendChild( info );

				camera = new THREE.CombinedCamera( window.innerWidth, window.innerHeight, 45, 1, 10000, -2000, 10000 );
				camera.position.y = 800;

				scene = new THREE.Scene();

				// roll-over helpers

				rollOverGeo = new THREE.CubeGeometry( 50, 50, 50 );
				rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
				rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
				scene.add( rollOverMesh );

				// cubes

				cubeGeo = new THREE.CubeGeometry( 50, 50, 50 );
				cubeMaterial = new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture( "dirt.jpg" ) } );
				cubeMaterial.ambient = cubeMaterial.color;

				// picking

				projector = new THREE.Projector();

				// grid

				plane = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 1000, 20, 20 ), new THREE.MeshBasicMaterial( { color: 0x555555, wireframe: true } ) );
				plane.rotation.x = - Math.PI / 2;
				scene.add( plane );

				mouse2D = new THREE.Vector3( 0, 10000, 0.5 );

				// Lights

				var ambientLight = new THREE.AmbientLight( 0x606060 );
				scene.add( ambientLight );

				var directionalLight = new THREE.DirectionalLight( 0xffffff );
				directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
				scene.add( directionalLight );

				renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } );
				renderer.setSize( window.innerWidth, window.innerHeight );

				container.appendChild( renderer.domElement );

				stats = new Stats();
				stats.domElement.style.position = 'absolute';
				stats.domElement.style.top = '0px';
				container.appendChild( stats.domElement );

				document.addEventListener( 'mousemove', onDocumentMouseMove, false );
				document.addEventListener( 'mousedown', onDocumentMouseDown, false );
				document.addEventListener( 'keydown', onDocumentKeyDown, false );
				document.addEventListener( 'keyup', onDocumentKeyUp, false );

				//

				window.addEventListener( 'resize', onWindowResize, false );


			}

			function onWindowResize() {

				camera.setSize( window.innerWidth, window.innerHeight );
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			function getRealIntersector( intersects ) {

				for( i = 0; i < intersects.length; i++ ) {

					intersector = intersects[ i ];

					if ( intersector.object != rollOverMesh ) {

						return intersector;

					}

				}

				return null;

			}

			function setVoxelPosition( intersector ) {

				tmpVec.copy( intersector.face.normal );

				voxelPosition.add( intersector.point, intersector.object.matrixRotationWorld.multiplyVector3( tmpVec ) );

				voxelPosition.x = Math.floor( voxelPosition.x / 50 ) * 50 + 25;
				voxelPosition.y = Math.floor( voxelPosition.y / 50 ) * 50 + 25;
				voxelPosition.z = Math.floor( voxelPosition.z / 50 ) * 50 + 25;

			}

			function onDocumentMouseMove( event ) {

				event.preventDefault();

				mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
				mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

			}

			function onDocumentMouseDown( event ) {

				event.preventDefault();

				var intersects = ray.intersectObjects( scene.children );

				if ( intersects.length > 0 ) {

					intersector = getRealIntersector( intersects );

					// delete cube

					if ( isCtrlDown ) {

						if ( intersector.object != plane ) {

							scene.remove( intersector.object );

						}

					// create cube

					} else {

						if (Welcome.open) {
							console.log("Welcome Modal is Open, No Object is placed")
						} else {
						intersector = getRealIntersector( intersects );
						setVoxelPosition( intersector );
						// note self, if the material is not material.clone() the texture changer funtion changes all the cubes, placed and unplaced
						var voxel = new THREE.Mesh( cubeGeo, cubeMaterial.clone() );
						voxel.position.copy( voxelPosition );
						voxel.matrixAutoUpdate = false;
						voxel.updateMatrix();
						scene.add( voxel );

						}

						}
						
				}
			}

			function onDocumentKeyDown( event ) {

				switch( event.keyCode ) {

					case 16: isShiftDown = true; break;
					case 17: isCtrlDown = true; break;

				}

			}

			function onDocumentKeyUp( event ) {

				switch( event.keyCode ) {

					case 16: isShiftDown = false; break;
					case 17: isCtrlDown = false; break;

				}
			}
			// not sure if this works anymore. or if its just me
			function save() {

				window.open( renderer.domElement.toDataURL('image/png'), 'mywindow' );

			}

			//

			function animate() {

				requestAnimationFrame( animate );

				render();
				stats.update();

			}

			function render() {

				if ( isShiftDown ) {

					theta += mouse2D.x * 3;

				}

				ray = projector.pickingRay( mouse2D.clone(), camera );

				var intersects = ray.intersectObjects( scene.children );

				if ( intersects.length > 0 ) {

					intersector = getRealIntersector( intersects );
					if ( intersector ) {

						setVoxelPosition( intersector );
						rollOverMesh.position = voxelPosition;

					}

				}

				camera.position.x = 1400 * Math.sin( theta * Math.PI / 360 );
				camera.position.z = 1400 * Math.cos( theta * Math.PI / 360 );

				camera.lookAt( scene.position );

				renderer.render( scene, camera );

			}
			