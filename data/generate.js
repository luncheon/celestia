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
