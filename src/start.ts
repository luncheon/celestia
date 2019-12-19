import { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

const supportsDeviceOrientationEvent = new Promise(resolve => {
  let deviceOrientationEventCount = 0
  addEventListener('deviceorientation', function checkDeviceOrientationSupported() {
    if (++deviceOrientationEventCount > 1) {
      this.removeEventListener('deviceorientation', checkDeviceOrientationSupported)
      resolve()
    }
  })
})

const timeoutsDeviceOrientationEvent = new Promise(resolve => setTimeout(resolve, 500))

export const start = async (objects: Object3D[]) => {
  const scene = new Scene().add(...objects)

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

    await Promise.race([
      supportsDeviceOrientationEvent.then(() => {
        trackballControls.dispose()
        activeControls = deviceOrientationControls
      }),
      timeoutsDeviceOrientationEvent,
    ])

    animate()
  }
}
