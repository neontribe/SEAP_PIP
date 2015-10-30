# SEAP PIP Assessment

## Setting up

1. run `npm install`
2. Build by running `grunt generate`
3. This will create a **build** folder. Point your browser at this to test
4. Run `grunt watch` to trigger `generate` whenever you change files in `src/`
5. git clone seap_core into your development directory
6. create a symlink between seap_core folder and the seap_core folder in the SEAP_PIP node_modules folder
7. create a symlink between src/css and seap_core/src/css
## What everything is

* The master template is at `src/assessment.handlebars`. This is for building the single `index.html` assessment page in `build`
* The data context for this template is at `assessment-data.json`. The `questions` property is an array and is used to construct all the questions "slide" `<div>`s in index.html.
* `helpers` is where we define template helpers for the above. Eg. **sluggify.js** turns strings into alphanumeric slugs. Used like `{{sluggify string}}`
* `css` contains the master CSS file, `style.css` This is stored in the seap_core repository which is a dependancy of this project. During development symlinks can be used to test style development. When deploying the css will need to be pushed to the seap_core repository in order to be upto date.
* The applications scripts are in `js/scripts.js`. If you run `grunt generate-production` the concatenated scripts will be uglified

## Deploy procedure

__Staging__
* We are using Travis (.travis.yml) and grunt to build test (Gruntfile.js) and deploy (deploy.sh)
* On EVERY push, pull request or merge Travis uses Grunt test task to run all _test.coffee and _test.js files in /tests
* If the tests pass, Travis commits the new build to gh-pages branch (our staging server) http://neontribe.github.io/SEAP_PIP

__Live__  
* When release is tagged and pushed  
`git tag -a v0.0.0-beta -m "description of release updates"`
`git push origin --tags`
* Travis will carry out procedure as for Staging
* If all goes well, push the new build to the live site - overwriting whatever is there.
* To set up live server run travis encrypt DEPLOY_HOST=123.12.12.12 --add for DEPLOY_HOST, DEPLOY_PATH DEPLOY_USER DEPLOY_PASS and add deploy-seap-pip.sh to deployment server (legacy hosting - live server access is locked by ip).
