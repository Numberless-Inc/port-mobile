# C++ files
This directory contains crypto helpers for use in Port. This directory will eventually contain more.

## Understanding this directory
1. include: Headers for this project
    - /external: Headers for external dependencies. Currently only OpenSSL
1. lib: external dependency archives compiled on a per-architecture basis
1. src: source files
    - NativeCryptoModule.cpp: The bridging file for the native crypto module. Uses JSI.
    - * standard implementations and wrappers for cryptographic methods exported to the client
1. tests: tests that are meant to run on a developer's pc, not a production device. Used to assert that crypto helpers work as expected, not that transpiling succeeds
1. CMakeLists.txt: used for compiling and running tests during development
1. build: contents ignored by git

## Running tests
```bash
cd shared/build
CXX=g++ cmake ..
make
./tests
```