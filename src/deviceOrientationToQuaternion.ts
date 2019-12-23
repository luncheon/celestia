const degtorad = Math.PI / 180 // Degree-to-Radian conversion

// https://qiita.com/73_ch/items/c9756d6ae76ea8367bd3
// https://w3c.github.io/deviceorientation/spec-source-orientation.html#worked-example-2
export const deviceOrientationToQuaternion = ({
  alpha,
  beta,
  gamma,
}: {
  alpha: number | null
  beta: number | null
  gamma: number | null
}) => {
  const _x = beta ? beta * degtorad : 0 // beta value
  const _y = gamma ? gamma * degtorad : 0 // gamma value
  const _z = alpha ? alpha * degtorad : 0 // alpha value

  const cX = Math.cos(_x / 2)
  const cY = Math.cos(_y / 2)
  const cZ = Math.cos(_z / 2)
  const sX = Math.sin(_x / 2)
  const sY = Math.sin(_y / 2)
  const sZ = Math.sin(_z / 2)

  const w = cX * cY * cZ - sX * sY * sZ
  const x = sX * cY * cZ - cX * sY * sZ
  const y = cX * sY * cZ + sX * cY * sZ
  const z = cX * cY * sZ + sX * sY * cZ

  return [x, y, z, w] as const
}
