# Chanhelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [1.1.2] - 2020-08-30
### Added
- Add CLI arguments (rewrites env variables if passed for migration period)
  - `--pretty-print` for pretty print output json
  - `--pages` for pass pages list
  - `--out-dir` for specify output directory
  - `--key` for pass google spreadsheet pages
  - `--delay` for specify delay between requests to pages
- Add new env variable `GSTRANSLATE_KEY`
### Deprecated
  - Deprecated env variable `TRANSLATION_KEY` use `GSTRANSLATE_KEY` or `--key` instead
  - Deprecated env variable `TRANSLATION_PAGES` use `--pages|-p` instead
  - Deprecated env variable `TRANSLATION_PRETTY` use `--pretty-print` instead
  - Deprecated env variable `TRANSLATION_DIR` use `--out-dir` instead

## [1.0.5] - 2020-08-29
### Fixed
- Fix (#4) Header linne should not be presend in final translations

## [1.0.0 - 1.0.4] 2020-08-29
First release
