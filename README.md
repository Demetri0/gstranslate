# gstranslate
Simple translation management tool for small and growing projects based on Google Spreadsheets

![Demo](./assets/demo.png)

## Why?
- Existing solutions is expansive and their free tier includes only up to 1000 translation keys.
- Google Spreadsheet is comfortable enough to edit with many people in team, with great permission system,
  which allows to give permission for editors to edit only specified range.
  This is good place to have a discussion about translations and place comments.
  And it is free :p.

## How it works
- You creates a Google Spreadsheets;
- Configure permissions (spreadsheet must be accessible by direct link);
- Creates your translations, you may use so many pages in one spreadsheet as you wish;
- Configure environment variables for gstranslate;
- When your translations is ready, you run `gstranslate` and it generates you `json` files
  for each language for which you created column in google spreadsheet.

## Google Spreadsheet
Google spread sheet should have defined format

### Header Line
Header line - is the first line on each page.
**WARNING** It should always be a comment (starts with `#`) to solve next 2 issues:
- Header line should not be part of final translations;
- *Composite Keys* from previous page should not have effect to the next one.

### Key column
The first column contains keys which could be used in your code.
Keys could be names as you wish, but the recommended way to name it is dot-separated
for example:
- `MyComponent.myField.title`
- `MyComponent.myField.placeholder`

### Language columns
The next to Key column should be one or more language columns.
First line of each column should contains a language code
which will be used as file name for generated translations.
You could use something like `en`,`sv` or `en_US`, `sv_FI` or anything another format you would like to use.

**default language** - is one of language columns (by default the first one)
which will be used if translation for next columns is not specified.
That helps to avoid duplication of translations in cases
when translation for all languages should be the same.

*if you actually want to keep translation for some language empty - you should use
special keyword:* `<EMPTY>`, but in our experience it is rarely case.

### Comments
Each line(row) starts with `#` symbol will be ignored

### @PATH (Composite key)
`@PATH=` is special directive allow to make keys shorter.
Allow to avoid duplication, and make less changes in case you need to change keys.

We are using the same directive in `webpack` which translates to path to component.
For now it is the only one directive. If you have another ideas of using them please
feel free to create an issue.

### Example of table for google spreadsheet
The next table demonstrates how translations look like in google spreadsheet

 \# KEY | en | ru
-----|----|----
some.kind.of.key | Default en translation | Русский перевод
some.another.key | The same translation for en and ru |
#some comment line | |
one.more.key | One more english | Ещё один русский
@PATH=pages/index | |
composite.key | Composite key will look like `pages/index/composite.key` |
composite.key2 | This will be `pages/index/composite.key2` | &lt;EMPTY&gt;

### Generated files
The above table will generate two files with next content:
#### en.json
```json
{
  "some.kind.of.key": "Default en translation",
  "some.another.key": "The same translation for en and ru",
  "one.more.key": "One more english",
  "pages/index/composite.key": "Composite key will look like `pages/index/composite.key`",
  "pages/index/composite.key2": "This will be `pages/index/composite.key2`",
}
```
#### ru.json
```json
{
  "some.kind.of.key": "Русский перевод",
  "some.another.key": "The same translation for en and ru",
  "one.more.key": "Ещё один русский",
  "pages/index/composite.key": "Composite key will look like `pages/index/composite.key`",
  "pages/index/composite.key2": ""
}
```

## Environment variables
- `TRANSLATION_KEY` - is a google spreadsheet key (**Required**)
- `TRANSLATION_PAGES` - is comma-separated list of pages in google spreadsheet (**Required**)
- `TRANSLATION_PRETTY` - makes output format pretty-printed json (**Default:** `false`)
- `TRANSLATION_DIR` - directory for output translation files (**Default:** `./locales`)

## Useful conditional formatting for google spreadsheet
We are using next conditional formatting rules in our spreadsheets
### Comments
- **Range:** `A:C`
- **Formula:** `=LEFT($A1) = "#"`
- **Color:** Light Green
### @PATH
- **Range:** `A:C`
- **Formula:** `=LEFT($A1;6) = "@PATH="`
- **Color:** Green
### Duplicated translations in one row
- **Range:** `A:C`
- **Formula:** `=AND(LEFT($A1) <> ""; AND($B1 = $C1; $B1 <> ""))`
- **Color:** Orange
### Default translation missed
- **Range:** `A:C`
- **Formula:** `=AND(LEFT($A1) <> ""; AND($B1 = ""; $C1 <> ""))`
- **Color:** Red

## Contribution
If you would like to contribute - please do not make PR with breaking changes, and start with issue.

## License
MIT
