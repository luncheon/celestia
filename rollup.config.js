import fs from 'fs'
import path from 'path'

import del from 'rollup-plugin-delete'
import copy from 'rollup-plugin-copy'
import html from '@rollup/plugin-html'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import { eslint } from 'rollup-plugin-eslint'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import filesize from 'rollup-plugin-filesize'
import analyze from 'rollup-plugin-analyzer'
import serve from 'rollup-plugin-serve'

const production = process.env.NODE_ENV === 'production'
const watching = process.env.ROLLUP_WATCH
const outputDir = production ? 'docs' : '.docs'

const template = () =>
  fs
    .readFileSync(path.resolve(__dirname, 'src/index.html'), 'utf-8')
    .replace(/\$\{__BUILT_AT__\}/, new Date().toISOString().replace(/[-:T]|\..*/g, ''))

export default {
  input: 'src/index.ts',
  output: {
    file: `${outputDir}/index.js`,
    format: 'esm',
    sourcemap: !production,
  },
  plugins: [
    !watching && analyze({ summaryOnly: true, filter: module => module.size !== 0 }),
    !watching && filesize({ showBrotliSize: true }),
    del({ targets: outputDir }),
    copy({ targets: [{ src: ['font/yomogifont.ttf'], dest: outputDir }] }),
    html({ template }),
    resolve({ browser: true }),
    eslint({ include: ['src/**/*.ts'] }),
    typescript({ clean: true }),
    json({ compact: true, namedExports: false }),
    production && terser({ warnings: true, compress: { passes: 3 }, output: { comments: false } }),
    watching && serve({ contentBase: outputDir, open: true }),
  ],
  watch: {
    clearScreen: false,
    include: 'src/**',
  },
}
