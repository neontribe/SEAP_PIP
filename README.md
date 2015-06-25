# SEAP PIP Assessment

## Setting up

1. run `npm install`
2. Build by running `grunt generate`
3. This will create a **build** folder. Point your browser at this to test
4. Run `grunt watch` to trigger `generate` whenever you change files in `src/`

## What everything is

* The master template is at `src/assessment.handlebars`. This is for building the single `index.html` assessment page in `build`
* The data context for this template is at `assessment-data.json`. The `questions` property is an array and is used to construct all the questions "slide" `<div>`s in index.html.
* `helpers` is where we define template helpers for the above. Eg. **sluggify.js** turns strings into alphanumeric slugs. Used like `{{sluggify string}}`
* `css` contains the master CSS file, `style.css`
* The applications scripts are in `js/scripts.js`. If you run `grunt generate-production` the concatenated scripts will be uglified

## Deploy procedure

__Staging__
* We are using Travis (.travis.yml) and grunt to build test (Gruntfile.js) and deploy (deploy.sh)
* On EVERY push, pull request or merge Travis uses Grunt test task to run all _test.coffee and _test.js files in /tests
* If the tests pass, Travis commits the new build to gh-pages branch (our staging server) http://neontribe.github.io/SEAP_PIP

__Live__  
**There curently is no live hosting in place but the plan is as follows**
* When release is tagged and pushed
* Use Travis to carry out procedure as for Staging - add some lines to deploy.sh to detect release tag and...
* If all goes well, push the new build to the live site - overwriting whatever is there.
