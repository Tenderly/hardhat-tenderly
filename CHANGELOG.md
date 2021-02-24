# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.8] - 2021-2-24

### Changed

- push and verify will now correctly fall back to the network provided in contracts when no --network flag is passed

## [1.0.7] - 2021-2-11

### Changed

- persistArtifact now correctly recursively traverses the dependencies of a contract
- Axios version bumped to 0.21.1

## [1.0.6] - 2020-11-26

### Changed

- Fixed config type bindings

## [1.0.5] - 2020-11-26

## [1.0.4] - 2020-11-25

### Added

- Added persistArtifact type definition to type-extension file

## [1.0.3] - 2020-10-22

### Changed

- Resolved bytecode mismatch errors due to bad solc optimizer parsing.

## [1.0.2] - 2020-10-22

### Changed

- Fixed npm configuration so that the package now installs properly.


