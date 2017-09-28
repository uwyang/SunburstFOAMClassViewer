#!/bin/bash
cd ..
tar -czf project/project.tgz \
    project/build.gradle \
    project/tools \
    project/http.py \
    project/build/webapp/js/* \
    project/build/webapp/css/* \
    project/build/webapp/data/* \
    project/index.html \
    project/src/main/js/ \
    project/node_modules/sefoam2/src/main/js
# e.g., project == sesad, LiveCode etc. 
