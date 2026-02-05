import * as THREE from "three"
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js"
import {FontLoader} from "three/addons/loaders/FontLoader.js"
import {TextGeometry} from "three/addons/geometries/TextGeometry.js"

import {Vector3, CubicBezierCurve3} from "three"
import {Line2} from "three/addons/lines/Line2.js"
import {LineMaterial} from "three/addons/lines/LineMaterial.js"
// import { LineDashedMaterial } from 'three/addons/lines/LineDashedMaterial.js';
import {LineGeometry} from "three/addons/lines/LineGeometry.js"
import {LineSegments2} from "three/addons/lines/LineSegments2.js"
import {PMREMGenerator} from "three"
import {RGBELoader} from "three/addons/loaders/RGBELoader.js"
// import { MeshSurfaceSampler } from 'three/addons/loaders/RGBELoader.js';
import {MeshSurfaceSampler} from "three/addons/math/MeshSurfaceSampler.js"

// outline
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js"
import {RenderPass} from "three/addons/postprocessing/RenderPass.js"
import {OutlinePass} from "three/addons/postprocessing/OutlinePass.js"
import {ShaderPass} from "three/addons/postprocessing/ShaderPass.js"
import {FXAAShader} from "three/addons/shaders/FXAAShader.js"
// import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import {GammaCorrectionShader} from "three/addons/shaders/GammaCorrectionShader.js"

import {CopyShader} from "three/addons/shaders/CopyShader.js"

export default class {}

/////////////////////////////////////////////////////////////////
//　NEW
/////////////////////////////////////////////////////////////////
export const loadGLTFModel = (particle, gltfPath, scale = 1.0) => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.load(gltfPath, (gltf) => {
      // const model = gltf.scene;
      particle.model = gltf.scene
      // particle.model.visible = true;
      particle.model.scale.set(scale, scale, scale)
      resolve()
    })
  })
}

// (1) GLTFからchildMeshesを取得
export const loadGLTF = (particle, gltfPath, scale = 1.0) => {
  return new Promise((resolve, reject) => {
    const mesheArray = []
    const loader = new GLTFLoader()
    loader.load(gltfPath, (gltf) => {
      const model = gltf.scene

      model.visible = false
      model.scale.set(scale, scale, scale)
      model.traverse((child) => {
        if (child.isMesh) {
          // child.material.opacity = 0.0;
          mesheArray.push(child)
          // child.castShadow = true;
          // child.receiveShadow = true;
          // const material = child.material;
          // material.transparent = true;
          // material.opacity = 0.5;
          // material.envMapIntensity = 1.0;
        }
      })
      particle.baseMeshes = mesheArray
      resolve(mesheArray)
    })
  })
}

// (2) meshesをcount個生成
export const makeMeshes = (stage, particle) => {
  return new Promise((resolve, reject) => {
    particle.model = new THREE.Group()
    particle.model.visible = false
    for (let i = 0; i < particle.meshesCount; i++) {
      const rand = parseInt(particle.baseMeshes.length * Math.random())
      const m = particle.baseMeshes[rand]
      const mesh = m.clone()
      particle.meshes.push(mesh)
      particle.model.add(mesh)
    }
    stage.scene.add(particle.model)
    resolve(particle.meshes)
  })
}

// (3) wireを作成
export const wireTypes = [
  new THREE.SphereGeometry(50, 50, 50), //
  new THREE.SphereGeometry(40, 40, 40), //
  new THREE.BoxGeometry(75, 75, 75),
  new THREE.BoxGeometry(20, 100, 100),
  new THREE.PlaneGeometry(100, 100, 20, 20),
  new THREE.IcosahedronGeometry(50, 0),
  new THREE.IcosahedronGeometry(40, 1),
  new THREE.CylinderGeometry(0, 40, 100, 50, 50),
  new THREE.TorusGeometry(40, 10, 40, 40),
  new THREE.TetrahedronGeometry(70),
  new THREE.OctahedronGeometry(70),
]
export const makeWire = (type, opacity) => {
  const geometry = wireTypes[type]
  const h = Math.random()
  const s = Math.random() * 0.8
  const l = Math.random() * 0.5
  const color = new THREE.Color().setHSL(h, s, l)

  const material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    transparent: true,
    opacity: opacity,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = "wire"
  return mesh
}

//（5）meshes 配置   <--- (2)
const speedRange = 0.002
const scaledRange = 1.5
const scaledBase = 0.2
export const locateMeshes = (particle) => {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < particle.meshesCount; i++) {
      const mesh = particle.meshes[i]
      const index = i * 3
      // speed
      mesh.speed = speedRange * Math.random() - speedRange / 2
      // position
      mesh.position.set(
        particle.positions[index + 0], //
        particle.positions[index + 1],
        particle.positions[index + 2],
      )
      // scale
      const s = scaledRange * Math.random() + scaledBase
      mesh.scale.set(s, s, s)
      // rotation
      mesh.rotation.x = Math.random() * Math.PI * 2
      mesh.rotation.y = Math.random() * Math.PI * 2
      mesh.rotation.z = Math.random() * Math.PI * 2
      // opacity
      mesh.material.opacity = Math.random() * 0.5 + 0.5
    }
    resolve(particle.meshes)
  })
}

//（6）アニメーション
const easeTypes = [
  "back.inOut(1.7)", //
  "back.out(1.7)",
  "power2.inOut",
  "none",
  "power2.in",
  "steps(12)",
  "slow(0.7,0.7,false)",
  "circ.inOut",
  "elastic.inOut(1,0.3)",
  "bounce.inOut",
  "bounce.in",
  "bounce.out",
  "rough({template:none.out,strength: 1,points:20,taper:none,randomize:true,clamp:false})",
]
export const effect_exchange = (particle, lastLoop = false) => {
  return new Promise((resolve, reject) => {
    particle.pointAry = []
    for (let i = 0; i < particle.positions.length; i += 3) {
      const ary = [
        particle.positions[i + 0], //
        particle.positions[i + 1],
        particle.positions[i + 2],
      ]
      particle.pointAry.push(ary)
    }
    const moveMeshes = () => {
      const duration = 2.0
      const delay = 4.0
      const rand = parseInt(Math.random() * easeTypes.length)
      for (let i = 0; i < particle.meshes.length; i++) {
        const mesh = particle.meshes[i]
        const point = particle.pointAry[i]
        gsap.to(mesh.position, {
          x: point[0],
          y: point[1],
          z: point[2],
          duration: duration,
          delay: delay,
          ease: easeTypes[rand],
          onComplete: () => {
            if (lastLoop) {
              hideMesh(particle, mesh, i)
            } else if (i == particle.meshes.length - 1) {
              setTimeout(resolve(), 3000) // 1.途中はアニメーション終わりにresolve
            }
          },
        })
      }
      const hideMesh = (particle, mesh, i = 0) => {
        mesh.material.transparent = true
        gsap.to(mesh.material, {
          opacity: 0.0,
          duration: 2.0,
          delay: 5.0,
          onComplete: () => {
            setTimeout(() => {
              particle.model.remove(mesh)
            }, 300)
            if (i == particle.meshes.length - 1) {
              resolve() // 2.最後はhide終わりにresolve
            }
          },
        })
      }
      const gap = 0.3
      // material
      gsap.to(particle.wires[0].material, {
        duration: duration * 0.6,
        delay: delay + gap,
        ease: easeTypes[rand],
        opacity: 0.0,
        onComplete: () => {},
      })
      gsap.to(particle.wires[1].material, {
        duration: duration,
        delay: delay + gap,
        ease: easeTypes[rand],
        opacity: particle.wireOpacity,
        onComplete: () => {
          if (lastLoop) {
            hideMesh(particle, particle.wires[1])
          }
        },
      })
      // scale
      gsap.to(particle.wires[0].scale, {
        duration: duration,
        delay: delay + gap,
        ease: easeTypes[rand],
        x: 0.0,
        y: 0.0,
        z: 0.0,
        onComplete: () => {},
      })
      particle.wires[1].scale.set(0.0, 0.0, 0.0)
      gsap.to(particle.wires[1].scale, {
        duration: duration,
        delay: delay + gap,
        ease: easeTypes[rand],
        x: 1.0,
        y: 1.0,
        z: 1.0,
        onComplete: () => {},
      })
    }
    moveMeshes()
  })
}

export const showBaseMesh = (particle) => {
  return new Promise((resolve, reject) => {
    const s0 = 2.0
    const s1 = 10.0
    for (let i = 0; i < particle.baseMeshes.length; i++) {
      const mesh = particle.baseMeshes[i]
      mesh.material.opacity = 0.0
      particle.model.add(mesh)
      mesh.scale.set(s0, s0, s0)
      gsap.to(mesh.material, {
        opacity: 1.0,
        duration: 4.0,
        delay: 2.0,
        onComplete: () => {
          gsap.to(mesh.scale, {
            x: s1,
            y: s1,
            z: s1,
            duration: 2.0,
            onComplete: () => {
              if (i == particle.baseMeshes.length - 1) {
                resolve()
              }
            },
          })
        },
      })
    }
  })
}

// blenderで「データ」->「メッシュ」->「孤立する辺」「孤立する点」にチェックを入れてエクスポート
// エクスポートするベジェの名前を「CurveName」にする
export const getPointsOnJsonPath = (path, num) => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.load(path, (gltf) => {
      const curveObject = gltf.scene.getObjectByName("CurveName")
      if (curveObject) {
        // console.log('カーブオブジェクトが見つかりました:', curveObject);
        // カーブの頂点情報を取得
        const geometry = curveObject.geometry
        const points = geometry.attributes.position.array

        // 点を取得（カスタム関数を使用）
        const resultPoints = getPointsOnCurve(geometry, num)
        resolve(resultPoints)
      } else {
        console.error("カーブが見つかりません。名前を確認してください。")
      }
    })
  })
}

function getPointsOnCurve(curveGeometry, numPoints) {
  // Blenderから読み込んだカーブの頂点を取得
  const points = curveGeometry.attributes.position.array
  // 頂点をThree.jsのVector3配列に変換
  const vertices = []
  for (let i = 0; i < points.length; i += 3) {
    vertices.push(new Vector3(points[i], points[i + 1], points[i + 2]))
  }
  // Three.jsのカーブを作成
  const curve = new THREE.CatmullRomCurve3(vertices)
  // カーブ上の点を取得
  const evenlySpacedPoints = curve.getPoints(numPoints)
  return evenlySpacedPoints
}

export const alignMeshes = (particle, crossPositions) => {
  return new Promise((resolve, reject) => {
    const interval = 0.05
    for (let i = 0; i < particle.model.children.length; i++) {
      const child = particle.model.children[i]
      if (child.isMesh) {
        const pos = crossPositions[i]
        const speedRange = 0.0015
        child.speed = Math.random() * speedRange - speedRange / 2 // ここから回転はじめる
        gsap.to(child.position, {
          duration: 2.0,
          delay: i * interval,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          onComplete: () => {
            if (i == particle.model.children.length - 1) {
              resolve()
            }
          },
        })
      }
    }
  })
}

// 図形状の点を取得
export const makePositionsOnShape = (type, num) => {
  let positions = []
  let length = 150
  switch (type) {
    case "cross":
      length = 180
      const start = -length / 2
      const numX = Math.floor(num / 2)
      const stepX = length / (numX - 1)
      const numY = num - numX
      const stepY = length / (numY - 1)
      // x方向
      for (let i = 0; i < numX; i++) {
        const x = start + stepX * i
        const y = 0
        const z = 0
        positions.push(new THREE.Vector3(x, z, y))
      }
      // y方向
      for (let i = 0; i < numY; i++) {
        const x = 0
        const y = start + stepY * i
        const z = 0
        positions.push(new THREE.Vector3(x, z, y))
      }
      break
    case "circle":
      const l = length / 2
      const step = (2 * Math.PI) / num
      for (let i = 0; i < num; i++) {
        const x = l * Math.cos(step * i)
        const y = l * Math.sin(step * i)
        const z = 0
        positions.push(new THREE.Vector3(x, y, z))
      }
      break
    case "triangle":
      length = 130
      const num1 = Math.floor(num / 3)
      const num2 = num - num1 - num1
      const num3 = num - num1 - num2

      const Y = length * Math.sin((Math.PI * 2) / 6)
      const halfX = length / 2
      const bottomY = -(Y / 3)
      const topY = Y + bottomY
      const step1 = length / num1
      for (let i = 0; i < num1; i++) {
        const x = -halfX + step1 * i
        const y = bottomY
        const z = 0
        positions.push(new THREE.Vector3(x, y, z))
      }
      const step2 = length / num2
      for (let i = 0; i < num2; i++) {
        const x = halfX - Math.cos((Math.PI * 2) / 6) * i * step2
        const y = bottomY + Math.sin((Math.PI * 2) / 6) * i * step2
        const z = 0
        positions.push(new THREE.Vector3(x, y, z))
      }
      const step3 = length / num3
      for (let i = 0; i < num3; i++) {
        const x = 0 - Math.cos((Math.PI * 2) / 6) * i * step3
        const y = topY - Math.sin((Math.PI * 2) / 6) * i * step3
        const z = 0
        positions.push(new THREE.Vector3(x, y, z))
      }
      break
    case "square":
      break
    default:
      console.log("typeを指定してください")
      break
  }
  return positions
}

const makePoints = (positions) => {
  let ary0 = new Float32Array(positions.length * 3)

  for (let i = 0; i < positions.length; i++) {
    const j = i * 3
    ary0[j + 0] = positions[i].x
    ary0[j + 1] = positions[i].y
    ary0[j + 2] = positions[i].z
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(ary0, 3))
  const mat = new THREE.PointsMaterial({
    size: 3.0,
    color: 0xff0000,
  })
  const points = new THREE.Points(geo, mat)
  return points
}

/////////////////////////////////////////////////////////////////
//　NEW END
/////////////////////////////////////////////////////////////////
export const setCameraState = (stage) => {
  window.addEventListener("keydown", function (e) {
    if (e.key == "s") {
      saveCameraAttributeToLocal(stage.camera, stage.orbitControls)
    }
    if (e.key == "l") {
      loadCameraAttributeFromLocal(stage.camera, stage.orbitControls)
    }
  })

  let twoFingerTap = false

  document.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
      twoFingerTap = true
    }
  })

  document.addEventListener("touchend", (event) => {
    if (twoFingerTap && event.touches.length === 0) {
      saveCameraAttributeToLocal(stage.camera, stage.orbitControls)
    }
    twoFingerTap = false
  })
}

// 「cameraの状態をローカルに保存」
export const saveCameraAttributeToLocal = (camera, orbitControls) => {
  const cameraState = saveCameraState(camera, orbitControls)
  localStorage.setItem("cameraState", JSON.stringify(cameraState))
}

// 「cameraの状態をローカルから読み込み」
export const loadCameraAttributeFromLocal = (camera, orbitControls) => {
  const state = JSON.parse(localStorage.getItem("cameraState"))
  if (state) {
    loadCameraState(camera, state, orbitControls)
  }
}

export const saveCameraState = (camera, orbitControls) => {
  console.log("saveCameraState!")
  return {
    position: camera.position.toArray(),
    quaternion: camera.quaternion.toArray(),
    fov: camera.fov,
    near: camera.near,
    far: camera.far,
    x: orbitControls.target.x,
    y: orbitControls.target.y,
    z: orbitControls.target.z,
  }
}

const loadCameraState = (camera, state, orbitControls) => {
  camera.position.fromArray(state.position)
  camera.quaternion.fromArray(state.quaternion)
  camera.fov = state.fov
  camera.near = state.near
  camera.far = state.far

  orbitControls.target = new THREE.Vector3(state.x, state.y, state.z)
  camera.updateProjectionMatrix() // 必須: 投影行列を更新する
  console.log("loadCameraState!")
}

//「線形補完」
export const lerp = (x, y, p) => {
  return x + (y - x) * p
}

const envImageNames = [
  "autumn_field_puresky_4k.hdr", //
  "kloofendal_48d_partly_cloudy_puresky_4k.hdr",
  "kloppenheim_06_puresky_4k.hdr",
  // 'belfast_sunset_puresky_4k.hdr',
  // 'syferfontein_1d_clear_puresky_4k.hdr',
]

//「hdriで背景を生成」
export const makeEnvironment = (stage) => {
  const imgPath = "./img/hdri/"
  const pmremGenerator = new PMREMGenerator(stage.renderer)
  pmremGenerator.compileEquirectangularShader()

  const rand = parseInt(Math.random() * envImageNames.length)
  const imgName = envImageNames[rand]

  const loader0 = new RGBELoader()
  loader0.load(imgPath + imgName, function (texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture
    stage.scene.environment = envMap
    stage.scene.background = envMap
    // stage.scene.environmentIntensity = 0.2;
    texture.dispose()
    pmremGenerator.dispose()
  })
}

//「BufferGeometryの表面上のランダムな点の配列を生成（positionsNum個）」
export const geometryPositionsWithNumber = (bufferGeometry, positionsNum) => {
  return new Promise((resolve, reject) => {
    const material = new THREE.MeshBasicMaterial()
    // インデックスを設定していない場合は NonIndexed

    const mesh = new THREE.Mesh(bufferGeometry.index === null ? bufferGeometry : bufferGeometry.toNonIndexed(), material)

    const sampler = new MeshSurfaceSampler(mesh).build()
    const particlesPosition = new Float32Array(positionsNum * 3)
    for (let i = 0; i < positionsNum; i++) {
      const newPosition = new THREE.Vector3()
      const normal = new THREE.Vector3()
      sampler.sample(newPosition, normal)
      particlesPosition.set([newPosition.x, newPosition.y, newPosition.z], i * 3)
    }
    resolve(particlesPosition) // :Float32Array
  })
}

/* 
Promise使用
*/
const fontPasses = [
  "./fonts/gentilis_bold.typeface.json", //
  "./fonts/helvetiker_bold.typeface.json",
]
export const make3DText = (str, color, size, fontPassIndex = 0) => {
  return new Promise((resolve, reject) => {
    const loader = new FontLoader()
    loader.load(fontPasses[fontPassIndex], (font) => {
      const parameters = {
        font: font, //
        weight: "normal",
        style: "normal",
        size: size * Math.random() + 20.0,
        depth: 5.0 * Math.random() + 1.5,
        curveSegment: 10,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 0.5,
      }

      const textGeometry = new TextGeometry(str, parameters)
      const material = new THREE.MeshPhongMaterial({
        transparent: true,
        opacity: Math.random() * 0.5,
        color: color,
        // shininess: 10.0,
      })

      textGeometry.computeBoundingBox()
      const boundingBox = textGeometry.boundingBox

      const offsetX = (boundingBox.max.x + boundingBox.min.x) / 2
      const offsetY = (boundingBox.max.y + boundingBox.min.y) / 2
      const offsetZ = (boundingBox.max.z + boundingBox.min.z) / 2

      textGeometry.translate(-offsetX, -offsetY, -offsetZ)

      const text = new THREE.Mesh(textGeometry, material)
      text.rotation.x = (-Math.PI / 2) * Math.random()
      text.rotation.z = (Math.PI / 2) * Math.random()
      const range_l = 100
      const x = Math.random() * range_l - range_l / 2
      const y = Math.random() * range_l - range_l / 2
      const z = Math.random() * range_l - range_l / 2
      text.position.set(x, y, z)
      resolve(text) // textを返す
    })
  })
}

// 「ray をつくる」
export const makeRay = (window) => {
  return new Promise((resolve, reject) => {
    const L = 500
    const x0 = Math.random()
    const y0 = Math.random()
    const z0 = Math.random()
    const x1 = Math.random()
    const y1 = Math.random()
    const z1 = Math.random()

    const geometry = new LineGeometry()
    geometry.setPositions([
      x0 * L, //
      y0 * L,
      z0 * L,
      -x1 * L,
      -y1 * L,
      -z1 * L,
    ])
    const s = Math.random() * 0.7 + 0.3
    const l = Math.random() * 0.7
    const h = Math.random()
    const a = Math.random() * 0.5 + 0.5
    const range_width = 0.7
    const w = Math.random() * range_width
    const material = new LineMaterial({
      color: new THREE.Color().setHSL(h, s, l), //,
      linewidth: w,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // 解像度
      transparent: true,
      opacity: a,
    })

    const line2 = new LineSegments2(geometry, material)
    resolve(line2)
  })
}

// 「エッジを描く」 cf. makeEdgesHelper
export const makeEdges = (mesh, color, width, scene, window) => {
  return new Promise((resolve, reject) => {
    console.log("mesh.geometry")
    console.log(mesh.geometry)

    const geometry = new LineGeometry()
    geometry.setPositions([0, 0, 0, 0, 0, 0])

    const material = new LineMaterial({
      color: color, //new THREE.Color().setHSL(h, s, l), //,
      linewidth: 1.0,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // 解像度
      transparent: true,
      opacity: 0.5,
    })

    const line2 = new LineSegments2(geometry, material)
    resolve(line2)
    reject("エラー！")
  })
}

//「カーブに沿ってmeshesを動かす」
export const moveOnPath = (stage, curveJSON, pointsCount, meshes, interval = 0.1, wait = 3.0, duration = 20.0) => {
  const loader = new THREE.FileLoader()

  duration = meshes.length * interval

  const makeCurvesAndAnimateMeses = () => {
    // const k = 10;
    loader.setPath("./curves/")
    loader.load(curveJSON, function (data) {
      const bezierData = JSON.parse(data)
      // ベジェカーブをThree.jsで再構築
      let pointsOnCurves = []
      const h = Math.random()

      for (let i = 0; i < bezierData.length - 1; i++) {
        const p0 = new THREE.Vector3(...bezierData[i].co)
        const p1 = new THREE.Vector3(...bezierData[i].handle_right)
        const p2 = new THREE.Vector3(...bezierData[i + 1].handle_left)
        const p3 = new THREE.Vector3(...bezierData[i + 1].co)

        // CubicBezierCurve3を使ってカーブセグメントを作成
        const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3)
        pointsOnCurves.push(curve.getPoints(pointsCount))

        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(pointsCount))
        const material = new THREE.LineBasicMaterial({
          color: new THREE.Color().setHSL(h, 1.0, 0.5), //
          transparent: true,
          opacity: 0.2,
        })

        const curveObject = new THREE.Line(geometry, material)
        stage.scene.add(curveObject) // カーブ
      }

      // アニメーション
      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i]
        const pos = pointsOnCurves[0][0]
        mesh.position.set(pos.x, pos.y, pos.z)
        let pathPoints = []
        for (let i = 0; i < pointsOnCurves.length; i++) {
          const points_ = pointsOnCurves[i]
          pathPoints.push(...vec3toObj(points_))
        }
        setAutoPlay(mesh, i, pathPoints, pos)
      }
    })

    const setAutoPlay = (mesh, i, pathPoints, startPos) => {
      flowAnim(mesh, i, pathPoints)
      gsap.to(
        {},
        {
          duration: meshes.length * 1 * interval + wait,
          ease: "none",
          repeat: 0,
          onRepeat: () => {
            mesh.position.set(startPos.x, startPos.y, startPos.z)
            flowAnim(mesh, i, pathPoints)
          },
        },
      )
    }

    const flowAnim = (mesh, i, pathPoints) => {
      gsap.to(mesh.position, {
        duration: meshes.length * 1 * interval + wait,
        delay: i * interval * Math.random(),
        motionPath: {
          path: pathPoints,
          autoRotate: true,
          curviness: 0,
        },
        ease: "none",
        repeat: 0,
        onStart: () => {
          mesh.material.opacity = 1.0
          mesh.rotation.x = 0 // Math.random() * 2; // Math.PI * 2;
        },
        onComplete: () => {
          mesh.material.opacity = 0.0
        },
      })

      gsap.to(mesh.rotation, {
        y: Math.random() * Math.PI * 20,
        z: Math.random() * Math.PI * 30,
        duration: 3 * Math.random(),
        delay: i * interval * Math.random(),
        ease: "none",
        repeat: 0,
        yoyo: false, //true,
      })
    }
  }
  makeCurvesAndAnimateMeses()
}

export const shuffleArray = (array) => {
  const copiedArray = array.slice() // 元の配列をコピー
  for (let i = copiedArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copiedArray[i], copiedArray[j]] = [copiedArray[j], copiedArray[i]]
  }
  return copiedArray
}

// 画像からピクセル取得
export function imagePixel(path, w, h, ratio) {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  const width = w
  const height = h
  canvas.width = width
  canvas.height = height

  ctx.drawImage(path, 0, 0)
  const data = ctx.getImageData(0, 0, width, height).data
  const position = []
  const color = []
  const alpha = []

  for (let y = 0; y < height; y += ratio) {
    for (let x = 0; x < width; x += ratio) {
      const index = (y * width + x) * 4
      const r = data[index] / 255
      const g = data[index + 1] / 255
      const b = data[index + 2] / 255
      const a = data[index + 3] / 255

      const pX = x - width / 2
      const pY = -(y - height / 2)
      const pZ = 0

      position.push(pX, pY, pZ)
      color.push(r, g, b)
      alpha.push(a)
    }
  }
  return {position, color, alpha}
}

export const vec3toObj = (vector3Array) => {
  let result = []
  for (let i = 0; i < vector3Array.length; i++) {
    const vector = vector3Array[i]
    const obj = {x: vector.x, y: vector.y, z: vector.z}
    result.push(obj)
  }
  return result
}

export const drawLine = (point0, point1, scenes) => {
  // 1. 頂点情報の定義
  const points = [point0, point1]

  // 2. ジオメトリを作成
  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  // 3. マテリアルを作成
  const material = new THREE.LineBasicMaterial({color: 0xff0000}) // 赤色

  // 4. Lineオブジェクトを作成
  const line = new THREE.Line(geometry, material)

  // console.log(stage.model);

  // 5. シーンに追加
  scene.add(line)
}

// wireframeをつくる
export function makeLines(mesh, scene) {
  const positions = mesh.geometry.attributes.position.array
  console.log(positions)

  const geometry = new LineGeometry()
  geometry.setPositions(positions)

  const material = new LineMaterial({
    color: 0xff0000,
    linewidth: 10, // 線の太さ
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight), // 解像度
    transparent: true,
    opacity: 0.5,
  })

  // Line2オブジェクトを作成
  const line = new Line2(geometry, material)
  scene.add(line)
}

// Canvas要素（ガウス分布）の生成
export function generateCanvas_Gaussian() {
  //canvas要素の生成
  var canvas = document.createElement("canvas")
  //canvas要素のサイズ
  canvas.width = 256 //横幅
  canvas.height = 256 //縦幅
  //コンテキストの取得
  var context = canvas.getContext("2d")

  //ガウス分布の平均値と分散
  var x_ = canvas.width / 2 //平均値（x座標）
  var y_ = canvas.height / 2 //平均値（y座標）
  var sigma2 = 5000 //分散
  //ビットマップデータのRGBAデータ格納配列
  var bitmapData = []
  //RGBAデータ格納配列への値の代入
  for (var j = 0; j < canvas.height; j++) {
    for (var i = 0; i < canvas.width; i++) {
      var index = (j * canvas.width + i) * 4 //各ピクセルの先頭を与えるインデクス番号
      var x = i,
        y = j
      //ガウス分布の値の取得
      var f = Math.exp(-((x - x_) * (x - x_) + (y - y_) * (y - y_)) / (2 * sigma2))
      //ビットマップデータのRGBAデータ
      bitmapData[index + 0] = 255 * f //R値
      bitmapData[index + 1] = 255 * f //R値
      bitmapData[index + 2] = 255 * f //R値
      bitmapData[index + 3] = 255 //A値
    }
  }
  //イメージデータオブジェクトの生成
  var imageData = context.createImageData(canvas.width, canvas.height)
  for (var i = 0; i < canvas.width * canvas.height * 4; i++) {
    imageData.data[i] = bitmapData[i] //配列のコピー
  }
  //return imageData;

  //イメージデータオブジェクトからcanvasに描画する
  context.putImageData(imageData, 0, 0)
  return canvas
}

// Canvas要素の生成
export const generateCanvas = () => {
  //canvas要素の生成
  var canvas = document.createElement("canvas")
  //canvas要素のサイズ
  canvas.width = 256 //横幅
  canvas.height = 256 //縦幅
  //コンテキストの取得
  var context = canvas.getContext("2d")

  //ガウス分布の平均値と分散
  var x_ = canvas.width / 2 //平均値（x座標）
  var y_ = canvas.height / 2 //平均値（y座標）
  var sigma2 = 5000 //分散
  //ビットマップデータのRGBAデータ格納配列
  var bitmapData = []
  //RGBAデータ格納配列への値の代入
  for (var j = 0; j < canvas.height; j++) {
    for (var i = 0; i < canvas.width; i++) {
      var index = (j * canvas.width + i) * 4 //各ピクセルの先頭を与えるインデクス番号
      var x = i,
        y = j
      //ガウス分布の値の取得
      var f = Math.exp(-((x - x_) * (x - x_) + (y - y_) * (y - y_)) / (2 * sigma2))
      //ビットマップデータのRGBAデータ
      bitmapData[index + 0] = 255 * f //R値
      bitmapData[index + 1] = 0 //G値
      bitmapData[index + 2] = 0 //B値
      bitmapData[index + 3] = 255 //A値
    }
  }
  //イメージデータオブジェクトの生成
  var imageData = context.createImageData(canvas.width, canvas.height)
  for (var i = 0; i < canvas.width * canvas.height * 4; i++) {
    imageData.data[i] = bitmapData[i] //配列のコピー
  }
  //return imageData;

  //イメージデータオブジェクトからcanvasに描画する
  context.putImageData(imageData, 0, 0)
  return canvas
}

// curve上の点の配列を返す
// curveList: [curve.json]
// pointsCount: 点の数

// ランダムなスプライン
export const _makePointsOnSpline = () => {
  const l = this.L_x / this.stepsNum // x方向の間隔
  let stepPoints = [] // 50個
  for (let i = 0; i < this.stepsNum; i++) {
    const x = l * i - this.L_x / 2
    const y = this.L_y * Math.random() - this.L_y / 2
    const z = this.L_z * Math.random() - this.L_z / 2
    stepPoints[i] = new THREE.Vector3(x, y, z)
  }

  // その座標をもとにスプラインを作成
  const spline = new THREE.CatmullRomCurve3(stepPoints) // 🌟🌟🌟🌟🌟

  // スプライン上の100個の点の座標の配列を作成
  const pointsCountOnSpline = 300
  const pointsOnSpline = [] // [{x,y,z}]
  for (let i = 0; i < pointsCountOnSpline; i++) {
    const l = i / pointsCountOnSpline
    const position = spline.getPoint(l) // 🌟🌟🌟🌟🌟
    pointsOnSpline.push({
      x: position.x, //
      y: position.y,
      z: position.z,
    })
  }
  return pointsOnSpline // [{x,y,z}]
}

export const makeOutlineComposer = (stage, mesh) => {
  console.log("makeOutline!")

  // **PostProcessing（アウトライン処理）**
  const composer = new EffectComposer(stage.renderer)
  composer.addPass(new RenderPass(stage.scene, stage.camera))

  // **アウトライン Pass**
  const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), stage.scene, stage.camera)
  outlinePass.edgeStrength = 5 // アウトラインの強さ
  outlinePass.edgeGlow = 1.2 // 輝き
  outlinePass.edgeThickness = 5.0 // 太さ
  outlinePass.pulsePeriod = 0 // 点滅なし
  outlinePass.edgeThickness = -1.0
  outlinePass.visibleEdgeColor.set("#ff0000") // アウトラインの色（赤）
  outlinePass.hiddenEdgeColor.set("#000055") // 隠れた部分のアウトライン（黒）
  outlinePass.selectedObjects = [mesh] // **アウトラインを適用する Mesh を指定**
  composer.addPass(outlinePass)

  // ガンマ補正を追加
  // const gammaCorrection = new ShaderPass(GammaCorrectionShader);
  // composer.addPass(gammaCorrection);

  // CopyPassを追加
  // const copyPass = new ShaderPass(CopyShader);
  // composer.addPass(copyPass);

  // composer.setSize(window.innerWidth, window.innerHeight);

  // **FXAA アンチエイリアス処理**
  const fxaaPass = new ShaderPass(FXAAShader)
  fxaaPass.uniforms["resolution"].value.set(1 / window.innerWidth, 1 / window.innerHeight)
  composer.addPass(fxaaPass)

  if (stage.composer != null) {
    stage.composer.dispose()
  }
  stage.composer = composer
}
