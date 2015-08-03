#!/bin/bash
cd `dirname $0`

# Extract the package
tar -xzf release.tgz
rm release.tgz

# Swap it all around, keeping the previous version aside in case something goes wrong
rm -rf www_previous
mv www www_previous
mv SEAP_PIP www

# ADD this script to remote live server
