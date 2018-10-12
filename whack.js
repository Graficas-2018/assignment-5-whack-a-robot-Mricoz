var renderer = null,
scene = null,
camera = null,
root = null,
robot_idle = null,
robot_attack = null,
flamingo = null,
stork = null,
group = null,
orbitControls = null;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(), CLICKED;
var game = false;
var robot_mixer = {};
var robotsAnimations = {};
var robots = [];
var robotsMixers = [];
var clock = new THREE.Clock();
var score = 0;
var robotCount = 0;
var gameDuration = 68;
var duration = 20000; // ms
var currentTime = Date.now();

var animation = "idle";

function changeAnimation(animation_text){
    animation = animation_text;

    if(animation =="dead")
    {
        createDeadAnimation();
    }
    else
    {
        robot_idle.rotation.x = 0;
        robot_idle.position.y = -4;
    }
}

function createDeadAnimation(){
    console.log("DEADANIMATION");
}

function loadFBX(){
    var loader = new THREE.FBXLoader();
    loader.load( '../models/Robot/robot_idle.fbx', function ( object ){
        object.scale.set(0.02, 0.02, 0.02);
        object.position.y -= 4;
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        robot_idle = object;
        //scene.add( robot_idle );
        //createDeadAnimation();

        robotsAnimations.idle = object.animations[0];

        loader.load( '../models/Robot/robot_run.fbx', function ( object )
        {
            robotsAnimations.run = object.animations[0];
        } );
    } );
}

function animate() {
    if(clock.elapsedTime > gameDuration || !game){
        document.getElementById("score").innerHTML = "GAME";
        document.getElementById("timer").innerHTML = "OVER";
        return;
    }

    var delta = clock.getDelta();
    for (var robotMixer of robotsMixers) {
        robotMixer.update(delta);
    }

    // console.log("ANimate");
    // Mover los robots
    for (robot of robots) {
        if((robot.position.y > 50) && !robot.escaped && !robot.destroyed){
            robot.escaped = true;
            scene.remove(robot);
            robotCount--; // para que sean infinitos
        } else {
            robot.translateY(delta * 12);
        }
    }

    // Añadir robots
    if(robot_idle && robotCount <= 15){
        addRobot();
    }

    // Update score and time
    document.getElementById("score").innerHTML = "Score: " + score;
    document.getElementById("timer").innerHTML = "Time left: " + Math.round(gameDuration - clock.elapsedTime) + " s";
}

function run() {
    requestAnimationFrame(function() { run(); });
    // Render the scene
    renderer.render( scene, camera );
    // Spin the cube for next frame
    animate();
}

// Empieza el juego y run
function startGame(){
    for (i of robots) {
        if (!i.destroyed && !i.escaped) {
            scene.remove(i); // Erase
        }
    }
    game = true;
    score = 0;
    clock = new THREE.Clock()
    robots = [];
    //robotsMixers = [];
    robotCount = 0;

    run();
}
// Reinicia el juego
function restartGame() {
    for (i of robots) {
        if (!i.destroyed && !i.escaped) {
            scene.remove(i); // Erase
        }
    }
    game = true;
    score = 0;
    clock = new THREE.Clock()
    robots = [];
    robotsMixers = [];
    robotCount = 0;
}

// Agrega los robots
function addRobot(){
    //console.log("Add robot");
    // New Robot
    robotCount++;
    var newRobot = cloneFbx(robot_idle);
    newRobot.id = robotCount;
    // console.log(newRobot.id);
    newRobot.destroyed = false;
    newRobot.escaped = false;
    robots.push(newRobot);
    // Animation
    var newRobotMixer = new THREE.AnimationMixer(newRobot);
    newRobotMixer.clipAction(robotsAnimations.run).play();
    robotsMixers.push(newRobotMixer);
    // Position
    newRobot.position.x = Math.random() * (60 + 60) - 60;
    newRobot.position.y = Math.random() * (-45 + -45) - 25;
    newRobot.position.z = Math.random() * (60 + 60) - 60;
    newRobot.rotation.x = 0;

    scene.add(newRobot);
}

function setLightColor(light, r, g, b){
    r /= 255;
    g /= 255;
    b /= 255;

    light.color.setRGB(r, g, b);
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "../images/checker_large.gif";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {

    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(-15, 15, 115);
    scene.add(camera);

    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    // spotLight = new THREE.SpotLight (0xffffff);
    // spotLight.position.set(-30, 8, -10);
    // spotLight.target.position.set(-2, 0, -2);
    // root.add(spotLight);
    //
    // spotLight.castShadow = true;
    //
    // spotLight.shadow.camera.near = 1;
    // spotLight.shadow.camera.far = 200;
    // spotLight.shadow.camera.fov = 45;
    //
    // spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    // spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0x888888 );
    root.add(ambientLight);

    // Create the objects
    loadFBX();

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;

    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    // Now add the group to our scene
    scene.add( root );

    document.addEventListener('mousedown', onDocumentMouseDown);
}

// Interaction
function onDocumentMouseDown(event) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera ); // raycaster

    var intersects = raycaster.intersectObjects( scene.children, true );
    if ( intersects.length > 0 ){
        CLICKED = intersects[ 0 ].object;
        var id = CLICKED.parent.id;
        //console.log(CLICKED.parent.id);
        //console.log(id);
        if(!CLICKED.parent.destroyed){
            CLICKED.parent.destroyed = true;
            //console.log(CLICKED.parent.destroyed);
            score++;
            //console.log(score);
            scene.remove(CLICKED.parent);
        }
    }
}
