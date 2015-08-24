##!/usr/bin/env bash
echo -e "Tests passed - deploying to LIVE"

#Deploy gh-pages release tarball to live server
scp -r -i .ssh/nt_seap_deploy testdir/* seaproot@94.142.89.2:/var/www/pip-assessment

echo -e "Deploy successful."
