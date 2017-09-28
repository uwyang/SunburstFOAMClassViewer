#!/bin/bash
#echo args=$*

GEN_JAVA=
BUILD=build

usage() { echo Usage: $0 "[-j] [-b build_dir]" 1>&2; exit 1; }

while getopts ":jb:" opt; do
    case $opt in
        j)
            GEN_JAVA=1
            ;;
        b)
            BUILD=${OPTARG}
            ;;
        *)
            usage
            ;;
    esac
done

mkdir -p $BUILD/webapp/js
mkdir -p $BUILD/webapp/js/admin
mkdir -p $BUILD/webapp/data
mkdir -p $BUILD/webapp/css
mkdir -p $BUILD/webapp/images

if [ -n "$GEN_JAVA" ]; then
    mkdir -p $BUILD/src/java
    tools/build-foam.sh -j -b $PWD/build
    #node_modules/sefoam2/tools/build.sh -j -b $PWD/build
    tools/build-project.sh -j -b $PWD/build
else
    tools/build-foam.sh -b $PWD/build
    #node_modules/sefoam2/tools/build.sh -b $PWD/build
    tools/build-project.sh -b $PWD/build
fi
