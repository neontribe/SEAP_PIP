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
