var canvas;
var gl;
var colorLoc;
var modelViewLoc;
var projectionLoc;

var widthTriangles = 2*boardDiffX/12;
var lightBrown = vec4(0.2, 0.05, 0.05, 1.0);
var darkBrown = vec4(0.6, 0.45, 0.05, 1.0);
var vertices = [];
var colors = [];
var shadowColor = vec4(0.0, 0.0, 0.0, 1.0);
var indices = [];
var theta = [];
var angles = [];
var c = [];
var s = [];

var allTriangles = [];
var boardVertices = [];
var boardDiffX = 27;
var boardDiffZ = 18;
var greenOffset = 1;
var triangleWidth = 5;
var tableSize = 20;
var tableSize2 = tableSize / 2.0;
var windowMin = -tableSize2;
var windowMax = tableSize + tableSize2;
var light = vec3(tableSize2, tableSize * 2, tableSize2); // position of light

var gameBoardCoordinates = [vec4(-boardDiffX + greenOffset, tableSize + 10.1, boardDiffZ - greenOffset, 1.0),
							vec4(-boardDiffX + greenOffset, tableSize + 10.1, -boardDiffZ + greenOffset, 1.0),
							vec4(boardDiffX - greenOffset, tableSize + 10.1, boardDiffZ - greenOffset, 1.0),
							vec4(boardDiffX - greenOffset, tableSize + 10.1, -boardDiffZ + greenOffset, 1.0)];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var rotate = false;

var projection;
var modelView;
var shadowProjection;
var aspect;

window.onload = function init() {
	canvas = document.getElementById("gl-canvas");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) { alert("WebGL isn't available"); }

	// Load vertices and colors for cube faces

	boardVertices = [
		vec4(-boardDiffX, 1.0, boardDiffZ, 1.0),
		vec4(-boardDiffX, tableSize + 10, boardDiffZ, 1.0),
		vec4(boardDiffX, tableSize + 10, boardDiffZ, 1.0),
		vec4(boardDiffX, 1.0, boardDiffZ, 1.0),
		vec4(-boardDiffX, 1.0, -boardDiffZ, 1.0),
		vec4(-boardDiffX, tableSize + 10, -boardDiffZ, 1.0),
		vec4(boardDiffX, tableSize + 10, -boardDiffZ, 1.0),
		vec4(boardDiffX, 1.0, -boardDiffZ, 1.0),
		vec4(-boardDiffX + greenOffset, tableSize + 10.1, boardDiffZ - greenOffset, 1.0),
		vec4(-boardDiffX + greenOffset, tableSize + 10.1, -boardDiffZ + greenOffset, 1.0),
		vec4(boardDiffX - greenOffset, tableSize + 10.1, boardDiffZ - greenOffset, 1.0),
		vec4(boardDiffX - greenOffset, tableSize + 10.1, -boardDiffZ + greenOffset, 1.0),
	];



	// Load indices to represent the triangles that will draw each face

	// indices = [
	// 	1, 0, 3, 3, 2, 1,  // front face
	// 	2, 3, 7, 7, 6, 2,  // right face
	// 	3, 0, 4, 4, 7, 3,  // bottom face
	// 	6, 5, 1, 1, 2, 6,  // top face
	// 	4, 5, 6, 6, 7, 4,  // back face
	// 	5, 4, 0, 0, 1, 5,   // left face
	// 	9, 8, 10, 10, 11, 9 //green board
	// ];

	this.vertices = [boardVertices[1], boardVertices[0],boardVertices[3],boardVertices[3],
					boardVertices[2], boardVertices[1],
					boardVertices[6], boardVertices[5],boardVertices[1],boardVertices[1],
					boardVertices[2], boardVertices[6]];

	for(var i = 0; i < 12; i++){
		if ( i < 6) this.colors.push(lightBrown);
		else this.colors.push(this.darkBrown);
	}

	this.vertices.push(this.boardVertices[9]);
	this.vertices.push(this.boardVertices[8]);
	this.vertices.push(this.boardVertices[10]);
	this.vertices.push(this.boardVertices[10])
	this.vertices.push(this.boardVertices[11]);
	this.vertices.push(this.boardVertices[9]);

	for(var i = 0; i < 6; i++) this.colors.push(vec4(0.0,1.0,0.0,1.0));

	for(var i = 0; i< 12; i++){
		allTriangles.push(new Triangle())
	}



	theta[0] = 68.0;
	theta[1] = 0.0;
	theta[2] = 0.0;

	//
	//  Configure WebGL
	//
	gl.viewport(0, 0, canvas.width, canvas.height);
	aspect = canvas.width / canvas.height;
	gl.clearColor(0.7, 0.7, 0.7, 1.0);
	gl.enable(gl.DEPTH_TEST);
	projection = perspective(45.0, aspect, 1, 20 * tableSize);

	// Register event listeners for the buttons

	var a = document.getElementById("XButton");
	a.addEventListener("click", function () { axis = xAxis; });
	var b = document.getElementById("YButton");
	b.addEventListener("click", function () { axis = yAxis; });
	var c = document.getElementById("ZButton");
	c.addEventListener("click", function () { axis = zAxis; });
	var d = document.getElementById("Reset");
	d.addEventListener("click", function () { theta = [0.0, 0.0, 0.0]; axis = xAxis; });
	var e = document.getElementById("StartStop");
	e.addEventListener("click", function () { rotate = !rotate; });

	//  Load shaders and initialize attribute buffers

	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	// colorLoc = gl.getUniformLocation(program, "color");
	modelViewLoc = gl.getUniformLocation(program, "modelView");
	projectionLoc = gl.getUniformLocation(program, "projection");

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	// var iBuffer = gl.createBuffer();
	// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	// gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

	render();
};

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	if (rotate) {
		theta[axis] += 0.5;
	}
	for (i = 0; i < 3; i++) {
		angles[i] = radians(theta[i]);
		c[i] = Math.cos(angles[i]);
		s[i] = Math.sin(angles[i]);
	}

	rx = mat4(1.0, 0.0, 0.0, 0.0,
		0.0, c[0], -s[0], 0.0,
		0.0, s[0], c[0], 0.0,
		0.0, 0.0, 0.0, 1.0);

	ry = mat4(c[1], 0.0, s[1], 0.0,
		0.0, 1.0, 0.0, 0.0,
		-s[1], 0.0, c[1], 0.0,
		0.0, 0.0, 0.0, 1.0);

	rz = mat4(c[2], -s[2], 0.0, 0.0,
		s[2], c[2], 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		0.0, 0.0, 0.0, 1.0);

	tz1 = mat4(1.0, 0.0, 0.0, -tableSize2,
		0.0, 1.0, 0.0, -tableSize2,
		0.0, 0.0, 1.0, -tableSize2 + 15,
		0.0, 0.0, 0.0, 1.0);

	tz2 = mat4(1.0, 0.0, 0.0, tableSize2 * 2,
		0.0, 1.0, 0.0, tableSize2,
		0.0, 0.0, 1.0, tableSize2,
		0.0, 0.0, 0.0, 1.0);

	looking = lookAt(vec3(tableSize2, tableSize2, 4 * tableSize), vec3(tableSize2, tableSize2, 0), vec3(0.0, 1.0, 0.0));
	rotation = mult(rz, mult(ry, rx));
	modelView = mult(looking, mult(tz2, mult(rotation, tz1)));
	gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
	gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
	
	// for (var i = 0; i < boardVertices.length; i++) {
	// 	if(i/4 >= 1) gl.uniform4fv(colorLoc, colors[0]);
	// 	else gl.uniform4fv(colorLoc, colors[1]);
	// }
		gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
	

	// Do the shadow.
	// shadowProjection = mat4();
	// shadowProjection[3][3] = 0;
	// shadowProjection[3][1] = -1/light[1];
	// modelView = mult(modelView, translate(light[0], light[1], light[2]));
	// modelView = mult(modelView, shadowProjection);
	// modelView = mult(modelView, translate(-light[0], -light[1], -light[2]));
	// gl.uniformMatrix4fv (modelViewLoc, false, flatten(modelView));
	// gl.uniform4fv(colorLoc, shadowColor);
	// for (var i=0; i<6; i++){
	// 	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 6*i);
	// }

	requestAnimFrame(render);
};

class Triangle{
	constructor(x, z){
		this.x = x;
		this.z = z;
		this.stack = [];
	}

	pushVertices(){
		this.vertices.push(vec3(x, 11, z),vec3(x+widthTriangles, 11, z),vec3(x+(0.5*widthTriangles), 11, z))
	}


}