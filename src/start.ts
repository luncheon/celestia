import { Object3D, PerspectiveCamera, Scene, WebGLRenderer, Euler } from 'three'
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

const getElementById = (id: string) => document.getElementById(id)! // eslint-disable-line @typescript-eslint/no-non-null-assertion

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

    let update = (): unknown => {
      trackballControls.update()
      return 1
    }
    await Promise.race([
      supportsDeviceOrientationEvent.then(() => {
        trackballControls.dispose()
        getElementById('device-orientations').style.display = ''
        const alphaElement = getElementById('device-orientation-alpha')
        const betaElement = getElementById('device-orientation-beta')
        const gammaElement = getElementById('device-orientation-gamma')
        update = () => {
          const deviceOrientation = deviceOrientationControls.deviceOrientation
          if (deviceOrientationControls.deviceOrientation instanceof DeviceOrientationEvent) {
            const alpha = deviceOrientation.alpha || 0
            const beta = deviceOrientation.beta || 0
            const gamma = deviceOrientation.gamma || 0
            alphaElement.textContent = (Math.round(alpha) as string | number) as string
            betaElement.textContent = (Math.round(beta) as string | number) as string
            gammaElement.textContent = (Math.round(gamma) as string | number) as string
            deviceOrientationControls.deviceOrientation = {
              alpha: alpha + 180,
              beta: beta - 35 /* latitude */,
              gamma: gamma,
            }
            deviceOrientationControls.update()
            return 1
          }
        }
      }),
      timeoutsDeviceOrientationEvent,
    ])

    const cameraEulerIndicator = getElementById('camera-euler')
    const animate = () => {
      if (update()) {
        const euler = new Euler().setFromRotationMatrix(camera.matrix, 'YXZ')
        cameraEulerIndicator.textContent = `Camera: (${euler.x.toFixed(2)}, ${euler.y.toFixed(2)}, ${euler.z.toFixed(2)}) [${euler.order}]`
        renderer.render(scene, camera)
      }
      requestAnimationFrame(animate)
    }
    animate()
  }
}
