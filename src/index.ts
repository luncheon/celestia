import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import records from '../data/hip_lite_major.json'

const scene = new THREE.Scene()
{
  const geometry = new THREE.Geometry()
  for (const [, rightAscension, declination, magnitude] of records) {
    const a = ((rightAscension as number) / 86400) * 2 * Math.PI
    const b = ((declination as number) / 3600 / 180) * Math.PI
    const normal = new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b))
    geometry.vertices.push(normal.multiplyScalar(1.2 ** (magnitude as number)))
    geometry.colors.push(new THREE.Color().setScalar(0.8 ** (magnitude as number)))
  }
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.01, vertexColors: THREE.VertexColors })))
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
