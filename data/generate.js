const fs = require('fs')
const path = require('path')
const readline = require('readline')

// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Math/round#A_better_solution
const round = (number, precision) => {
  const shift = (number, precision, reverseShift) => {
    if (reverseShift) {
      precision = -precision
    }
    var numArray = ('' + number).split('e')
    return +(numArray[0] + 'e' + (numArray[1] ? +numArray[1] + precision : precision))
  }
  return shift(Math.round(shift(number, precision, false)), precision, true)
}

// https://stackoverflow.com/a/22630970
const bv2rgb = bv => {
  let t
  let r = 0.0
  let g = 0.0
  let b = 0.0
  if (bv < -0.4) bv = -0.4
  if (bv > 2.0) bv = 2.0
  if (bv >= -0.4 && bv < 0.0) {
    t = (bv + 0.4) / (0.0 + 0.4)
    r = 0.61 + 0.11 * t + 0.1 * t * t
  } else if (bv >= 0.0 && bv < 0.4) {
    t = (bv - 0.0) / (0.4 - 0.0)
    r = 0.83 + 0.17 * t
  } else if (bv >= 0.4 && bv < 2.1) {
    t = (bv - 0.4) / (2.1 - 0.4)
    r = 1.0
  }
  if (bv >= -0.4 && bv < 0.0) {
    t = (bv + 0.4) / (0.0 + 0.4)
    g = 0.7 + 0.07 * t + 0.1 * t * t
  } else if (bv >= 0.0 && bv < 0.4) {
    t = (bv - 0.0) / (0.4 - 0.0)
    g = 0.87 + 0.11 * t
  } else if (bv >= 0.4 && bv < 1.6) {
    t = (bv - 0.4) / (1.6 - 0.4)
    g = 0.98 - 0.16 * t
  } else if (bv >= 1.6 && bv < 2.0) {
    t = (bv - 1.6) / (2.0 - 1.6)
    g = 0.82 - 0.5 * t * t
  }
  if (bv >= -0.4 && bv < 0.4) {
    t = (bv + 0.4) / (0.4 + 0.4)
    b = 1.0
  } else if (bv >= 0.4 && bv < 1.5) {
    t = (bv - 0.4) / (1.5 - 0.4)
    b = 1.0 - 0.47 * t + 0.1 * t * t
  } else if (bv >= 1.5 && bv < 1.94) {
    t = (bv - 1.5) / (1.94 - 1.5)
    b = 0.63 - 0.6 * t * t
  }
  return [r, g, b]
}

const readCsv = async basename => {
  const records = []
  const filename = path.resolve(__dirname, 'source', basename + '.csv')
  for await (const line of readline.createInterface({ input: fs.createReadStream(filename, 'utf8') })) {
    records.push(line.split(','))
  }
  return records
}

const getStars = async () => {
  const hipNameMap = Object.fromEntries(await readCsv('hip_proper_name'))
  const records = []
  const filename = path.resolve(__dirname, 'source/hipparcos.txt')
  for await (const line of readline.createInterface({ input: fs.createReadStream(filename, 'utf8') })) {
    const [hip_number, vmag, ra_deg, dec_deg, bv_color] = line
      .slice(1, -1)
      .split('|')
      .map(s => +s)
    if (hip_number && vmag < 6.7) {
      const ra = (ra_deg * Math.PI) / 180
      const dec = (dec_deg * Math.PI) / 180
      const record = [
        hip_number,
        vmag,
        bv2rgb(bv_color).map(n => round(n, 2)),
        round(Math.cos(ra) * Math.cos(dec), 4),
        round(Math.sin(ra) * Math.cos(dec), 4),
        round(Math.sin(dec), 4),
      ]
      const name = hipNameMap[hip_number]
      name && record.push(name)
      records.push(record)
    }
  }
  return records
}

const getConstellations = async () => {
  const records = await readCsv('hip_constellation_line')
  return (await readCsv('constellation_name_utf8')).map(([, abbrev, , name]) => [
    name,
    records.filter(record => record[0] === abbrev).map(record => [+record[1], +record[2]]),
  ])
}

const writeJson = (basename, data) => fs.promises.writeFile(path.resolve(__dirname, basename + '.json'), JSON.stringify(data), 'utf8')

getStars().then(stars => writeJson('stars', stars))
getConstellations().then(constellations => writeJson('constellations', constellations))
