#!/usr/bin/env node

require('dotenv').config()
const http = require('https')
const csv = require('csv')
const fs = require('fs')
const path = require('path')

const GOOGLE_DOC = {
  BASE_URL: 'https://docs.google.com/spreadsheets/d/{{KEY}}/gviz/tq?tqx=out:{{FORMAT}}&sheet={{SHEET}}',
  KEY: process.env.TRANSLATION_KEY,
  FORMAT: 'csv'
}
const KEY_COLUMN_POS = 0
const DEFAULT_COLUMN_POS = 1 // Column with default language

const JSON_PRETTY = parseBool(process.env.TRANSLATION_PRETTY || '') ? 1 : 0
const PAGES = (process.env.TRANSLATION_PAGES || '').split(/\s*,\s*/).filter(NotEmpty)
const LOCALES_DIR = path.normalize(
  path.join(
    process.cwd(),
    (process.env.TRANSLATION_DIR || './locales')
  )
)

if (PAGES.length <= 0) {
  console.error('Pages is not specified. use env variable TRANSLATION_PAGES to specify list of pages separeted by comma')
  return process.exit(1)
}
if (!GOOGLE_DOC.KEY) {
  console.error('TRANSLATION_KEY is not specified', GOOGLE_DOC.KEY)
  return process.exit(2)
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

function docurl (googledoc, pagename) {
  return googledoc.BASE_URL
    .replace('{{KEY}}', googledoc.KEY)
    .replace('{{FORMAT}}', googledoc.FORMAT)
    .replace('{{SHEET}}', pagename)
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
        mask = row[KEY_COLUMN_POS].replace('@PATH=', '') + '/'
        return
      }

      header.langs.forEach((lang, idx) => {
        result[lang][mask + row[KEY_COLUMN_POS]] = row[KEY_COLUMN_POS + idx + 1] || row[DEFAULT_COLUMN_POS]
      })
    })

    header.langs.forEach(lang => {
      const filename = `${LOCALES_DIR}/${lang}.json`
      console.log('Writing file: ' + filename)
      fs.writeFileSync(filename, JSON.stringify(result[lang], null, 2 * JSON_PRETTY))
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

const pagesUrls = PAGES.map(pagename => docurl(GOOGLE_DOC, pagename))
const pagesRequests = pagesUrls.map((url, idx) => request(url, 50 * idx))

console.log('Getting pages:', PAGES.join(','))

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
