/**********************************************************************
START UP
**********************************************************************/

// define the database
var db = $.localStorage;

window.hashHistory = [];

if (db.isEmpty('ass')) {

	console.log('empty');

	// setup the database ass object
	initAss();

	// set answered global to false
	window.answered = false;

	// load the intro slide
	loadSlide('main-menu');

} else {

	console.log('not empty');

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
		remainingCategories: _.uniq(window.allCategories),
		started: false, // whether a practise has been started
		answeredOne: false, // Whether any questions have been answered at all 
		context: null, // the jQuery object for the slide in hand
		slideType: null, // null or 'question' etc.
		mode: 'unseenQuestions', // 'unseenQuestions' or 'skippedQuestions'
		category: null, // or the name of the current category (activity)
		answers: {}, // the master object of category high scores for tallying
		low: false, // low qualification?
		high: false, // high qualification?
		promote: false, // whether a food/drink question has promoted the user from WRAG to Support
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

		$.each(window.allQuestions, function(i, v) {
			all.push(v.question);
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
		if (_.isEmpty(db.get('ass.unseenQuestions')) && _.isEmpty(db.get('ass.skippedQuestions')) && db.get('ass.started')) {
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

	console.log('slide loaded');

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

	// We've started practicing
	db.set('ass.started', true);

	// the type of the previous slide if any
	var type = db.get('ass.slideType');
	// the last slide seen
	var context = db.get('ass.context');
	// get mode (unseen or skipped)
	var mode = db.get('ass.mode');

	console.log(window.answered);

	if (type === 'question' && !window.answered && mode === 'unseenQuestions') {

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

			console.log('Didn\'t remove one', questions);

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

	console.log('restarting');

	// go to start screen
	loadSlide('start');

}

// go to slide you were last at
function resume() {

	console.log('resuming');

	// get the stored slide id
	var whereIWas = db.get('ass.whereIAm');

	loadSlide(whereIWas);

}

function tally() {
	// get all the answers
	var answers = db.get('ass.answers');

	// add up the highest values for each category
	// by taking the max value that's not 16 from each
	// category and adding them together
	var total = _.reduce(answers, function(memo, cat){
	    return memo + _.max(_.without( _.pluck(cat, 'points'), 16, '*') );
	}, 0);

	return total;
}

// add the high scores for each category together
function qualify() {

	var total = tally();

	console.log('total', total);

	if (total >= 15) {

		// if an end question was set to promote from low to high
		if (db.get('ass.promote')) {

			//don't show the slide if you have already
			if (!db.get('ass.high') && !db.get('ass.low')) {

				loadSlide('qualify-high');

			}

			// record that low qualification is possible
			db.set('ass.low', true);
			// AND record that high qualification is possible
			db.set('ass.high', true);

		} else {

			//don't show the slide if you have already
			if (!db.get('ass.high') && !db.get('ass.low')) {

				loadSlide('qualify-low');

			}

			// record that low qualification is possible
			db.set('ass.low', true);		

		}

	} else {

		// reset to false
		db.set('ass.low', false);

	}

}

// helper function to test numeric strings
function isNumeric(num) {
    return !isNaN(num);
}

function compileStats() {

	divideAnswers();

	if (_.isEmpty(db.get('ass.supportAnswers'))) {
		db.set('ass.high', false);
	}

	// if WRAGroup a no, set to false
	if (_.isEmpty(db.get('ass.WRAGAnswers'))) {
		db.set('ass.low', false);
	}

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

	var supportAnswers = [];
	var WRAGAnswers = [];

	// ugly nested each to make a handelebars #each iterable array of question objects
	$.each(answers, function(key, value) {
		$.each(value, function(k, v) {
			// include support group answers
			if (v.points === 16) {
				// push to flattened array
				supportAnswers.push({
					question: v.question,
					answer: v.answer,
					points: v.points
				});
			}
			// include WRAG answers
			if (v.points > 0 && v.points !== 16) {
				WRAGAnswers.push({
					question: v.question,
					answer: v.answer,
					points: v.points
				});					
			}
		});
	});

	// set these to be accessible by template
	db.set('ass.supportAnswers', supportAnswers);
	db.set('ass.WRAGAnswers', WRAGAnswers);

}

function checkReminders(context) {

	$('.things-to-remember [type="checkbox"]', '#' + context).each(function() {

		var slug = $(this).attr('data-tip-id');

		var reminders = db.get('ass.reminders');

		// find if the reminder has already been set
		// ie. exists in the reminders db property
		if (_.find(reminders, function(reminder) { return reminder.slug === slug; })) {

			// IF SO, CHECK THE CORRESPONDING CHECKBOX
			$(this).attr('checked', 'checked');

		}

	});

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

Handlebars.registerHelper('qualifyHigh', function() {
	if (db.get('ass.high') && !db.get('ass.low')) {
		return '<p>You may qualify for the highest allowance, placing you in what&#x2019;s called the Support Group. Remember to show your assessor the questions marked <span class="warn">VERY IMPORTANT</span> (below) by printing this page or opening it on your phone. These are the questions that indicate you qualify.</p>';
	}
});

Handlebars.registerHelper('qualifyLow', function() {
	if (!db.get('ass.high') && db.get('ass.low')) {
		return '<p>You may qualify for the standard ESA allowance, placing you in what&#x2019;s called the Work Related Activity Group. Remember to show your assessor the questions marked <span class="warn amber">IMPORTANT</span> (below) by printing this page or opening it on your phone. These are the questions that indicate you qualify.</p>';
	}
});

Handlebars.registerHelper('qualifyEither', function() {
	if (db.get('ass.high') && db.get('ass.low')) {
		return '<p>It looks like you&#x2019;ll qualify for the standard allowance (placing you in what&#x2019;s called the Work Related Activity Group) or possibly the higher allowance (Support Group). Remember to show your assessor the <strong>Important Questions</strong> (below) by printing this page or opening it on your phone. These are the questions that indicate you qualify.</p>';
	}
});

Handlebars.registerHelper('qualifyNone', function() {
	if (!db.get('ass.high') && !db.get('ass.low')) {
		return "<p>It does not currently look like you will qualify for ESA.</p>";
	}
});

Handlebars.registerHelper('sluggify', function(words) {
	var slug = words
		.toLowerCase()
		.replace(/[^\w ]+/g,'')
		.replace(/ +/g,'-');
	return slug;
});

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

	console.log(db.get('ass.incomplete'));

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

$('body').on('click','[data-action="about-esa"]', function() {

	// load slide
	loadSlide('about-esa');

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
	var category = $(':checked', '#' + context).attr('name');
	var question = $('h2 em', '#' + context).text();
	var answer = $(':checked + span', '#' + context).text();


	if (isNumeric(points)) {

		// cast to real integer
		points = +points;

	}

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

	if (points === 16) {

		if (!db.get('ass.high')) {

			// record that the high qualification is true
			db.set('ass.high', true);

			// no need to add up, just tell the user
			loadSlide('qualify-high');

		}
		
	} else {

		// if it is an asterisk end question, make sure a score
		// of 15+ promotes the user's qualification to high
		if (points === '*') {

			db.set('ass.promote', true);

		}

		// fire the adding up function
		// to see if there are enough points to qualify
		qualify();

	}

});

$('body').on('click','[data-action="categories"]', function() { 

	loadSlide('categories');

});

$('body').on('change','.checklist [type="checkbox"]', function() {

	// get the id
	var slug = $(this).attr('id');

	var reminders = db.get('ass.reminders');

	var reminder = _.findWhere(reminders, {slug: slug});

	if ($(this).is(':checked')) {

		reminder.done = true;

	} else {

		reminder.done = false;

	}

	db.set('ass.reminders', reminders);

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

$(window).on('hashchange', function(e) {

	// add hash to history
	window.hashHistory.push(window.location.hash);

	console.log(hashHistory);

	if (window.location.hash.substr(0,9) === '#question') {
		if (hashHistory.indexOf(window.location.hash > -1)) {
			loadSlide(window.location.hash.substr(1));

			// TODO Need to remove this question from working data here

		}
	}

});