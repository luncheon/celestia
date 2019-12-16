const fs = require('fs')
const path = require('path')
const readline = require('readline')

const round = n => {
  const shift = (n, precision) => {
    const [decimal, exponent] = ('' + n).split('e')
    return +(decimal + 'e' + (exponent ? +exponent + precision : precision))
  }
  return shift(Math.round(shift(n, 4)), -4)
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
        bv_color,
        round(Math.cos(ra) * Math.cos(dec)),
        round(Math.sin(ra) * Math.cos(dec)),
        round(Math.sin(dec)),
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
