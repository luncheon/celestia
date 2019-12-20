import { Camera } from 'three'
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

export const createControls = async (camera: Camera) => {
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
        const latitude = 35
        const deviceOrientation = deviceOrientationControls.deviceOrientation
        if (deviceOrientation instanceof DeviceOrientationEvent) {
          const alpha = deviceOrientation.alpha || 0
          const beta = deviceOrientation.beta || 0
          const gamma = deviceOrientation.gamma || 0
          alphaElement.textContent = Math.round(alpha) as string & number
          betaElement.textContent = Math.round(beta) as string & number
          gammaElement.textContent = Math.round(gamma) as string & number
          deviceOrientationControls.deviceOrientation = {
            alpha,
            beta: ((beta + 180 - latitude) % 360) - 180,
            gamma,
          }
          deviceOrientationControls.update()
          return 1
        }
      }
    }),
    timeoutsDeviceOrientationEvent,
  ])

  return { update: () => update() }
}
