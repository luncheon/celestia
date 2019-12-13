import { Vector3 } from 'three'
import _constellations from '../data/constellations.json'
import _stars from '../data/stars.json'

export const stars = _stars.map(([hip, rightAscension, declination, magnitude, name]) => {
  const a = (rightAscension / 86400) * 2 * Math.PI
  const b = (declination / 3600 / 180) * Math.PI
  const normal = new Vector3(Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b))
  return {
    hip,
    name,
    magnitude,
    get normal() {
      return normal.clone()
    },
  }
})

const hipStarMap = Object.fromEntries(stars.map(star => [star.hip, star]))

export const constellations = _constellations.map(([name, lines]) => ({
  name,
  lines: lines.map(([hip1, hip2]) => [hipStarMap[hip1], hipStarMap[hip2]] as const).filter(([star1, star2]) => star1 && star2),
}))
