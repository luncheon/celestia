import {
  Color,
  Geometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Texture,
  Vector3,
  VertexColors,
} from 'three'
import { constellations, stars } from './data'

const createStars = () => {
  const radius = 32
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
  geometry.vertices = stars.map(star => star.normal.multiplyScalar(1.25 ** star.vmag))
  geometry.colors = stars.map(star => new Color(...star.rgb).multiplyScalar(0.8 ** star.vmag))
  return new Points(geometry, new PointsMaterial({ size: 0.04, transparent: true, vertexColors: VertexColors, map: texture }))
}

const createConstellationLines = () => {
  const geometry = new Geometry()
  for (const { lines } of constellations) {
    for (const [star1, star2] of lines) {
      geometry.vertices.push(
        star1.normal.multiplyScalar(100).add(star2.normal.sub(star1.normal).normalize()),
        star2.normal.multiplyScalar(100).add(star1.normal.sub(star2.normal).normalize()),
      )
    }
  }
  return new LineSegments(geometry, new LineBasicMaterial({ color: 0x333366 }))
}

const createConstellationNames = () => {
  const createTextCanvas = (text: string) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const font = '100 60px yomogifont'
    context.font = font
    canvas.width = 2 ** Math.ceil(Math.log2(context.measureText(text).width * 1.1))
    canvas.height = 64
    context.font = font
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = '#558'
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
  return constellations.map(({ name, lines }) => {
    const stars = lines.flat().filter((star, i, stars) => stars.indexOf(star) === i)
    const normal = stars.reduce((normal, star) => normal.add(star.normal), new Vector3()).normalize()
    return createCanvasMesh(createTextCanvas(name), normal.multiplyScalar(2000))
  })
}

export const createObjects = () =>
  new FontFace('yomogifont', 'url(yomogifont.ttf)').load().then(font => {
    document.fonts.add(font)
    return [createStars(), createConstellationLines(), ...createConstellationNames()]
  })
