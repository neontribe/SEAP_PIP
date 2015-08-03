##!/usr/bin/env bash
echo -e "Tests passed - deploying to STAGING"

#if this isn't a pull req set default github token
if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then

    if [ "$TRAVIS" == "true" ]; then
        git config --global user.email "katja@neontribe.co.uk"
        git config --global user.name "katjam"
    fi

#checkout gh_pages branch and update with contents of build folder
git remote rm origin
git remote add origin https://katjam:9e0e2d43e5b1c07ee6da44d25e46840795da1e9f@github.com/neontribe/SEAP_PIP.git
git fetch
git checkout gh-pages
cp -r build/* .
rm -r build
rm -r node_modules
git add .
git commit -m "Travis build $TRAVIS_BUILD_NUMBER pushed to Github Pages"
git pull origin gh-pages
git push origin gh-pages
fi

#if this is a tagged release, deploy to LIVE
if [ "$TRAVIS_TAG" ]; then
    echo -e "Release tag:"
    echo -e $TRAVIS_TAG
    #Deploy gh-pages to live server
    #todo
    cd ..
    tar -czf release.tgz SEAP_PIP 
    sudo apt-get -y install sshpass
    set -x
    ls
    sshpass -p $DEPLOY_PASS -o stricthostkeychecking=no scp release.tgz $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH
    sshpass -p $DEPLOY_PASS ssh $DEPLOY_USER@$DEPLOY_HOST $DEPLOY_PATH/release_deploy.sh
    echo -e "Deploy successful."
fi
