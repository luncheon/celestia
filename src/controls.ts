import { Camera, Euler, Math as Math3, Quaternion } from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

const degToRad = Math3.degToRad
const getElementById = (id: string) => document.getElementById(id)! // eslint-disable-line @typescript-eslint/no-non-null-assertion

let deviceOrientation: DeviceOrientationEvent | undefined
addEventListener('deviceorientationabsolute', event => (deviceOrientation = event))

const supportsDeviceOrientationEvent = new Promise(resolve => {
  let deviceOrientationEventCount = 0
  addEventListener('deviceorientationabsolute', function checkDeviceOrientationSupported() {
    if (++deviceOrientationEventCount > 1) {
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
    const deviceOrientationsElement = getElementById('device-orientations')
    deviceOrientationsElement.style.display = ''
    const q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)) // - PI/2 around the x-axis
    const euler = new Euler()
    update = () => {
      const latitude = 35
      if (deviceOrientation instanceof DeviceOrientationEvent) {
        const alpha = degToRad(deviceOrientation.alpha || 0)
        const beta = degToRad((deviceOrientation.beta || 0) - latitude)
        const gamma = degToRad(deviceOrientation.gamma || 0)
        camera.quaternion.setFromEuler(euler.set(beta, alpha, -gamma, 'YXZ')).multiply(q1)
        deviceOrientationsElement.textContent = `α: ${alpha.toFixed(2)}, β: ${beta.toFixed(2)}, γ: ${gamma.toFixed(2)}}`
        return 1
      }
    }
  }

  await Promise.race([supportsDeviceOrientationEvent.then(useDeviceOrientations), timeoutsDeviceOrientationEvent])

  return { update: () => update() }
}
