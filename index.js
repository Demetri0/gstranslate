#!/usr/bin/env node

require('dotenv').config()
const http = require('https')
const csv = require('csv')
const fs = require('fs')
const path = require('path')
const { getopt } = require('stdio')

const KEY_COLUMN_POS = 0
const DEFAULT_COLUMN_POS = 1 // Column with default language

const opt = {
  'key': process.env.GSTRANSLATE_KEY || process.env.TRANSLATION_KEY,
  'pages': (process.env.TRANSLATION_PAGES || '').split(/\s*,\s*/).filter(NotEmpty),
  'pretty-print': parseBool(process.env.TRANSLATION_PRETTY || '') ? 1 : 0,
  'out-dir': path.normalize(
    path.join(
      process.cwd(),
      (process.env.TRANSLATION_DIR || './locales')
    )
  ),
  'delay': 50
}

const args = getopt({
  'key': {
    key: 'k',
    args: 1,
    default: '', // TODO: Remove for version 2 (breaking change)
    // required: true, // TODO: Add for version 2 (breaking change)
    description: 'Key of google spreadsheet document'
  },
  'pages': {
    key: 'p',
    default: [], // TODO: Remove for version 2 (breaking change)
    // required: true, // TODO: Add for version 2 (breaking change)
    multiple: true,
    description: 'Pages list in google spreadsheet document that you wish to generate translations'
  },
  'pretty-print': {
    // default: false, // TODO: Add for version 2 (breaking change)
    description: 'Pretty-print output translations'
  },
  'out-dir': {
    key: 'o',
    args: 1,
    default: 'undefined', // TODO: Change to './locales' for version 2 (breaking change)
    description: 'Output directory to place generated translation files'
  },
  'delay': {
    args: 1,
    default: 50,
    description: 'Delay in ms between requests to pages'
  }
})
// Backward computability for migrate from env (args rewrites env)

if ([args.pages].flat().length > 0) {
  opt.pages = [args.pages].flat()
}
if (args.key) {
  opt.key = args.key
}
opt.delay = Number.parseInt(args.delay)
if (args['out-dir'] !== 'undefined') {
  opt["out-dir"] = args['out-dir']
}
if (args['pretty-print']) {
  opt['pretty-print'] = args['pretty-print']
}

// Deprecations
if (process.env.TRANSLATION_KEY) {
  console.warn('\x1b[33m[WARN]\x1b[0m Env \x1b[1mTRANSLATION_KEY\x1b[0m is deprecated, use \x1b[1mGSTRANSLATE_KEY\x1b[0m instead')
}
if (process.env.TRANSLATION_PAGES) {
  console.warn('\x1b[33m[WARN]\x1b[0m Env \x1b[1mTRANSLATION_PAGES\x1b[0m is deprecated, please pass pages list via cli arguments (\x1b[1m--pages|-p\x1b[0m)')
}
if (process.env.TRANSLATION_PRETTY) {
  console.warn('\x1b[33m[WARN]\x1b[0m Env \x1b[1mTRANSLATION_PRETTY\x1b[0m is deprecated, please use cli argument \x1b[1m--pretty-print\x1b[0m instead')
}
if (process.env.TRANSLATION_DIR) {
  console.warn('\x1b[33m[WARN]\x1b[0m Env \x1b[1mTRANSLATION_DIR\x1b[0m is deprecated, please use cli argument \x1b[1m--out-dir\x1b[0m instead')
}

// TODO: Remove below checks in case get rid of env in version 2
if (opt.pages.length <= 0) {
  console.error('Pages is not specified. use env variable TRANSLATION_PAGES to specify list of pages separated by comma')
  process.exit(1)
}
if (!opt.key) {
  console.error('TRANSLATION_KEY is not specified', opt.key)
  process.exit(2)
}

const request = (url, delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(function () {
      http.get(url, res => {
        res.setEncoding('utf8')
        let body = ''
        res.on('data', chunk => { body += chunk })
        res.on('end', () => resolve(body))
      }).on('error', reject)
    }, delay)
  })
}

function docURL (key, pageName) {
  const GOOGLE_DOC = {
    BASE_URL: 'https://docs.google.com/spreadsheets/d/{{KEY}}/gviz/tq?tqx=out:{{FORMAT}}&sheet={{SHEET}}',
    FORMAT: 'csv'
  }
  return GOOGLE_DOC.BASE_URL
    .replace('{{KEY}}', key)
    .replace('{{FORMAT}}', GOOGLE_DOC.FORMAT)
    .replace('{{SHEET}}', pageName)
}

function convert (body) {
  csv.parse(body, function (err, data) {
    if (err) {
      throw err
    }
    const HEADER_ROW_POS = 0
    const header = {
      langs: data[HEADER_ROW_POS].slice(KEY_COLUMN_POS + 1).filter(NotEmpty)
    }

    const result = {}
    header.langs.forEach(lang => {
      result[lang] = {}
    })

    let mask = ''

    data.forEach(function (row) {
      if (/^\s*#.*/.test(row[KEY_COLUMN_POS])) {
        mask = ''
        return
      }

      if (row[KEY_COLUMN_POS].includes('@PATH=')) {
        mask = path.normalize(row[KEY_COLUMN_POS].replace('@PATH=', '') + '/')
        return
      }

      header.langs.forEach((lang, idx) => {
        result[lang][mask + row[KEY_COLUMN_POS]] = row[KEY_COLUMN_POS + idx + 1] || row[DEFAULT_COLUMN_POS]
      })
    })

    header.langs.forEach(lang => {
      const filepath = path.join(opt['out-dir'], lang + '.json')
      console.log('Writing file: ' + filepath)
      fs.writeFileSync(filepath, JSON.stringify(result[lang], null, 2 * opt['pretty-print']))
    })
  })
}

function parseBool (str) {
  return ['y', 't', 'on', 'yes', 'true', '1'].indexOf(str.toLowerCase()) !== -1
}
function NotEmpty (arg) {
  return !!arg
}
function concat (sep) {
  return function (s1, s2) {
    return s1 + s2 + sep
  }
}

/// START

const pagesUrls = opt.pages.map(pageName => docURL(opt.key, pageName))
const pagesRequests = pagesUrls.map((url, idx) => request(url, opt.delay * idx))

console.log('Getting pages:', opt.pages.join(','))

Promise.all(pagesRequests)
  .then(function (pagesData) {
    return pagesData.reduce(concat('\n'), '')
  })
  .then(body => {
    convert(body)
  })
  .catch((err) => {
    console.error('Error while loading spreadsheet:', err)
  })
