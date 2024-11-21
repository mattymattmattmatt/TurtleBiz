// scripts/model-viewer.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('model-viewer');

    // Validate container existence
    if (!container) {
        console.error('Model viewer container not found!');
        return;
    }

    // Create scene
    const scene = new THREE.Scene();

    // Create camera
    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.8);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Load the 3D model
    const loader = new THREE.GLTFLoader();
    loader.load(
        'models/turtle_model.glb', // Path to your 3D model file
        function (gltf) {
            const model = gltf.scene;
            scene.add(model);

            // Optional: Adjust model position or scale
            model.scale.set(1, 1, 1);
            model.rotation.y = Math.PI; // Rotate model if necessary
        },
        undefined,
        function (error) {
            console.error('An error occurred while loading the model:', error);
        }
    );

    // Handle window resize
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    // Enable orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Adds damping (inertia)
    controls.dampingFactor = 0.05;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        controls.update(); // Required if controls.enableDamping = true

        renderer.render(scene, camera);
    }

    animate();
});
