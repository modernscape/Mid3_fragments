import * as THREE from "three"
import {OrbitControls} from "three/addons/controls/OrbitControls.js"
import {RGBELoader} from "three/addons/loaders/RGBELoader.js"
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js"
import {PMREMGenerator} from "three"
// import * as Utils from "./topUtils.js"
import * as Utils from "./topUtils.js"

import {LineGeometry} from "three/addons/lines/LineGeometry.js"
import {LineMaterial} from "three/addons/lines/LineMaterial.js"
import {LineSegments2} from "three/addons/lines/LineSegments2.js"
import {Line2} from "three/addons/lines/Line2.js"

/////////////////////////////////////////////////////////////////
// custom
/////////////////////////////////////////////////////////////////

// Webgl
// 　└ stage
// 　└ particle

/////////////////////////////////////////////////////////////////
// Stage
/////////////////////////////////////////////////////////////////

class Stage {
  constructor() {
    this.rendererParam = {
      clearColor: 0x333333,
      width: window.innerWidth,
      height: window.innerHeight,
    }
    this.cameraParam = {
      fov: 45,
      near: 0.1,
      far: 20000,
      lookAt: new THREE.Vector3(0, 0, 0),
      x: 0,
      y: 0,
      z: 2000,
    }
    this.scene = null
    this.camera = null
    this.renderer = null
    this.isInitialized = false
    this.orbitControls = null
    this.isDev = false
  }
  init() {
    this._setScene()
    this._setRender()
    this._setCamera()
    this._setDev()
    this._setLight()
  }
  _setScene() {
    this.scene = new THREE.Scene()
  }
  _setRender() {
    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(new THREE.Color(this.rendererParam.clearColor))
    this.renderer.setSize(this.rendererParam.width, this.rendererParam.height)
    const wrapper = document.getElementById("webgl")
    wrapper.appendChild(this.renderer.domElement)
  }
  _setCamera() {
    // 初回のみ
    if (!this.isInitialized) {
      this.camera = new THREE.PerspectiveCamera(0, 0, this.cameraParam.near, this.cameraParam.far)
      this.camera.position.set(this.cameraParam.x, this.cameraParam.y, this.cameraParam.z)
      this.camera.lookAt(this.cameraParam.lookAt)
      this.isInitialized = true
    }
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    this.camera.aspect = windowWidth / windowHeight
    this.camera.fov = this.cameraParam.fov

    this.camera.updateProjectionMatrix() // ⭐️⭐️⭐️
    this.renderer.setSize(windowWidth, windowHeight)
  }
  _setLight() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    const L = 5000
    directionalLight.shadow.camera.top = L
    directionalLight.shadow.camera.bottom = -L
    directionalLight.shadow.camera.left = -L
    directionalLight.shadow.camera.right = L
    directionalLight.shadow.camera.near = 0
    directionalLight.shadow.camera.far = L * 3

    directionalLight.position.set(500, 1000, 500)
    directionalLight.castShadow = true

    // 影の解像度を設定
    const mapS = 4096
    directionalLight.shadow.mapSize.set(mapS, mapS)

    const ambientLight = new THREE.AmbientLight(0xff0000, 1.0)

    // this.scene.add(ambientLight);
    // this.scene.add(directionalLight);

    const helper = new THREE.DirectionalLightHelper(directionalLight)
    // this.scene.add(helper);

    const pointLight = new THREE.PointLight(0xffffff, 1, 10)
    pointLight.position.set(-20, -60, 70)
    // this.scene.add(pointLight);

    const sphereSize = 10
    const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize)
    // this.scene.add(pointLightHelper);

    const pointLight2 = new THREE.PointLight(0x0000ff, 0.5, 10)
    pointLight2.position.set(20, 60, -70)
    // this.scene.add(pointLight2);

    const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, sphereSize)
    // this.scene.add(pointLightHelper2);

    const pointLight3 = new THREE.PointLight(0xff00ff, 0.3, 10)
    pointLight3.position.set(20, -100, -50)
    // this.scene.add(pointLight3);

    const pointLightHelper3 = new THREE.PointLightHelper(pointLight3, sphereSize)
    // this.scene.add(pointLightHelper3);
  }
  _setDev() {
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.orbitControls.enableDamping = true
    // this.orbitControls.enableZoom = false;
    this.orbitControls.enablePan = false
    this.orbitControls.maxDistance = 2000
    this.orbitControls.minDistance = 1

    // console.log(this.orbitControls.target);

    const stage = this
    Utils.setCameraState(stage)

    // const setCameraState = () => {
    //   window.addEventListener('keydown', function (e) {
    //     if (e.key == 's') {
    //       Utils.saveCameraAttributeToLocal(stage.camera, stage.orbitControls);
    //     }
    //     if (e.key == 'l') {
    //       Utils.loadCameraAttributeFromLocal(stage.camera, stage.orbitControls);
    //     }
    //   });

    //   let twoFingerTap = false;

    //   document.addEventListener('touchstart', (event) => {
    //     if (event.touches.length === 2) {
    //       twoFingerTap = true;
    //     }
    //   });

    //   document.addEventListener('touchend', (event) => {
    //     if (twoFingerTap && event.touches.length === 0) {
    //       Utils.saveCameraAttributeToLocal(stage.camera, stage.orbitControls);
    //     }
    //     twoFingerTap = false;
    //   });
    // };
    // setCameraState();

    Utils.loadCameraAttributeFromLocal(this.camera, this.orbitControls)

    this.isDev = true

    Utils.makeEnvironment(stage)
  }
  _render() {
    this.renderer.render(this.scene, this.camera)
    if (this.isDev) this.orbitControls.update()
  }
  onResize() {
    this._setCamera()
  }
  onRaf() {
    this._render()
    // const speed = 0.001;
    // if (!this.model) return;
    // this.model.rotation.x += speed;
    // this.model.rotation.y += speed;
    // this.model.rotation.z += speed;
  }
} // Stage

/////////////////////////////////////////////////////////////////
// Particle
/////////////////////////////////////////////////////////////////

class Particle {
  constructor(stage) {
    this.stage = stage
    this.promiseList = []
    this.baseMeshes = []
    this.meshes = []
    this.positions = []
    this.firstPositions = [] // start
    this.positions_dest = [] // to
    this.wires = [] // from, to
    this.pointAry = []
    this.meshesMaken = false
    this.meshesCount = 1200
    this.model = null
    this.wireOpacity = 0.1 // 0.02
    this.repeatCount = 0
    this.animated = false
    this.animating = true
  }
  init() {
    // this.pathList.forEach((image) => {
    //   this.promiseList.push(
    //     new Promise((resolve) => {
    //       const img = new Image();
    //       img.src = image;
    //       img.crossOrigin = 'anonymous';
    //       img.addEventListener('load', () => {
    //         this.imageList.push(ImagePixel(img, img.width, img.height, 20.0));
    //         resolve();
    //       });
    //     })
    //   );
    // });
    Promise.all(this.promiseList).then(() => {
      this._setMesh()
      // this._setAutoPlay();
    })
  }

  _setMesh() {
    const stage = this.stage
    const particle = this
    const GRAVITY = -2.0 // -9.81  大きすぎると、衝突バグる

    const axes = new THREE.AxesHelper(100)
    // stage.scene.add(axes);

    async function init() {
      // （1）loadGLTF
      await Utils.loadGLTF(particle, "./model/24-12-16_fragments.glb")

      // (2) meshes 作成
      await Utils.makeMeshes(stage, particle)

      // wireTypesの追加
      const t0 = await Utils.make3DText("paper works", 0xff0000, 10)
      Utils.wireTypes.push(t0.geometry)
      const t1 = await Utils.make3DText("b t w", 0xff0000, 20, 1)
      Utils.wireTypes.push(t1.geometry)
      const t2 = await Utils.make3DText("mid sense", 0xff0000, 10, 1)
      Utils.wireTypes.push(t2.geometry)

      const wire_01 = await Utils.loadGLTF(new Object(), "./model/25-01-13_wire_01.glb")
      Utils.wireTypes.push(wire_01[0].geometry)

      const wire_02 = await Utils.loadGLTF(new Object(), "./model/25-01-13_parallelepiped2.glb")
      Utils.wireTypes.push(wire_02[0].geometry)

      const wire_03 = await Utils.loadGLTF(new Object(), "./model/25-01-13_moon.glb")
      Utils.wireTypes.push(wire_03[0].geometry)

      // (3) 形状作成  0:SphereGeometry ...
      const rand0 = parseInt(Math.random() * Utils.wireTypes.length)
      particle.wires.push(Utils.makeWire(rand0, particle.wireOpacity)) // from
      const rand1 = parseInt(Math.random() * Utils.wireTypes.length)
      particle.wires.push(Utils.makeWire(rand1, 0.0)) // to
      particle.model.add(particle.wires[0])
      particle.model.add(particle.wires[1])

      particle.model.visible = true

      //（4）点群取得
      particle.positions = await Utils.geometryPositionsWithNumber(particle.wires[0].geometry, particle.meshesCount)

      //（5）meshes 配置   <--- (2)
      await Utils.locateMeshes(particle)

      // アニメーションループ
      function animateMeshes() {
        if (!particle.animating) return
        requestAnimationFrame(animateMeshes)

        particle.model?.traverse((child) => {
          if (child.isMesh) {
            if (isNaN(child.speed)) return // ⭐️⭐️⭐️
            const add = Math.round(child.speed * 1000) / 100
            child.rotation.x += add
            child.rotation.y -= add * 2
            child.rotation.z += add
          }
        })
      }
      if (particle.animated == false) {
        animateMeshes()
        particle.animated = true
      }

      // Utilsに移行
      const FLOOR = "_floor"
      const action = (mesh) => {
        if (mesh.name != FLOOR) {
          console.log(mesh.name)

          //   info.innerHTML = mesh.name;
          //   if (mesh.name.includes('m_')) {
          //     mesh.isMoving = !mesh.isMoving;

          //     if (!mesh.isMoving) {
          //       mesh.material.color = new THREE.Color(0xff0000);
          //     } else {
          //       mesh.material.color = new THREE.Color(0xffffff);
          //     }
          //     mesh.material.wireframe = !mesh.isMoving;
          //   }
          // } else {
        }
      }

      const checkTapMesh = () => {
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        // const info = document.getElementById('info');
        window.addEventListener("click", (event) => {
          mouse.x = (event.clientX / window.innerWidth) * 2 - 1
          mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
          raycaster.setFromCamera(mouse, stage.camera)
          const intersects = raycaster.intersectObjects(particle.meshes)
          if (intersects.length > 0) {
            const intersectedObject = intersects[0].object
            action(intersectedObject)
          }
        })
      }
      checkTapMesh()

      // (6) アニメーション先のpositionsを設定
      particle.positions = await Utils.geometryPositionsWithNumber(particle.wires[1].geometry, particle.meshesCount)

      //（7）座標アニメーション
      await Utils.effect_exchange(particle)

      //（8）ループ
      const loopCount = 5
      for (let i = 0; i < loopCount; i++) {
        // wire 0
        particle.wires.shift()
        particle.wires[0].material.opacity = particle.wireOpacity
        // wire 1
        const rand = parseInt(Math.random() * Utils.wireTypes.length)
        particle.wires.push(Utils.makeWire(rand, 0.0)) // to
        particle.model.add(particle.wires[1])

        // (6) アニメーション先のpositionsを設定
        particle.positions = await Utils.geometryPositionsWithNumber(particle.wires[1].geometry, particle.meshesCount)

        //（7）座標アニメーション
        const flag = i == loopCount - 1
        await Utils.effect_exchange(particle, flag)
      }
      const a = await Utils.showBaseMesh(particle)

      let childCount = particle.model.children.length

      // wireを除去
      const removeWires = () => {
        // 配列の要素数に干渉するので逆からやる
        for (let i = childCount - 1; i >= 0; i--) {
          const child = particle.model.children[i]
          if (child.name == "wire") {
            particle.model.remove(child)
          }
        }
      }
      removeWires()

      // (8) GLTF上の点を取得
      const crosses = ["cross", "circle", "triangle"] //, 'square'];
      const rand = Math.floor(Math.random() * crosses.length)
      const name = crosses[rand]
      const crossPositions = Utils.makePositionsOnShape(name, particle.model.children.length)

      // (9) crossに配置
      await Utils.alignMeshes(particle, crossPositions)

      const rotateUp = () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            particle.animating = false
          }, 3000)

          gsap.to(particle.model.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: 2,
            delay: 3,
            onComplete: () => {
              setTimeout(() => {
                resolve()
                // particle.animating = true;
              }, 2000)
            },
          })
        })
      }
      await rotateUp()

      // const fallMeshes1 = () => {
      //   return new Promise((resolve) => {
      //     const dest = 110;
      //     for (let i = 0; i < particle.model.children.length; i++) {
      //       const child = particle.model.children[i];
      //       gsap.to(child.position, {
      //         x: Math.random() * dest * 2 - dest,
      //         y: -dest,
      //         z: Math.random() * dest * 2 - dest,
      //         delay: 5 + i * 0.01,
      //         duration: 1.5,
      //         ease: 'bounce.out',
      //         onComplete: () => {
      //           if (i == particle.model.children.length - 1) {
      //             setTimeout(resolve(), 3000);
      //           }
      //         },
      //       });
      //     }
      //   });
      // };
      // await fallMeshes1();

      // const fallMeshes2 = () => {
      //   return new Promise((resolve) => {
      //     const dest2 = 10000;
      //     for (let i = 0; i < particle.model.children.length; i++) {
      //       const child = particle.model.children[i];
      //       gsap.to(child.position, {
      //         // x: Math.random() * dest * 2 - dest,
      //         y: -dest2,
      //         // z: Math.random() * dest * 2 - dest,
      //         delay: 2,
      //         duration: 3.0,
      //         ease: 'power2.in',
      //         onComplete: () => {
      //           if (i == particle.model.children.length - 1) {
      //             setTimeout(resolve(), 2000);
      //           }
      //         },
      //       });
      //     }
      //   });
      // };
      // await fallMeshes2();

      stage.renderer.setClearColor(new THREE.Color(0x000000))

      const meshToSand = (mesh, i) => {
        const interval = 0.1
        return new Promise((resolve) => {
          const delay = i * interval
          const h = Math.random()
          const s = Math.random() * 0.7 + 0.3
          const l = Math.random() * 0.8
          const color = new THREE.Color().setHSL(h, 1.0, l)
          const size = Math.random() * 0.5 + 1.0
          Utils.geometryPositionsWithNumber(mesh.geometry, 300).then((pos) => {
            const geometry = new THREE.BufferGeometry()
            geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3))
            const material = new THREE.PointsMaterial({
              color: color,
              size: size,
              map: new THREE.TextureLoader().load("/src/img/dot.png"),
              transparent: true,
              blending: THREE.AdditiveBlending,
              depthTest: false,
              opacity: 0.0,
            })
            const points = new THREE.Points(geometry, material)
            mesh.add(points)
            gsap.to(mesh.material, {
              opacity: 0.03,
              delay: delay + 0.3,
              duration: 0.4,
            })
            const s = 1000
            gsap.to(points.material, {
              opacity: 1.0,
              delay: delay,
              duration: 0.3,
              onComplete: () => {
                gsap.to(points.scale, {
                  x: s,
                  y: s,
                  z: s,
                  duration: 0.7,
                  delay: 3,
                  ease: "power2.in",
                  onComplete: () => {
                    mesh.remove(points)
                    if (i == particle.model.children.length - 1) {
                      resolve()
                    }
                  },
                })
                gsap.to(points.material, {
                  opacity: 0.0,
                  delay: 3.1,
                  duration: 0.13,
                })
              },
            })
            if (i < particle.model.children.length - 1) resolve()
          })
        })
      }

      for (let i = 0; i < particle.model.children.length; i++) {
        const mesh = particle.model.children[i]
        await meshToSand(mesh, i)
      }

      const hideParticle = () => {
        return new Promise((resolve) => {
          for (let i = 0; i < particle.model.children.length; i++) {
            const child = particle.model.children[i]
            gsap.to(child.material, {
              opacity: 0.0,
              delay: 0.0,
              duration: 1.0,
              onComplete: () => {
                if (i == particle.model.children.length - 1) {
                  setTimeout(() => {
                    resolve()
                  }, 2000)
                }
              },
            })
          }
        })
      }
      await hideParticle()

      const resetParticle = () => {
        particle.model.visible = false
        particle.baseMeshes = []
        particle.meshes = []
        particle.positions = []
        particle.firstPositions = [] // start
        particle.positions_dest = [] // to
        particle.wires = [] // from, to
        particle.pointAry = []
        particle.meshesMaken = false
        particle.model = null
        particle.animating = true
      }
      resetParticle()
      particle.repeatCount++
      console.log(`end init ${particle.repeatCount} ${particle.repeatCount == 1 ? "time" : "times"}`)
    }
    // init();
    async function main() {
      while (true) {
        await init()
      }
    }
    main()
  } // _setMesh()

  _render() {}
  onResize() {}
  onRaf() {
    const speed = 0.001
    if (!this.model) return
    if (this.animating) {
      this.model.rotation.y += speed
      this.model.rotation.z += speed
      this.model.rotation.x += speed
    }

    // if (this.mesh) {
    //   this.mesh.material.uniforms.u_time.value += 0.02;
    //   this.mesh.rotation.y += 0.005;
    // }

    // const particle = this;

    // function animateMeshes() {
    //   requestAnimationFrame(animateMeshes);

    //   particle.model?.traverse((child) => {
    //     if (child.isMesh) {
    //       if (isNaN(child.speed)) return; // ⭐️⭐️⭐️
    //       const add = Math.round(child.speed * 1000) / 5000;
    //       child.rotation.x += add;
    //       child.rotation.y -= add * 2;
    //       child.rotation.z += add;
    //     }
    //   });
    // }
    // animateMeshes();
  }
} // Particle

/////////////////////////////////////////////////////////////////
//  WebGL（全体）
/////////////////////////////////////////////////////////////////

class Webgl {
  constructor() {
    const stage = new Stage()
    stage.init()

    const particle = new Particle(stage)
    particle.init()

    window.addEventListener("resize", () => {
      stage.onResize()
      particle.onResize()
    })

    const _raf = () => {
      window.requestAnimationFrame(() => {
        _raf()
        stage.onRaf()
        particle.onRaf()
      })
    }
    _raf()
  }
}

const gl = new Webgl()
