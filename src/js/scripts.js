/**********************************************************************
START UP
**********************************************************************/

// define the database
var db = $.localStorage;

window.hashHistory = [];

if (db.isEmpty('ass')) {

	// setup the database ass object
	initAss();

	// set answered global to false
	window.answered = false;

	// load the intro slide
	loadSlide('main-menu');

} else {

	// welcome back users or allow new users to restart
	loadSlide('resume');

}

/**********************************************************************
FUNCTIONS
**********************************************************************/

function initAss() {
	// model the database 'ass' object
	var assTemplate = { // the questions which haven't been viewed
		unseenQuestions: [],
		seenQuestions: [],
		skippedQuestions: [], // the questions which have been viewed but not answered
		/*remainingCategories: _.map(_.uniq(window.allCategories), function(cat) { 
			return cat.toLowerCase()
					  .replace(/[^\w ]+/g,'')
					  .replace(/ +/g,'-'); }), // the categories not yet viewed*/
		remainingCategories: _.uniq(_.without(window.allCategories, null)),
		started: false, // whether a practise has been started
		answeredOne: false, // Whether any questions have been answered at all 
		context: null, // the jQuery object for the slide in hand
		slideType: null, // null or 'question' etc.
		mode: 'unseenQuestions', // 'unseenQuestions' or 'skippedQuestions'
		category: null, // or the name of the current category (activity)
		answers: {}, // the master object of category high scores for tallying
		low: false, // low qualification?
		high: false, // high qualification?
		reminders: [], // list of reminders form "Things to remember" checkboxes
		incomplete: true, // whether all the questions have been answered
		date: '',
		venue: '',
		time: ''
	};

	// Save the virgin ass to local storage
	db.set('ass', assTemplate);

	// reset radio buttons
	$('[type="radio"]').prop('checked', false);

}

function getCatQuestions(slug) {

	var questions = [];

	if (slug === "i-dont-know") {

		// Remove seen questions from 
		var all = [];

		// Empty "remaining categories"
		db.set('ass.remainingCategories', []);

		$.each(window.allQuestions, function(i, v) {
			
			// make an array of all questions
			// excluding followup questions
			if (v.category !== 'followup') {
				all.push(v.question);
			}

		});		

		var seen = db.get('ass.seenQuestions');

		db.set('ass.unseenQuestions', _.difference(all, seen));
		db.set('ass.category', null);

	} else {

		var reducedToCat = _.where(window.allQuestions, {category: slug});

		$.each(reducedToCat, function(i, v) {
			questions.push(v.question);
		});

		db.set('ass.unseenQuestions', questions);

		db.set('ass.category', slug);

	}


	pickQuestion();

}

function loadSlide(id, type) {

	if (id === 'stats') {

		// if you ran out of unseen questions and didn't skip any
		if (_.isEmpty(db.get('ass.unseenQuestions')) && _.isEmpty(db.get('ass.skippedQuestions')) && _.isEmpty(db.get('ass.remainingCategories')) && db.get('ass.started')) {
			db.set('ass.incomplete', false);
		}

		// compile the stats before showing slide
		compileStats();

	}

	if (id === 'categories') {
		compileCategories();
	}

	if (id === 'category-finished') {
		$('#this-activity').text(db.get('ass.category').toLowerCase());
	}

	$('.slide > *').removeClass('loaded');

	// set type in local storage or reset to null
	if (type) {
		db.set('ass.slideType', type);
	} else {
		db.set('ass.slideType', null);
	}

	// go to picked question
	window.location.hash = '#' + id;

	// focus title to announce title in AT
	$('#' + id)
		.find('[tabindex="-1"]')
		.focus();

	// find out if we've gone to one of the locations that don't need saving
	var exclude = _.find(['resume', 'break-time', 'resume-practise'], 
		function(unsaveable) { 
			return unsaveable === id;
	});

	// If it's not an excluded location, save location
	if (!exclude) {

		// Record where the user is for resuming purposes
		db.set('ass.whereIAm', id);

	}

	// Set context reference (jQuery object)
	db.set('ass.context', id);

	// add the loaded class for transitions
	$('#' + id + ' > *').addClass('loaded');

}

// show a random unseen question
function pickQuestion() {

	if (db.get('ass.show-qualify-low-mobility')) {
		loadSlide('qualify-low-mobility');
		db.set('ass.show-qualify-low-mobility', false);
		return;
	}

	if (db.get('ass.show-qualify-high-mobility')) {
		loadSlide('qualify-high-mobility');
		db.set('ass.show-qualify-high-mobility', false);
		return;
	}

	if (db.get('ass.show-qualify-low-dailyLiving')) {
		loadSlide('qualify-low-dailyLiving');
		db.set('ass.show-qualify-low-dailyLiving', false);
		return;
	}

	if (db.get('ass.show-qualify-high-dailyLiving')) {
		loadSlide('qualify-high-dailyLiving');
		db.set('ass.show-qualify-high-dailyLiving', false);
		return;
	}

	// We've started practicing
	db.set('ass.started', true);

	// the type of the previous slide if any
	var typeOfSlide = db.get('ass.slideType');
	// the last slide seen
	var context = db.get('ass.context');
	// get mode (unseen or skipped)
	var mode = db.get('ass.mode');

	if (typeOfSlide === 'question' && !window.answered && mode === 'unseenQuestions') {

		// put the unanswered question into the array of skipped questions
		var skipped = db.get('ass.skippedQuestions');
		skipped.push(db.get('ass.context'));
		db.set('ass.skippedQuestions', _.uniq(skipped));

	}

	// get the appropriate set
	var questions = db.get('ass.' + mode);

	if (db.get('ass.category')) {
		if (_.isEmpty(db.get('ass.unseenQuestions'))) {
			if (_.isEmpty(db.get('ass.remainingCategories'))) {

				db.set('ass.category', null);

				if (_.isEmpty(db.get('ass.skippedQuestions'))) {
					loadSlide('seen-all-even-skipped');
					db.set('ass.incomplete', false);
					return;
				} else {
					loadSlide('seen-all');
					return;
				}
			} else {
				loadSlide('category-finished');
				return;				
			}
		}
	} else {
		if (mode === 'unseenQuestions' && _.isEmpty(db.get('ass.unseenQuestions'))) {
			loadSlide('seen-all');
			return;
		}
		if (mode === 'skippedQuestions' && _.isEmpty(db.get('ass.skippedQuestions'))) {
			loadSlide('seen-all-even-skipped');
			db.set('ass.incomplete', false);
			return;
		}		
	}

	// init individual question var
	var question;

	if (mode === 'unseenQuestions') {

		if (db.get('ass.category')) { 

			question = questions[0];

		} else {

			// use underscore to get random question slug
			question = _.sample(questions);

		}

		// set collection with this question removed
		db.set('ass.' + mode, _.without(questions, question));

	} else {

		if (window.answered) {

			questions = _.without(questions, context);

			db.set('ass.' + mode, questions);

			if (db.get('ass.category')) { 

				question = questions[0];

			} else {

				// use underscore to get random question slug
				question = _.sample(questions);

			}

			// if the array is empty, all the skipped questions are answered
			if (question === undefined) {

				loadSlide('seen-all-even-skipped');
				return;
			}


		} else {

			// remove last question seen from random sample
			// so two questions don't show at once
			// unless this is the last one
			if (questions.length !== 1) {
				questions = _.without(questions, context);
			}

			if (db.get('ass.category')) { 

				question = questions[0];

			} else {

				// use underscore to get random question slug
				question = _.sample(questions);

			}

		}

	}

	// get seen questions array
	var seen = db.get('ass.seenQuestions');

	// add this new question
	seen.push(question);

	db.set('ass.seenQuestions', seen);

	// load question slide and set slide type global to 'question' 
	loadSlide(question, 'question');

	// set to false until button pressed
	window.answered = false;

}

// clear data and go to start screen
function restart() {

	db.set('ass.unseenQuestions', []);
	db.set('ass.seenQuestions', []);
	db.set('ass.skippedQuestions', []);
	db.set('ass.started', false);
	db.set('ass.promote', false);
	db.set('ass.mode', 'unseenQuestions');
	db.set('ass.incomplete', true);
	db.set('ass.category', null);
	db.set('ass.remainingCategories', _.uniq(window.allCategories));

	// go to start screen
	loadSlide('start');

}

// go to slide you were last at
function resume() {

	// get the stored slide id
	var whereIWas = db.get('ass.whereIAm');

	loadSlide(whereIWas);

}

function tally() {

	// get all the answers
	var answers = db.get('ass.answers');

	// init objects
	var ans = {};
	var addedup = {};

	// split into mobility and daily living
	ans.mobility = _.omit(answers, function(val, key) { return key.indexOf('Daily Living') !== -1; });
	ans.dailyLiving = _.omit(answers, function(val, key) { return key.indexOf('Mobility') !== -1; });

	console.log('answers mobility', ans.mobility);
	console.log('answers daily living ', ans.dailyLiving);

	// add up the highest values for each category
	// by taking the max value that's not 16 or * from each
	// category and adding them together
	addedup.mobility = _.reduce(ans.mobility, function(memo, cat){
	    return memo + _.max(_.without( _.pluck(cat, 'points'), 16, '*'));
	}, 0);

	addedup.dailyLiving = _.reduce(ans.dailyLiving, function(memo, cat){
	    return memo + _.max(_.without( _.pluck(cat, 'points'), 16, '*'));
	}, 0);

	return addedup;
}

// add the high scores for each category together
// and notify user if they qualify
function qualify() {

	var total = tally();
	console.log('mobility ', total.mobility);
	console.log('daily living ', total.dailyLiving);

	if (total.mobility >= 8) {

		//don't show the slide if you have already
		if (!db.get('ass.high-mobility') && !db.get('ass.low-mobility')) {

			db.set('ass.show-qualify-low-mobility', true);

		}

		// record that low qualification is possible
		db.set('ass.low-mobility', true);

	}

	if (total.mobility >= 15) {

		//don't show the slide if you have already
		if (!db.get('ass.high-mobility')) {

			db.set('ass.show-qualify-high-mobility', true);

		}

		// record that low qualification is possible
		db.set('ass.high-mobility', true);

	}	

	if (total.dailyLiving >= 8) {

		//don't show the slide if you have already
		if (!db.get('ass.high-dailyLiving') && !db.get('ass.low-dailyLiving')) {

			db.set('ass.show-qualify-low-dailyLiving', true);

		}

		// record that low qualification is possible
		db.set('ass.low-dailyLiving', true);

	}

	if (total.dailyLiving >= 15) {

		//don't show the slide if you have already
		if (!db.get('ass.high-dailyLiving')) {

			db.set('ass.show-qualify-high-dailyLiving', true);

		}

		// record that low qualification is possible
		db.set('ass.high-dailyLiving', true);

	}

}

// helper function to test numeric strings
function isNumeric(num) {
    return !isNaN(num);
}

function compileStats() {

	// Check to see if low or high applies
	var total = tally();

	if (total.mobility < 15) {
		db.set('ass.high-mobility', false);
	}

	if (total.mobility < 8) {
		db.set('ass.low-mobility', false);
	}

	if (total < 15) {
		db.set('ass.high-mobility', false);
	}

	if (total < 8) {
		db.set('ass.low-mobility', false);
	}

	divideAnswers();

	// template up the stats with handlebars and 
	// write to the stats container
	var template = Handlebars.compile(document.getElementById("stats-template").innerHTML);
	var assData = db.get('ass');
	var output = template(assData);
	$('#stats-content').html(output);

}

function compileCategories() {

	// template up the stats with handlebars and 
	// write to the categories container
	var template = Handlebars.compile(document.getElementById("categories-template").innerHTML);
	var assData = db.get('ass');
	var output = template(assData);
	$('#categories-content').html(output);

}

// remove answers from category nesting for easy iteration
function divideAnswers() {
	
	var answers = db.get('ass.answers');

	var importantAnswers = [];
	var catAnswers;

	$.each(answers, function(key, value) {
		catAnswers = _.values(value);
		importantAnswers.push(_.max(catAnswers, function(answer) { 
			return answer.points;
		}));
	});

	var removeZeros = _.reject(importantAnswers, function(ans) {
		return ans.points === 0;
	});

	// set these to be accessible by template
	db.set('ass.importantAnswers', removeZeros);

}

/**********************************************************************
HELPERS
**********************************************************************/

Handlebars.registerHelper('count', function(array) {
	return array.length || 0;
});

Handlebars.registerHelper('seen', function() {
	return window.allQuestions.length - db.get('ass.unseenQuestions').length;
});

Handlebars.registerHelper('answered', function() {

	var answers = db.get('ass.answers');

	var amount = 0;

	$.each(answers, function(key, value) {
	    amount += _.size(value);
	});

	return amount;
});

Handlebars.registerHelper('accuracy', function(array) {

	var answers = db.get('ass.answers');

	var answered = 0;

	$.each(answers, function(key, value) {
	    answered += _.size(value); 
	});

	var accuracy = Math.round((answered / allQuestions.length) * 100) + "%";

	return accuracy;
});

Handlebars.registerHelper('qualifyMobility', function() {
	
	var high = db.get('ass.high-mobility');
	var low = db.get('ass.low-mobility');

	if (high) {
		return "<p>It looks like you&#x2019;ll qualify for the high PIP rate for <strong>Mobility</strong>.</p>";
	} else if (low) {
		return "<p>It looks like you&#x2019;ll qualify for the standard PIP rate for <strong>Mobility</strong>.</p>";
	} else {
		return "<p>It doesn&#x2019;t so far look like you&#x2019;ll qualify for the <strong>Mobility</strong> portion of PIP.</p>";
	}

});

Handlebars.registerHelper('qualifyDailyLiving', function() {
	
	var high = db.get('ass.high-dailyLiving');
	var low = db.get('ass.low-dailyLiving');

	if (high) {
		return "<p>It looks like you&#x2019;ll qualify for the high PIP rate for <strong>Daily Living</strong>.</p>";
	} else if (low) {
		return "<p>It looks like you&#x2019;ll qualify for the standard PIP rate for <strong>Daily Living</strong>.</p>";
	} else {
		return "<p>It doesn&#x2019;t so far look like you&#x2019;ll qualify for the <strong>Daily Living</strong> portion of PIP.</p>";
	}

});

Handlebars.registerHelper('sluggify', function(words) {
	var slug = words
		.toLowerCase()
		.replace(/[^\w ]+/g,'')
		.replace(/ +/g,'-');
	return slug;
});

Handlebars.registerHelper('deprefix', function(cat) {
	var reduced = cat.split(':')[1].trim();
	return reduced;
});

function sluggify(string) {

	return string
		.toLowerCase()
		.replace(/[^\w ]+/g,'')
		.replace(/ +/g,'-');

}

/**********************************************************************
EVENTS
**********************************************************************/

// click to see a random question
$('body').on('click','[data-action="pick"]', function() {

	// run pickQuestion function to get a random unseen question
	pickQuestion();

});

// click to see a random question
$('body').on('click','[data-action="skipped"]', function() {

	// the first skipped question cannot have been answered
	window.answered = false;

	// set mode to skipped questions
	db.set('ass.mode', 'skippedQuestions');

	// pick a question
	pickQuestion();

});

// restart the questions part but keep the data
$('body').on('click','[data-action="restart"]', function() {

	// run restart function defined in FUNCTIONS block
	restart();

});

// restart the app
$('body').on('click','[data-action="start-or-resume"]', function() {

	// has the user (or _a_ user) been to the questions section before?
	if (db.get('ass.started')) {

		pickQuestion();

	} else {

		loadSlide('start');

	}

});

$('body').on('click','[data-action="break"]', function() {

	// run resume function defined in FUNCTIONS block
	db.set('ass.whereIAm', window.location.hash.slice(1));
	loadSlide('break-time');

});

$('.expandies').on('click','[aria-controls]', function() {

	var expanded = $(this).attr('aria-expanded');

	var controlled = $('#' + $(this).attr('aria-controls'));

	if (expanded === 'false') {

		$(this).attr('aria-expanded', 'true');

		controlled.attr('aria-hidden','false');

	} else {

		$(this).attr('aria-expanded', 'false');

		controlled.attr('aria-hidden','true');		

	}

});

$('body').on('click','[data-action="resume"]', function() {

	// run resume function defined in FUNCTIONS block
	resume();

});

$('body').on('click','[data-action="menu"]', function() {

	// run resume function defined in FUNCTIONS block
	loadSlide('main-menu');

});

$('body').on('click','[data-action="data"]', function() {

	// run resume function defined in FUNCTIONS block
	loadSlide('data');

});

$('body').on('click','[data-action="clean-up"]', function() {

	// set answered global to false
	window.answered = false;

	// initialize database
	initAss();

	// load the intro slide
	loadSlide('main-menu');

});

$('body').on('click','[data-action="delete-data"]', function() {

	// set answered global to false
	window.answered = false;

	// initialize database
	initAss();

	// load the deleted data slide
	loadSlide('deleted');

});

$('body').on('click','[data-action="stats"]', function() {

	// load the stats slide
	loadSlide('stats');

});

$('body').on('click','[data-action="prep"]', function() {

	// get id of slide to load
	var id = $(this).attr('data-prep-slug');

	// check checkboxes based on previous actions
	checkReminders(id);

	// load slide
	loadSlide(id);

});

$('body').on('click','[data-action="about-PIP"]', function() {

	// load slide
	loadSlide('about-PIP');

});

$('body').on('change','[data-action="save-basic-info"]', function() {

	db.set('ass.' + $(this).attr('id'), $(this).val());

});

$('body').on('change','[type="radio"]', function() {

	// record that change has been made
	window.answered = true;

	db.set('ass.answeredOne', true);

	// get checked answer's value and the category the question belongs to
	var context = db.get('ass.context');
	var points = $(':checked', '#' + context).val();
	var category = $(':checked', '#' + context).attr('data-category-name');
	var question = $('h2 em', '#' + context).text();
	var answer = $(':checked + span', '#' + context).text();

	if (!isNumeric(points)) {

		// turn the followup question into a slug
		var followupSlug = 'question-'+sluggify(points);
		// load the followup slide
		loadSlide(followupSlug);

	} else {

		// cast to real integer
		points = +points;

		// initialize the answer object
		var answerObject = {
			question: question,
			answer: answer,
			points: points
		};

		// check if the category object exists
		// and, if not, set it
		if (!db.isSet('ass.answers.' + category)) {
			db.set('ass.answers.' + category, category);
		}

		// set the new points for this question in this category
		db.set('ass.answers.' + category + '.' + context, answerObject);

		// fire the adding up function
		// to see if there are enough points to qualify
		qualify();
		
	}

});

$('body').on('click','[data-action="categories"]', function() { 

	loadSlide('categories');

});

$('body').on('click','[data-action="change"]', function() { 

	// get question slug
	var slug = $(this).attr('data-question');

	// just show the question slide
	loadSlide(slug, 'question');

});

$('body').on('click','[data-action="set-cat"]', function() { 

	var slug = $(this).attr('data-category');

	var reduced = _.without(db.get('ass.remainingCategories'), slug);

	db.set('ass.remainingCategories', reduced);

	getCatQuestions(slug);

});

/*$(window).on('hashchange', function(e) {

	// add hash to history
	window.hashHistory.push(window.location.hash);

	if (window.location.hash.substr(0,9) === '#question') {
		if (hashHistory.indexOf(window.location.hash > -1)) {
			loadSlide(window.location.hash.substr(1));

			// TODO Need to remove this question from working data here

		}
	}

});*/