// main.js
import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui';

setTimeout(() => {
    // temporary solution use async await.
    // Create a scene
        let scene = new THREE.Scene();

        // Add a camera
        let camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        camera.lookAt(scene.position);

        // Get the canvas from the HTML
        let canvas = document.querySelector('#myCanvas');

        // Create a renderer and assign the canvas to it
        let renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Adjust camera and renderer on window resize
        window.addEventListener('resize', function () {
            let width = window.innerWidth;
            let height = window.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });

        // Create a raycaster and mouse vector
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2();

        // Create a basic material and geometry for spheres
        let sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        let sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);

        // Create a plane for intersection calculation
        let plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

        // Create an array to store the spheres
        let spheres = [];

        // Create a new dat.GUI instance
        let gui = new dat.GUI();

        // Define the object that will hold our GUI properties
        let guiProperties = {
            color: 0xffffff,
            radius: 0.2,
            positionX: 0,
            positionY: 0,
        };

        // position controllers' old values
        let oldPositionX = 0;
        let oldPositionY = 0;

        // Create a color controller in the GUI
        gui.addColor(guiProperties, 'color').onChange(function (value) {
            spheres.forEach(function (sphere) {
                sphere.material.color.setHex(value);
            });
        });

        // Create a radius controller in the GUI
        gui.add(guiProperties, 'radius', 0.1, 1.0).onChange(function (value) {
            spheres.forEach(function (sphere) {
                sphere.geometry = new THREE.SphereGeometry(value, 32, 32);
            });
        });

        // Create position controllers in the GUI with slider ranging from -5 to 5
        gui.add(guiProperties, 'positionX', -5, 5).onChange(function (value) {
            let diff = value - oldPositionX;
            spheres.forEach(function (sphere) {
                sphere.position.x += diff;
            });
            oldPositionX = value;
        });
        gui.add(guiProperties, 'positionY', -5, 5).onChange(function (value) {
            let diff = value - oldPositionY;
            spheres.forEach(function (sphere) {
                sphere.position.y += diff;
            });
            oldPositionY = value;
        });



        // Create DragControls
        let controls = new DragControls(spheres, camera, renderer.domElement);

        // Disable controls when the mouse is not down
        controls.addEventListener('hoveron', function () {
            canvas.style.cursor = 'move';
        });
        controls.addEventListener('hoveroff', function () {
            canvas.style.cursor = 'auto';
        });

        // On mouse click, add a sphere to the scene at the clicked position
        canvas.addEventListener('click', function (event) {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update the picking ray with the camera and mouse position
            raycaster.setFromCamera(mouse, camera);

            // Calculate the intersection point of the ray with the plane
            let intersectPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, intersectPoint);

            // Add a new sphere at the clicked position
            let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.copy(intersectPoint);
            scene.add(sphere);
            spheres.push(sphere);

            // Update DragControls
            controls = new DragControls(spheres, camera, renderer.domElement);
            controls.addEventListener('hoveron', function () {
                canvas.style.cursor = 'move';
            });
            controls.addEventListener('hoveroff', function () {
                canvas.style.cursor = 'auto';
            });
        });

        // Listen for a double-click event
        canvas.addEventListener('dblclick', function (event) {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update the picking ray with the camera and mouse position
            raycaster.setFromCamera(mouse, camera);

            // Calculate objects intersecting the picking ray
            let intersects = raycaster.intersectObjects(spheres);

            if(intersects.length > 0) {
                // Remove the first object intersected by the ray from the scene and spheres array
                scene.remove(intersects[0].object);
                spheres = spheres.filter(sphere => sphere !== intersects[0].object);

                // Update DragControls
                if (controls) {
                    controls.dispose();  // Dispose the old controls
                    controls = new DragControls(spheres, camera, renderer.domElement);
                    controls.addEventListener('hoveron', function () {
                        canvas.style.cursor = 'move';
                    });
                    controls.addEventListener('hoveroff', function () {
                        canvas.style.cursor = 'auto';
                    });
                }
            }
        });

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);

            // Check every pair of spheres for intersection
            for (let i = 0; i < spheres.length; i++) {
                for (let j = i + 1; j < spheres.length; j++) {
                    if (spheres[i].position.distanceTo(spheres[j].position) < (guiProperties.radius * 2)) {  // if spheres intersect
                        // Remove one of the intersecting spheres from the scene and the spheres array
                        scene.remove(spheres[j]);
                        spheres.splice(j, 1);
                        break;  // Stop checking after removing a sphere to prevent array indexing issues
                    }
                }
            }

            renderer.render(scene, camera);
        }

        animate();
}, 1000);  // Delay for 1000 milliseconds, or 1 second

