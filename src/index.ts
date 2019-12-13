import {
  Color,
  Geometry,
  LinearFilter,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  Texture,
  Vector3,
  VertexColors,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { constellations, stars } from './data'

const scene = new Scene()

// stars
{
  const geometry = new Geometry()
  geometry.vertices = stars.map(star => star.normal.multiplyScalar(1.2 ** star.magnitude))
  geometry.colors = stars.map(star => new Color().setScalar(0.8 ** star.magnitude))
  scene.add(new Points(geometry, new PointsMaterial({ size: 0.01, vertexColors: VertexColors })))
}

// constellation lines
{
  const geometry = new Geometry()
  for (const { lines } of constellations) {
    for (const [star1, star2] of lines) {
      geometry.vertices.push(
        star1.normal.multiplyScalar(100).add(star2.normal.sub(star1.normal).normalize()),
        star2.normal.multiplyScalar(100).add(star1.normal.sub(star2.normal).normalize()),
      )
    }
  }
  scene.add(new LineSegments(geometry, new LineBasicMaterial({ color: 0x5555aa })))
}

// constellation names
{
  const createTextCanvas = (text: string) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    context.font = '100 100px serif'
    canvas.width = Math.ceil(context.measureText(text).width * 1.1)
    canvas.height = 110
    context.font = '100 100px serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = '#668'
    context.fillText(text, canvas.width / 2, canvas.height / 2)
    return canvas
  }
  const createCanvasMesh = (canvas: HTMLCanvasElement, position: Vector3) => {
    const texture = new Texture(canvas)
    texture.minFilter = LinearFilter
    texture.needsUpdate = true
    const mesh = new Mesh(new PlaneGeometry(canvas.width, canvas.height), new MeshBasicMaterial({ map: texture }))
    mesh.position.copy(position)
    mesh.lookAt(position.clone().normalize())
    return mesh
  }
  for (const { name, lines } of constellations) {
    const stars = lines.flat().filter((star, i, stars) => stars.indexOf(star) === i)
    const normal = stars.reduce((normal, star) => normal.add(star.normal), new Vector3()).normalize()
    scene.add(createCanvasMesh(createTextCanvas(name), normal.multiplyScalar(3000)))
  }
}

const width = window.innerWidth
const height = window.innerHeight
const camera = new PerspectiveCamera(50, width / height, 0.1, 4000)
camera.position.set(0, 0, -1e-6)
camera.lookAt(0, 0, 1)

const renderer = new WebGLRenderer()
renderer.setSize(width, height)
document.body.insertBefore(renderer.domElement, document.body.firstChild)
renderer.render(scene, camera)

const controls = new OrbitControls(camera, document.body)
controls.minDistance = controls.maxDistance = camera.position.distanceTo(new Vector3())
controls.addEventListener('change', () => renderer.render(scene, camera))

addEventListener('resize', () => {
  const width = window.innerWidth
  const height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  renderer.render(scene, camera)
})
