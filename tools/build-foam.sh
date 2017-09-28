#!/bin/bash
echo -e "\nbuilding foam2"
#echo args=$*

GEN_JAVA=
BUILD=../../../build

usage() { echo Usage: $0 "[-j] -b build_dir" 1>&2; exit 1; }

while getopts "jb:" opt; do
    case ${opt} in
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

cd src/foam2
node tools/build.js node,js
cp foam-bin.js $BUILD/webapp/js/foam-node-bin.js

# NOTE: sql included by sefoam2
node tools/build.js web,js
cp foam-bin.js $BUILD/webapp/js/foam-bin.js

# nanos
node tools/sebuild.js flags=web,js files=../src/foam/nanos/nanos.js src=../src/  bin=$BUILD/webapp/js/foam-nanos-bin.js

if [ -n "$GEN_JAVA" ]; then
    echo -e "generating java to $BUILD/src/java"
    node tools/build.js web,java,node
    cp foam-bin.js $BUILD/foam-java-bin.js
    node tools/genjava.js tools/classes.js $BUILD/src/java
fi
cd ../..
