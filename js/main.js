var scene = null;
var raycaster = null;
var camera = null;
var centerBlock = null;
var isShowDetailBlock = false;

var main = function(global) {
	window.detailBlock = [];

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
	camera.position.set( 0, 0, 100 );

	// ページにレンダラーを追加する
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	document.body.appendChild( renderer.domElement );

	// 光源を追加する
	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( 0, 0.7, 0.7 );
	scene.add( directionalLight );

	// 描画するボックスを生成
	centerBlock = new Block(30, 30, 30, 0xff0000);
	scene.add( centerBlock.mesh );

	var isScaleBig = true;

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

		/*centerBoxMesh.scale.set(
			centerBoxMesh.scale.x + ( isScaleBig ? 0.01 : -0.01 ),
			centerBoxMesh.scale.y + ( isScaleBig ? 0.01 : -0.01 ),
			centerBoxMesh.scale.z + ( isScaleBig ? 0.01 : -0.01 )
		);
		if (centerBoxMesh.scale.x >= 1.25) {
			isScaleBig = false;
		}
		if (centerBoxMesh.scale.x <= 0.75) {
			isScaleBig = true;
		}*/
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
		if (isShowDetailBlock == false) {
			isShowDetailBlock = true;
			var color = [
				0x00ff00,
				0x0000ff,
				0xffff00,
				0x00ffff,
			];
			/*var position = [
				new THREE.Vector3(-10, 10, 10),	// 左上
				new THREE.Vector3(10, 10, -10),	// 右上
				new THREE.Vector3(-10, -10, -10), // 左下
				new THREE.Vector3(10, -10, 10),	// 右下
			];*/
			var fixedPosition = [
				new THREE.Vector3(-30, 30, 30),		// 左上
				new THREE.Vector3(30, 30, -30),		// 右上
				new THREE.Vector3(-30, -30, -30), 	// 左下
				new THREE.Vector3(30, -30, 30),		// 右下
			];
			var movingDirection = [
				new THREE.Vector3(-0.4, 0.4, 0.4),
				new THREE.Vector3(0.4, 0.4, -0.4),
				new THREE.Vector3(-0.4, -0.4, -0.4),
				new THREE.Vector3(0.4, -0.4, 0.4),	
			];
			for (var i = 0; i < 4; i++) {
				window.detailBlock[i] = new Block(20, 20, 20, color[i]);
				//window.detailBlock[i].setPosition(position[i].x, position[i].y, position[i].z);
				window.detailBlock[i].setPosition(0, 0, 0);
				window.detailBlock[i].setFixedPosition(fixedPosition[i]);
				window.detailBlock[i].setMovingDirection(movingDirection[i]);
				window.detailBlock[i].show();
			}

			window.detailBlock[0].tapAction = function() {
				window.open('https://www.google.co.jp/search?rls=en&q=Three.js&ie=UTF-8&oe=UTF-8&gfe_rd=cr&ei=EU-nV5m5GYaL8QftzqeYCw#safe=off&q=Three.js');
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
			Show : 1,
			MovingToShow : 2,
			MovingToHide : 3,
			Stay : 4,
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
			this.mesh.position.add(this._movingDirection);
			this._position = this.mesh.position;
			if (   this._position.x - this._fixedPosition.x < 0.1
				&& this._position.y - this._fixedPosition.y < 0.1
				&& this._position.z - this._fixedPosition.z < 0.1 ) {
				this.setPosition(this._fixedPosition.x, this._fixedPosition.y, this._fixedPosition.z);
				this._status = this.Status.Show;
			}
			break;

		case this.Status.Show:
			this._status = this.Status.Stay;
			break;

		case this.Status.MovingToHide:
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
	 * 表示
	 */
	show() {
		this._status = this.Status.MovingToShow;
		scene.add(this._mesh);
	}

	/**
	 * 非表示
	 */
	hide() {
		this._status = this.Status.MovingToHide;
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
