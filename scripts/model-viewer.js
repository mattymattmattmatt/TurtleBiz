// scripts/model-viewer.js

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('model-viewer');

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1, 1, 0).normalize();
    scene.add(directionalLight);

    // Load the 3D model
    const loader = new THREE.GLTFLoader();
    loader.load(
        'models/turtle_model.glb', // Adjust the path to your model
        function (gltf) {
            const model = gltf.scene;
            scene.add(model);

            // Optionally adjust the model's position and rotation
            model.rotation.y = Math.PI;
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
    controls.enableDamping = true;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();
});
