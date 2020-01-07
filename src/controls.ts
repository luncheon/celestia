import { Camera } from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { deviceOrientationToQuaternion } from './deviceOrientationToQuaternion'

let deviceOrientation: DeviceOrientationEvent | undefined
addEventListener('deviceorientationabsolute', event => (deviceOrientation = event))

const supportsDeviceOrientationEvent = new Promise(resolve => {
  let deviceOrientationEventCount = 0
  addEventListener('deviceorientationabsolute', function checkDeviceOrientationSupported(event) {
    if (event.alpha !== null && ++deviceOrientationEventCount > 1) {
      this.removeEventListener('deviceorientationabsolute', checkDeviceOrientationSupported)
      resolve()
    }
  })
})

const timeoutsDeviceOrientationEvent = new Promise(resolve => setTimeout(resolve, 500))

export const createControls = async (camera: Camera) => {
  const trackballControls = new TrackballControls(camera, document.body)
  trackballControls.rotateSpeed = -0.5

  let update = (): unknown => {
    trackballControls.update()
    return 1
  }

  const useDeviceOrientations = () => {
    trackballControls.dispose()
    const deviceOrientationsElement = document.getElementById('device-orientations')! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    deviceOrientationsElement.style.display = ''
    update = () => {
      if (deviceOrientation instanceof DeviceOrientationEvent) {
        const latitude = 35
        const alpha = deviceOrientation.alpha || 0
        const beta = (deviceOrientation.beta || 0) - latitude
        const gamma = deviceOrientation.gamma || 0
        camera.quaternion.set(...deviceOrientationToQuaternion(alpha, beta, gamma))
        deviceOrientationsElement.textContent = `α: ${alpha | 0}, β: ${beta | 0}, γ: ${gamma | 0}`
        return 1
      }
    }
  }

  await Promise.race([supportsDeviceOrientationEvent.then(useDeviceOrientations), timeoutsDeviceOrientationEvent])
  return { update: () => update() }
}
