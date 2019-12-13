const fs = require('fs')
const path = require('path')
const readline = require('readline')

const readCsv = async basename => {
  const records = []
  const filename = path.resolve(__dirname, 'source', basename + '.csv')
  for await (const line of readline.createInterface({ input: fs.createReadStream(filename, 'utf8') })) {
    records.push(line.split(','))
  }
  return records
}

const getStars = async () => {
  const records = await readCsv('hip_lite_major')
  records.push(
    ...(await readCsv('hip_constellation_line_star'))
      .filter(star => records.every(([hip]) => hip !== star[0]))
      .map(([hip, ah, am, as, dh, dm, ds, magnitude]) => [hip, ah, am, as, dh < 0 ? 0 : 1, Math.abs(dh), dm, ds, magnitude]),
  )
  const hipNameMap = Object.fromEntries(await readCsv('hip_proper_name'))
  return records.map(record => {
    const [hip, ah, am, as, dsign, dh, dm, ds, magnitude] = record.map(n => +n)
    return [hip, hipNameMap[hip], ah * 3600 + am * 60 + as, (dsign ? 1 : -1) * (dh * 3600 + dm * 60 + ds), magnitude]
  })
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
