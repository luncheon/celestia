const fs = require('fs')
const path = require('path')
const readline = require('readline')

const readCsv = async basename => {
  const records = []
  const filename = path.resolve(__dirname, basename + '.csv')
  for await (const line of readline.createInterface({ input: fs.createReadStream(filename, 'utf8') })) {
    records.push(line.split(','))
  }
  return records
}

const readData = async () => {
  const records = await readCsv('hip_lite_major')
  const hipNameMap = (await readCsv('hip_proper_name')).reduce((map, [hip, name]) => ((map[hip] = name), map), {})
  return records.map(record => {
    const [hip, ah, am, as, dsign, dh, dm, ds, magnitude] = record.map(n => +n)
    return [
      hipNameMap[hip],
      ah * 3600 + am * 60 + as,
      (dsign ? 1 : -1) * (dh * 3600 + dm * 60 + ds),
      magnitude,
    ]
  })
}

;(async () => {
  const records = await readData()
  fs.writeFileSync(path.resolve(__dirname, 'hip_lite_major.json'), JSON.stringify(records), 'utf8')
})()
