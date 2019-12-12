import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import _stars from '../data/stars.json'
import constellations from '../data/constellations.json'

const stars = _stars.map(([hip, name, rightAscension, declination, magnitude]) => {
  const a = (rightAscension / 86400) * 2 * Math.PI
  const b = (declination / 3600 / 180) * Math.PI
  const normal = new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b))
  return {
    hip,
    name,
    magnitude,
    get normal() {
      return normal.clone()
    },
  }
})

const scene = new THREE.Scene()
{
  const geometry = new THREE.Geometry()
  geometry.vertices = stars.map(star => star.normal.multiplyScalar(1.2 ** star.magnitude))
  geometry.colors = stars.map(star => new THREE.Color().setScalar(0.8 ** star.magnitude))
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.01, vertexColors: THREE.VertexColors })))
}
{
  const hipStarMap = Object.fromEntries(stars.map(star => [star.hip, star]))
  const createLineVertex = (star1: typeof stars[0], star2: typeof stars[0]) =>
    star1.normal.multiplyScalar(100).add(star2.normal.sub(star1.normal).normalize())
  const geometry = new THREE.Geometry()
  for (const [, lines] of constellations) {
    for (const [hip1, hip2] of lines) {
      const star1 = hipStarMap[hip1]
      const star2 = hipStarMap[hip2]
      if (star1 && star2) {
        geometry.vertices.push(createLineVertex(star1, star2), createLineVertex(star2, star1))
      }
    }
  }
  scene.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x888888 })))
}

const width = window.innerWidth
const height = window.innerHeight
const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
camera.position.z = 1e-6

const renderer = new THREE.WebGLRenderer()
renderer.setSize(width, height)
document.body.insertBefore(renderer.domElement, document.body.firstChild)
renderer.render(scene, camera)

const controls = new OrbitControls(camera, document.body)
controls.minDistance = controls.maxDistance = camera.position.z
controls.addEventListener('change', () => renderer.render(scene, camera))

addEventListener('resize', () => {
  const width = window.innerWidth
  const height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  renderer.render(scene, camera)
})
