import {
  Color,
  Geometry,
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
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { constellations, stars } from './data'

const scene = new Scene()

// stars
{
  const radius = 100
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = radius * 2
  const context = canvas.getContext('2d')! // eslint-disable-line @typescript-eslint/no-non-null-assertion
  const gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,.7)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.arc(radius, radius, radius, 0, 2 * Math.PI)
  context.fill()
  const texture = new Texture(canvas)
  texture.needsUpdate = true

  const geometry = new Geometry()
  geometry.vertices = stars.map(star => star.normal.multiplyScalar(1.25 ** star.magnitude))
  geometry.colors = stars.map(star => new Color().setScalar(0.8 ** star.magnitude))
  scene.add(new Points(geometry, new PointsMaterial({ size: 0.025, transparent: true, vertexColors: VertexColors, map: texture })))
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

const camera = new PerspectiveCamera(60, 1, 0.1, 4000)
camera.position.set(0, 0, -1e-6)
camera.lookAt(0, 0, 1)

const renderer = new WebGLRenderer({ antialias: true })
document.body.insertBefore(renderer.domElement, document.body.firstChild)
renderer.setPixelRatio(window.devicePixelRatio)

const updateSize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}
updateSize()
addEventListener('resize', updateSize)

{
  const trackballControls = new TrackballControls(camera, document.body)
  trackballControls.rotateSpeed = -0.5

  const deviceOrientationControls = new DeviceOrientationControls(camera)

  let activeControls: { update(): void } = trackballControls
  const animate = () => {
    activeControls.update()
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }

  let animationStarted: undefined | 1
  const startAnimation = () => {
    if (!animationStarted) {
      animationStarted = 1
      animate()
    }
  }

  let deviceOrientationEventCount = 0
  addEventListener('deviceorientation', function checkDeviceOrientationSupported() {
    if (++deviceOrientationEventCount > 1) {
      this.removeEventListener('deviceorientation', checkDeviceOrientationSupported)
      trackballControls.dispose()
      activeControls = deviceOrientationControls
      startAnimation()
    }
  })

  setTimeout(startAnimation, 500)
}
