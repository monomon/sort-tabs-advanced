#!/bin/bash

web-ext lint --source-dir=./src/
# add signing too
web-ext build --source-dir=./src/ --artifacts-dir=./build/ --overwrite-dest
