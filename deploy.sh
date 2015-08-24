##!/usr/bin/env bash
echo -e "Tests passed - deploying to STAGING"

#if this isn't a pull req set default github token
if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then

    if [ "$TRAVIS" == "true" ]; then
        git config --global user.email $GIT_EMAIL
        git config --global user.name $GIT_USER
    fi

#checkout gh_pages branch and update with contents of build folder
git remote rm origin
git remote add origin https://$GIT_USER:$GIT_PASS@github.com/neontribe/SEAP_PIP.git
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
    DATETIME=`date +%Y%m%d"-"%H%M%S`
    echo -e "Prepare files for live deploy"
    #Deploy gh-pages to deployment server
    cd ..
    tar -czf release.tgz SEAP_PIP 
    sudo apt-get -y install sshpass

    #copy tarball to deployment server
    sshpass -p $DEPLOY_PASS scp -o stricthostkeychecking=no release.tgz $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH

    echo -e "Deploying to Live."

    #ssh onto deployment server. unpack. tidy. fire live deploy script.
    sshpass -p $DEPLOY_PASS ssh $DEPLOY_USER@$DEPLOY_HOST  "cd $DEPLOY_PATH && tar -xvf release.tgz && rm -rf SEAP_PIP/.git && printf "$TRAVIS_TAG-$DATETIME" > SEAP_PIP/release.txt && rm release.tgz && bash deploy-seap-pip.sh"

    #TODO need to add robots.txt for live in above script or in deploy-seap-pip.sn on deploy server

    echo -e "SUCCESS: Released tag - $TRAVIS_TAG at $DATETIME"
fi
