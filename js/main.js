var scene = null;
var raycaster = null;
var camera = null;
var centerBlock = null;
var isShowDetailBlock = false;

var main = function(global) {
	window.detailBlock = [];
	window.maleModel = null;

	scene = new THREE.Scene();
	raycaster = new THREE.Raycaster()
	
	var width 	= window.innerWidth;
	var height 	= window.innerHeight;
	var fov 	= 60;				// 画角
	var aspect	= width / height;	// 撮影結果縦横比
	var near	= 1;				// ニアークリップの距離（ここより近い部分は描画されない）
	var far		= 1000;				// ファークリップの距離（ここより遠い部分は描画されない）
	camera	= new THREE.PerspectiveCamera( fov, aspect, near, far );

	// カメラの位置を設定
	camera.position.set( 0, 0, 120 );

	// ページにレンダラーを追加する
	var renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xffffff, 1 );
	renderer.setSize( width, height );
	document.getElementById("content").appendChild( renderer.domElement );

	// カメラを移動できるようにコントローラーを追加する
	var controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;
	controls.dampingFactor = 0.5;
	controls.enablePan = true;
	controls.enableZoom = true;
	controls.minDistance = 50.0;
	controls.maxDistance = 200.0;
	controls.target.set( 0, 0, 0 );
	controls.maxPolarAngle = Math.PI * 0.5;

	// 光源を追加する
	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( 0, 0.7, 0.7 );
	scene.add( directionalLight );

	// 描画するボックスを生成
	centerBlock = new Block(20, 20, 20, 0xff0000);
	centerBlock.setPosition(0, -55, 0);
	scene.add( centerBlock.mesh );

	// 描画するモデルを読み込み
	window.maleModel = new Model3D("obj/male.obj", null);

	var isScaleBig = true;

	var color = [
		0x00ff00,
		0x0000ff,
		0xffff00,
		0x00ffff,
	];		
	var fixedPosition = [
		new THREE.Vector3(-30, 30, 30),		// 左上
		new THREE.Vector3(30, 30, -30),		// 右上
		new THREE.Vector3(-30, -30, -30), 	// 左下
		new THREE.Vector3(30, -30, 30),		// 右下
	];		
	for (var i = 0; i < 4; i++) {
		window.detailBlock[i] = new Block(20, 20, 20, color[i]);
		window.detailBlock[i].setPosition(0, 0, 0);
		window.detailBlock[i].setFixedPosition(fixedPosition[i]);
	}

	// 描画ループ
	( function renderLoop () {
		requestAnimationFrame( renderLoop );
		centerBlock.setRotation(
			0,
			centerBlock.rotation.y + 0.01,
			centerBlock.rotation.z + 0.01
		);

		if (isShowDetailBlock) {
			if (window.detailBlock.length > 0) {
				var i = 0, blockLen = window.detailBlock.length;
				for ( ; i < blockLen; i++) {
					window.detailBlock[i].animation();
				}
			}
		}

		window.maleModel.animation();

		// 描画
		renderer.render( scene, camera );
	} )();
}

window.addEventListener('DOMContentLoaded', main, false);

/**
 * マウスアップイベント
 * - マウスアップ時にタッチしたオブジェクトを判定する
 * @param event イベント情報
 */
window.onmouseup = function(event) {
	var rect = event.target.getBoundingClientRect();

	// マウス位置(2D)
	var mouseX = event.pageX - rect.left;
	var mouseY = event.pageY - rect.top;

	// マウス位置(3D)
	mouseX =  (mouseX / window.innerWidth)  * 2 - 1;
	mouseY = -(mouseY / window.innerHeight) * 2 + 1;

	var pos = new THREE.Vector3(mouseX, mouseY, 0.5).unproject( camera );
	raycaster.ray.set( camera.position, pos.sub(camera.position).normalize() );

	var obj = raycaster.intersectObjects([centerBlock.mesh]);

	if (obj.length > 0) {
		for (var i = 0; i < 4; i++) {
			window.detailBlock[i].toggle();
		}

		if (isShowDetailBlock == false) {
			isShowDetailBlock = true;

			window.detailBlock[0].tapAction = function() {
				window.open('https://www.google.co.jp/search?rls=en&q=Three.js&ie=UTF-8&oe=UTF-8&gfe_rd=cr&ei=EU-nV5m5GYaL8QftzqeYCw#safe=off&q=Three.js');
			}
			window.detailBlock[1].tapAction = function() {
				swal("タイトル", "オッケーです。", "success");
			}
			window.detailBlock[2].tapAction = function() {
				window.maleModel.startRotate();
			}
			window.detailBlock[3].tapAction = function() {
				window.maleModel.stopRotate();
			}
		}

		return true;
	}

	var detailMesh = [];

	for (var i = 0; i < window.detailBlock.length; i++) {
		detailMesh[i] = window.detailBlock[i].mesh;
	}

	obj = raycaster.intersectObjects(detailMesh);
	if (obj.length > 0) {
		for (var i = 0; i < obj.length; i++) {
			for (var j = 0; j < detailMesh.length; j++) {
				if (obj[i].object.uuid === detailMesh[j].uuid) {
					window.detailBlock[j].tapAction();
					return true;
				}
			}
		}
	}
}

/**
 * マウスムーブイベント
 * - マウスムーブ時に小ブロックにマウスを乗せているかを判定する
 * @param event イベント情報
 */
window.onmousemove = function(event) {
	if (isShowDetailBlock == true) {
		var rect = event.target.getBoundingClientRect();

		// マウス位置(2D)
		var mouseX = event.pageX - rect.left;
		var mouseY = event.pageY - rect.top;

		// マウス位置(3D)
		mouseX =  (mouseX / window.innerWidth)  * 2 - 1;
		mouseY = -(mouseY / window.innerHeight) * 2 + 1;

		var pos = new THREE.Vector3(mouseX, mouseY, 0.5).unproject( camera );
		raycaster.ray.set( camera.position, pos.sub(camera.position).normalize() );

		var detailMesh = [];

		for (var i = 0; i < window.detailBlock.length; i++) {
			detailMesh[i] = window.detailBlock[i].mesh;
		}
		
		var obj = raycaster.intersectObjects(detailMesh);
		if (obj.length > 0) {
			for (var i = 0; i < obj.length; i++) {
				for (var j = 0; j < detailMesh.length; j++) {
					if (obj[i].object.uuid === detailMesh[j].uuid) {
						window.detailBlock[j].mouseOver();
					}
				}
			}
		} else {
			for (var i = 0; i < window.detailBlock.length; i++) {
				detailMesh[i] = window.detailBlock[i].mouseOut();
			}
		}
	}
}


/**
 * ブロッククラス
 */
class Block {
	constructor(sizeX, sizeY, sizeZ, colorHex) {
		this._geometry = new THREE.CubeGeometry(sizeX, sizeY, sizeZ);
		this._material = new THREE.MeshPhongMaterial( {color:colorHex} );
		this._mesh = new THREE.Mesh(this._geometry, this._material);

		this._fixedPosition = new THREE.Vector3(0, 0, 0);
		this._position = new THREE.Vector3(0, 0, 0);
		this._rotation = new THREE.Vector3(0, 0, 0);
		this._scale = new THREE.Vector3(1, 1, 1);

		this._isMouseOver = false;
		this._rotationX = 0.01;
		this._rotationY = 0.02;

		this.Status = {
			Hide : 0,
			MovingToShow : 1,
			MovingToHide : 2,
			Stay : 3,
		};
		this._status = this.Status.Hide;

		this.tapAction = function(){};
	}

	/**
	 * getter
	 */
	get mesh() {
		return this._mesh;
	}
	get rotation() {
		return this._rotation;
	}
	get scale() {
		return this._scale;
	}

	/**
	 * 回転位置を設定する
	 * @param x X位置
	 * @param y Y位置
	 * @param z Z位置
	 */
	setRotation(x, y, z) {
		this._rotation.set(x, y, z);
		this._mesh.rotation.set(x, y, z);
	}

	/**
	 * 表示位置を設定する
	 * @param x X位置
	 * @param y Y位置
	 * @param z Z位置
	 */
	setPosition(x, y, z) {
		this._position.set(x, y, z);
		this._mesh.position.set(x, y, z);
	}

	/**
	 * 固定位置を設定する
	 * @param x X位置
	 * @param y Y位置
	 * @param z Z位置
	 */
	setFixedPosition(position) {
		this._fixedPosition = position;
	}

	/**
	 * アニメーション実行
	 */
	animation() {
		switch (this._status) {
		case this.Status.Hide:
			break;

		case this.Status.MovingToShow:
			this._position = this.mesh.position;
			/*if (   this._position.x - this._fixedPosition.x < 0.1
				&& this._position.y - this._fixedPosition.y < 0.1
				&& this._position.z - this._fixedPosition.z < 0.1 ) {
				this.setPosition(this._fixedPosition.x, this._fixedPosition.y, this._fixedPosition.z);
				this._status = this.Status.Show;
			}*/
			break;

		case this.Status.MovingToHide:
			this._position = this.mesh.position;
			break;

		case this.Status.Stay:
			if (this._isMouseOver) {
				this.setRotation(
					this._rotation.x + this._rotationX,
					this._rotation.y,
					this._rotation.z
				);
			} else {
				this.setRotation(
					this._rotation.x,
					this._rotation.y + this._rotationY,
					this._rotation.z
				);
			}
			break;
		}
	}

	/**
	 * 移動方向を設定する
	 */
	setMovingDirection(movingDir) {
		this._movingDirection = movingDir;
	}

	/**
	 * 表示切り替え
	 **/
	toggle() {
		if ( this._status == this.Status.Hide ) {
			this.show();
		} else if ( this._status == this.Status.Stay ) {
			this.hide();
		}
	}

	/**
	 * 表示
	 */
	show() {
		this._status = this.Status.MovingToShow;
		var that = this;
		createjs.Tween.get(this._mesh.position)
		.to({x: this._fixedPosition.x, y:this._fixedPosition.y, z:this._fixedPosition.z}, 2000, createjs.Ease.elasticOut)
		.call(function(){ that._status = that.Status.Stay });
		scene.add(this._mesh);
	}

	/**
	 * 非表示
	 */
	hide() {
		this._status = this.Status.MovingToHide;
		var that = this;
		createjs.Tween.get(this._mesh.position)
		.to({x: 0, y: 0, z: 0}, 1000, createjs.Ease.quadraticIn)
		.call(function(){ 
			that._status = that.Status.Hide;
			scene.remove(that._mesh);
		});
	}

	/**
	 * マウスを乗せた時のイベント
	 */
	mouseOver() {
		if ( !this._isMouseOver ) {
			this._isMouseOver = true;
		}
	}

	/**
	 * マウスを離した時のイベント
	 */
	mouseOut() {
		if ( this._isMouseOver ) {
			this._isMouseOver = false;
			this._rotationX = -this._rotationX;
			this._rotationY = -this._rotationY;
		}
	}
}

/**
 * 3Dモデルクラス
 */
class Model3D {
	constructor(modelPath, materialPath) {
		this.loadManager = new THREE.LoadingManager();
		this.loadManager.onProgress = this.onLoadingProgress;
		this.loadManager.onError = this.onLoadingError;
		
		this.objLoader = new THREE.OBJLoader( this.loadManager );
		var that = this;
		this.objLoader.load(modelPath, function(model) {
			that._isLoaded = true;
			that._model = model;
			model.scale.set(4, 4, 4);
			model.position.y -= 40;

			var obj = new THREE.Object3D();
			obj.add(model);
			scene.add(obj);

		} );

		this._isRotate = false;
		this._isLoaded = false;
	}

	/**
	 * モデル読み込み処理
	 */
	onLoadingProgress( xhr ) {
		if ( xhr.lengthComputable ) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log( Math.round(percentComplete, 2) + "% downloaded" );
		}
	}

	/**
	 * モデル読み込み失敗
	 */
	onLoadingError() {
		swal("Failed", "3Dオブジェクト読み込み失敗", "error");
	}

	/**
	 * アニメーション表示
	 */
	animation() {
		if ( this._isLoaded && this._isRotate ) {
			this._model.rotation.set(
				this._model.rotation.x,
				this._model.rotation.y + 0.05,
				this._model.rotation.z
			);
		}
	}

	startRotate() {
		this._isRotate = true;
	}

	stopRotate() {
		this._isRotate = false;
	}

	set isLoaded(loaded) {
		this._isLoaded = loaded;
	}

	get isLoaded() {
		return this._isLoaded;
	}
}