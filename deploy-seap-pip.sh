##!/usr/bin/env bash
echo -e "Tests passed - deploying to LIVE"

#Deploy gh-pages release tarball to live server
scp -r -i .ssh/nt_seap_deploy SEAP_PIP/* seaproot@94.142.89.2:/var/www/pip-assessment

echo -e "Deploy successful."

echo -e "Removing build files"
rm -rf SEAP_PIP release.tgz
