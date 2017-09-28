#!/bin/bash
echo -e "\nbuilding project"
#echo args=$*

GEN_JAVA=
BUILD=build

usage() { echo Usage: $0 "[-j] -b build_dir" 1>&2; exit 1; }

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

#NOTE: not using $BUILD
cp src/main/css/*.css build/webapp/css 2>>/dev/null
cp src/main/images/* build/webapp/images 2>>/dev/null

node tools/build.js flags=web,debug,js bin=$BUILD/webapp/js/project-bin.js
node tools/build.js flags=someDependency,_only_ bin=$BUILD/webapp/js/project-some-dependency-bin.js


# customer specific
node tools/build.js flags=customer,_only_ bin=$BUILD/webapp/js/project-customer-bin.js

if [ -n "$GEN_JAVA" ]; then
    echo -e "generating java to $BUILD/src/java"
    node tools/build.js flags=debug,java,node bin=$BUILD/project-java-bin.js
    node tools/genjava.js $BUILD/src/java
    # cleanup
    rm -f $BUILD/*-java-bin.js
fi
