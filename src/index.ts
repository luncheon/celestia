import { Euler, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { createControls } from './controls'
import { createObjects } from './objects'

const renderer = new WebGLRenderer({ antialias: true })
document.body.insertBefore(renderer.domElement, document.body.firstChild)
renderer.setPixelRatio(window.devicePixelRatio)

const camera = new PerspectiveCamera(60, 1, 0.1, 4000)
camera.position.set(0, 0, -1e-6)
camera.lookAt(0, 0, 1)

{
  const updateSize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  updateSize()
  addEventListener('resize', updateSize)
}

const scene = new Scene()

Promise.all([createControls(camera), createObjects()]).then(([controls, objects]) => {
  scene.add(...Object.values(objects))
  const cameraEulerIndicator = document.getElementById('camera-euler') as HTMLElement
  const animate = () => {
    if (controls.update()) {
      const euler = new Euler().setFromRotationMatrix(camera.matrix, 'YXZ')
      cameraEulerIndicator.textContent = `Camera: (${euler.x.toFixed(2)}, ${euler.y.toFixed(2)}, ${euler.z.toFixed(2)}) [${euler.order}]`
      renderer.render(scene, camera)
    }
    requestAnimationFrame(animate)
  }
  animate()
})
