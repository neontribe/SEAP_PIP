/**********************************************************************
START UP
**********************************************************************/

// Define indexOf for array - ie8
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(val) {
    return jQuery.inArray(val, this);
  };
}

// define the database
var db = $.localStorage;

window.hashHistory = [];

if (db.isEmpty('pipAss')) {

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

// check if mobile device and if so closes all expanded lists
$(function() {
   var isMobile = window.matchMedia("only screen and (max-width: 800px)");

   if (isMobile.matches) {
       $("#about-PIP .expandies button").attr("aria-expanded", "false");
       $("#about-PIP .expandies h2").next().attr("aria-hidden", "true");
   }
});

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
    allCategories: _.uniq(_.without(window.allCategories, null)),
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
    incomplete: true // whether all the questions have been answered
  };

  // empty hash history
  window.hashHistory = [];

  // Save empty db object to local storage
  db.set('pipAss', assTemplate);

  // reset radio buttons
  $('[type="radio"]').prop('checked', false);

}

function getCatQuestions(slug) {

  if (slug === "random-category") {
    // Select a random category containing unseen questions
    var nextCat = _.sample(db.get('pipAss.remainingCategories'));
    db.set('pipAss.category', nextCat);
    loadSlide('chose-random-category');
    return;
  } else {
    db.set('pipAss.category', slug);
    getCatQuestionArr(slug);
    pickQuestion();
  }
}

function getCatQuestionArr(slug) {

  var questions = [],
    reducedToCat = _.where(window.allQuestions, {
      category: slug
    });

  $.each(reducedToCat, function(i, v) {
    questions.push(v.question);
  });

  db.set('pipAss.unseenQuestions', questions);
}

function loadSlide(id, type) {

  // Register google page view
  var trackHashes = ['main-menu', 'stats', 'data', 'about-PIP', 'start'];
  if ($.inArray(id, trackHashes) !== -1) {
    ga('send', 'pageview', '#' + id);
  }

  // Oops! we got here without an id to load - probably resuming user
  // session after data deleted. So no pipAss.whereIAm defined but computer
  // thinks user has been here before.
  if (!id || id === 'undefined') {
    loadSlide('main-menu');
  }

  if (id === 'stats') {

    // if you ran out of unseen questions and didn't skip any
    if (_.isEmpty(db.get('pipAss.unseenQuestions')) && _.isEmpty(db.get('pipAss.skippedQuestions')) && _.isEmpty(db.get('pipAss.remainingCategories')) && db.get('pipAss.started')) {
      db.set('pipAss.incomplete', false);
    }

    // compile the stats before showing slide
    compileStats();
  }

  if (id === 'categories') {
    compileCategories();
  }

  if (id === 'about-PIP') {
    compileAboutButtons();
  }

  if (id === 'category-finished') {
    $('#this-activity').text(db.get('pipAss.category').toLowerCase());
  }

  if (id === 'chose-random-category') {
    $('#chose-random-category button').attr('data-category', db.get('pipAss.category'));
    $('#chose-random-category #unseen-category').text(db.get('pipAss.category'));
  }

  $('.slide > *').removeClass('loaded');

  // set type in local storage or reset to null
  if (type) {
    db.set('pipAss.slideType', type);
  } else {
    db.set('pipAss.slideType', null);
  }

  // get rid of any previously invoked alerts
  $('[role="alert"]').empty();

  // go to slide
  window.location.hash = '#' + id;

  // focus title to announce title in AT
  $('#' + id)
    .find('[tabindex="-1"]')
    .focus();

  // find out if we've gone to one of the locations that don't need saving
  var exclude = _.find(['main-menu', 'stats', 'about-PIP', 'transcript', 'are-you-sure', 'deleted', 'resume', 'break-time'],
    function(unsaveable) {
      return unsaveable === id;
    });

  // If it's not an excluded location, save location
  if (!exclude) {

    // Record where the user is for resuming purposes
    db.set('pipAss.whereIAm', id);

  }

  // Only set context if we were not on a break from excluded (eg stats or about)
  var currentContext = db.get('pipAss.context') ? db.get('pipAss.context') : '';
  if (currentContext.indexOf('break-from-') === -1) {
    // Set context reference (jQuery object)
    db.set('pipAss.context', id);
  }

  // add the loaded class for transitions
  $('#' + id + ' > *').addClass('loaded');

}

// show a random unseen question
function pickQuestion() {

  // Check if points combo qualifies
  qualify(db.get('pipAss.submitPoints'));

  if (db.get('pipAss.show-qualify-low-mobility')) {
    loadSlide('qualify-low-mobility');
    db.set('pipAss.show-qualify-low-mobility', false);
    return;
  }

  if (db.get('pipAss.show-qualify-high-mobility')) {
    loadSlide('qualify-high-mobility');
    db.set('pipAss.show-qualify-high-mobility', false);
    return;
  }

  if (db.get('pipAss.show-qualify-low-dailyLiving')) {
    loadSlide('qualify-low-dailyLiving');
    db.set('pipAss.show-qualify-low-dailyLiving', false);
    return;
  }

  if (db.get('pipAss.show-qualify-high-dailyLiving')) {
    loadSlide('qualify-high-dailyLiving');
    db.set('pipAss.show-qualify-high-dailyLiving', false);
    return;
  }

  // We've started practicing
  db.set('pipAss.started', true);

  // the type of the previous slide if any
  var typeOfSlide = db.get('pipAss.slideType');
  // the last slide seen
  var context = db.get('pipAss.context');
  // get mode (unseen or skipped)
  var mode = db.get('pipAss.mode');

  if (typeOfSlide === 'question' && !window.answered && mode === 'unseenQuestions') {

    // put the unanswered question into the array of skipped questions
    var skipped = db.get('pipAss.skippedQuestions');
    skipped.push(db.get('pipAss.context'));
    db.set('pipAss.skippedQuestions', _.uniq(skipped));

  }

  // get the appropriate set
  var questions = db.get('pipAss.' + mode);

  if (db.get('pipAss.category')) {
    if (_.isEmpty(db.get('pipAss.unseenQuestions'))) {
      if (_.isEmpty(db.get('pipAss.remainingCategories'))) {

        db.set('pipAss.category', null);

        if (_.isEmpty(db.get('pipAss.skippedQuestions'))) {
          loadSlide('seen-all-even-skipped');
          db.set('pipAss.incomplete', false);
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
    if (mode === 'unseenQuesitons' && _.isEmpty(db.get('pipAss.unseenQuestions')) && _.isEmpty(db.get('pipAss.skippedQuestions'))) {
      loadSlide('seen-all-even-skipped');
      return;
    }
    if (mode === 'unseenQuestions' && _.isEmpty(db.get('pipAss.unseenQuestions'))) {
      loadSlide('seen-all');
      return;
    }
    if (mode === 'skippedQuestions' && _.isEmpty(db.get('pipAss.skippedQuestions'))) {
      loadSlide('seen-all-even-skipped');
      db.set('pipAss.incomplete', false);
      return;
    }
  }

  // init individual question var
  var question;

  if (mode === 'unseenQuestions') {

    question = questions[0];

  // set collection with this question removed
  db.set('pipAss.' + mode, _.without(questions, question));

  } else {

    if (window.answered) {

      questions = _.without(questions, context);

      db.set('pipAss.' + mode, questions);

      question = questions[0];

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

      question = questions[0];

    }

  }

  // get seen questions array
  var seen = db.get('pipAss.seenQuestions');

  // add this new question
  seen.push(question);

  // Unique only - if we've seen before we don't need to list it again
  db.set('pipAss.seenQuestions', _.uniq(seen));

  // load question slide and set slide type global to 'question'
  loadSlide(question, 'question');

  // set to false until button pressed
  window.answered = false;

}

// clear data and go to start screen
function restart() {

  db.set('pipAss.unseenQuestions', []);
  db.set('pipAss.seenQuestions', []);
  db.set('pipAss.skippedQuestions', []);
  db.set('pipAss.started', false);
  db.set('pipAss.promote', false);
  db.set('pipAss.mode', 'unseenQuestions');
  //db.set('pipAss.incomplete', true);
  db.set('pipAss.category', null);
  db.set('pipAss.remainingCategories', _.uniq(window.allCategories));

  // go to start screen
  loadSlide('start');

}

// go to slide you were last at
function resume() {

  // get the stored slide id
  var whereIWas = db.get('pipAss.whereIAm') ? db.get('pipAss.whereIAm') : 'main-menu';

  // unless we are having a break from an excluded page - stats, about.
  // Don't save where I was as stats, so we remember practice place.
  if (db.get('pipAss.context').indexOf('break-from-') !== -1) {

    // this is the page we want to return to if we're on a break
    // from an excluded page
    var whereICameFrom = db.get('pipAss.context').replace('break-from-', '');

    // Reset to correct context for when we leave entry to break page
    db.set('pipAss.context', whereIWas);
    loadSlide(whereICameFrom);

  } else {

    loadSlide(whereIWas);
  }
}

function tally() {

  // get all the answers
  var answers = db.get('pipAss.answers');

  // init objects
  var ans = {};
  var addedup = {};

  // split into mobility and daily living
  ans.mobility = _.omit(answers, function(val, key) {
    return key.indexOf('Daily Living') !== -1;
  });
  ans.dailyLiving = _.omit(answers, function(val, key) {
    return key.indexOf('Mobility') !== -1;
  });

  // add up the highest values for each category
  // category and adding them together
  addedup.mobility = _.reduce(ans.mobility, function(memo, cat) {
    return memo + _.max(_.pluck(cat, 'points'));
  }, 0);

  addedup.dailyLiving = _.reduce(ans.dailyLiving, function(memo, cat) {
    return memo + _.max(_.pluck(cat, 'points'));
  }, 0);

  return addedup;
}

// add the high scores for each category together
// and notify user if they qualify
function qualify(points) {

  var total = tally();

  if (total.mobility >= 8) {

    //don't show the slide if you have already
    if (!db.get('pipAss.high-mobility') && !db.get('pipAss.low-mobility')) {

      db.set('pipAss.show-qualify-low-mobility', true);

    }

    // record that low qualification is possible
    db.set('pipAss.low-mobility', true);

  }

  if (total.mobility >= 15) {

    //don't show the slide if you have already
    if (!db.get('pipAss.high-mobility')) {

      db.set('pipAss.show-qualify-high-mobility', true);

    }

    // record that low qualification is possible
    db.set('pipAss.high-mobility', true);

  }

  if (total.dailyLiving >= 8) {

    //don't show the slide if you have already
    if (!db.get('pipAss.high-dailyLiving') && !db.get('pipAss.low-dailyLiving')) {

      db.set('pipAss.show-qualify-low-dailyLiving', true);

    }

    // record that low qualification is possible
    db.set('pipAss.low-dailyLiving', true);

  }

  if (total.dailyLiving >= 15) {

    //don't show the slide if you have already
    if (!db.get('pipAss.high-dailyLiving')) {

      db.set('pipAss.show-qualify-high-dailyLiving', true);

    }

    // record that low qualification is possible
    db.set('pipAss.high-dailyLiving', true);

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
    db.set('pipAss.high-mobility', false);
  }

  if (total.mobility < 8) {
    db.set('pipAss.low-mobility', false);
  }

  if (total.dailyLiving < 15) {
    db.set('pipAss.high-dailyLiving', false);
  }

  if (total.dailyLiving < 8) {
    db.set('pipAss.low-dailyLiving', false);
  }

  divideAnswers();

  // template up the stats with handlebars and
  // write to the stats container
  var template = Handlebars.compile(document.getElementById("stats-template").innerHTML);
  var pipAssData = db.get('pipAss');
  var output = template(pipAssData);
  $('#stats-content').html(output);

}

function compileAboutButtons() {
  var template = Handlebars.compile(document.getElementById("about-buttons-template").innerHTML);
  var pipAssData = db.get('pipAss');
  var output = template(pipAssData);
  $('.expandies.information .about-buttons-content').html(output);
  $('#transcript .about-buttons-content').html(output);
}

function compileCategories() {

  // template up the stats with handlebars and
  // write to the categories container
  var template = Handlebars.compile(document.getElementById("categories-template").innerHTML);
  var pipAssData = db.get('pipAss');
  var output = template(pipAssData);
  $('#categories-content').html(output);

  // set seen categories to disabled
  disabledCats();

}

// remove answers from category nesting for easy iteration
function divideAnswers() {

  var answers = db.get('pipAss.answers');

  var importantAnswers = [];
  var catAnswers;

  $.each(answers, function(key, value) {
    catAnswers = _.values(value);
    importantAnswers.push(_.max(catAnswers, function(answer) {
      return answer.points;
    }));
  });

  // get rid of zeros
  var removeZeros = _.reject(importantAnswers, function(ans) {
    return ans.points === 0;
  });

  // set these to be accessible by template
  db.set('pipAss.importantAnswers', removeZeros);

}

function disabledCats() {

  var remaining = db.get('pipAss.remainingCategories');

  $('.real-cat').each(function() {

    var button = $('button', this);

    button.attr('disabled', null);

    var catName = button.attr('data-category');

    if (!_.contains(remaining, catName)) {

      button.attr('disabled', 'disabled');

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

  var answers = db.get('pipAss.answers');

  var amount = 0;

  $.each(answers, function(key, value) {
    amount += _.size(value);
  });

  return amount;
});

Handlebars.registerHelper('accuracy', function(array) {

  var answers = db.get('pipAss.answers');

  var answered = 0;

  $.each(answers, function(key, value) {
    answered += _.size(value);
  });

  var accuracy = Math.round((answered / allQuestions.length) * 100) + "%";

  return accuracy;
});

Handlebars.registerHelper('qualifyMobility', function() {

  var high = db.get('pipAss.high-mobility');
  var low = db.get('pipAss.low-mobility');

  if (high) {
    return "<p>It looks like you&#x2019;ll qualify for the high PIP rate for <strong>Mobility</strong>. Remember to show your assessor the <strong>important answers</strong> listed below.</p>";
  } else if (low) {
    return "<p>It looks like you&#x2019;ll qualify for the standard PIP rate for <strong>Mobility</strong>. Remember to show your assessor the <strong>important answers</strong> listed below.</p>";
  } else {
    return "<p>Based on the questions you've answered, so far you don't have enough points to qualify for the <strong>Mobility</strong> element of PIP.</p>";
  }

});

Handlebars.registerHelper('qualifyDailyLiving', function() {

  var high = db.get('pipAss.high-dailyLiving');
  var low = db.get('pipAss.low-dailyLiving');
  if (high) {
    return "<p>It looks like you&#x2019;ll qualify for the high PIP rate for <strong>Daily Living</strong>. Remember to show your assessor the <strong>important answers</strong> listed below.</p>";
  } else if (low) {
    return "<p>It looks like you&#x2019;ll qualify for the standard PIP rate for <strong>Daily Living</strong>. Remember to show your assessor the <strong>important answers</strong> listed below.</p>";
  } else {
    return "<p>From the questions you've answered, so far you would not have enough points to qualify for the <strong>Daily Living</strong> element of PIP.</p>";
  }

});

Handlebars.registerHelper('sluggify', function(words) {
  var slug = words
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
  return slug;
});

Handlebars.registerHelper('deprefix', function(cat) {
  if (cat) {
    var reduced = cat.split(':')[1];
    var trimmed = reduced.substr(1);
    return trimmed;
  }
});

function sluggify(string) {

  return string
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');

}

/**********************************************************************
EVENTS
**********************************************************************/

// click to see a random question
$('body').on('click', '[data-action="pick"]', function() {

  // run pickQuestion function to get an unseen question
  pickQuestion();

});

// click to see a question
$('body').on('click', '[data-action="skipped"]', function() {

  // the first skipped question cannot have been answered
  window.answered = false;

  // set mode to skipped questions
  db.set('pipAss.mode', 'skippedQuestions');

  // pick a question
  pickQuestion();

});

// restart the questions part but keep the data
$('body').on('click', '[data-action="restart"]', function() {

  // run restart function defined in FUNCTIONS block
  restart();

});

// restart the app
$('body').on('click', '[data-action="start-or-resume"]', function() {

  // has the user (or _a_ user) been to the questions section before?
  if (db.get('pipAss.started')) {
    resume();

  } else {

    loadSlide('start');

  }

});

$('body').on('click', '[data-action="break"]', function() {
  // If we are on one of these pages when we take a break, save our place.
  var validBreakReturn = ['stats', 'about-PIP', 'transcript'];
      currentContext = db.get('pipAss.context');

  // If we are taking a break from excluded page but want to save our place
  if (_.contains(validBreakReturn, db.get('pipAss.context'))) {
    db.set('pipAss.context', 'break-from-' + currentContext);
  }
  loadSlide('break-time');

});

$('.expandies').on('click', '[aria-controls]', function() {

  var expanded = $(this).attr('aria-expanded');

  var controlled = $('#' + $(this).attr('aria-controls'));

  if (expanded === 'false') {

    $(this).attr('aria-expanded', 'true');

    controlled.attr('aria-hidden', 'false');

  } else {

    $(this).attr('aria-expanded', 'false');

    controlled.attr('aria-hidden', 'true');

  }

});

$('body').on('click', '[data-action="resume"]', function() {

  // run resume function defined in FUNCTIONS block
  resume();

});

$('body').on('click', '[data-action="menu"]', function() {

  loadSlide('main-menu');

});

$('body').on('click', '[data-action="remember"]', function() {

  loadSlide('remember');

});

$('body').on('click', '[data-action="clean-up"]', function() {

  // set answered global to false
  window.answered = false;

  // initialize database
  initAss();

  // load the intro slide
  loadSlide('main-menu');

});

$('body').on('click', '[data-action="delete-are-you-sure"]', function() {

  // load the deleted data slide
  loadSlide('are-you-sure');

});

$('body').on('click', '[data-action="delete-data"]', function() {

  // set answered global to false
  window.answered = false;

  // initialize database
  initAss();

  // load the deleted data slide
  loadSlide('deleted');

});


$('body').on('click', '[data-action="stats"]', function() {

  // load the stats slide
  loadSlide('stats');

});

$('body').on('click', '[data-action="about-PIP"]', function() {

  // load slide
  loadSlide('about-PIP');

});

$('body').on('click', '[data-action="transcript"]', function() {

  // load slide
  loadSlide('transcript');

});

$('body').on('change', '[data-action="save-basic-info"]', function() {

  db.set('pipAss.' + $(this).attr('id'), $(this).val());

});

$('body').on('change', '[type="radio"]', function() {

  //add highlight class to pick button
  $('.loaded button.nav-link[data-action="pick"]').addClass( 'highlighted' );

  // record that change has been made
  window.answered = true;

  db.set('pipAss.answeredOne', true);

  // get checked answer's value and the category the question belongs to
  var context = db.get('pipAss.context');
  var points = $(':checked', '#' + context).val();
  var category = $(':checked', '#' + context).attr('data-category-name');
  var question = $('h2 em', '#' + context).text();
  var answer = $(':checked + span', '#' + context).text();

  // Remove from skipped questions if present
  db.set('pipAss.skippedQuestions', _.without(db.get('pipAss.skippedQuestions'), context));

  if (!isNumeric(points)) {

    // turn the followup question into a slug
    var followupSlug = 'question-' + sluggify(points);

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
    if (!db.isSet('pipAss.answers.' + category)) {
      db.set('pipAss.answers.' + category, category);
    }

    // set the new points for this question in this category
    db.set('pipAss.answers.' + category + '.' + context, answerObject);
    db.set('pipAss.submitPoints', points);

  }

  if ($(':checked', '#' + context).next().text() === 'Sometimes') {
    $('[role="alert"]', '#' + context)
      .append('<p><strong>If this can\'t be done safely, reliably or repeatedly within a short time, please consider changing your answer.</strong></p>');
  }
  if ($(':checked', '#' + context).next().text() !== 'Sometimes') {
    $('[role="alert"] p', '#' + context).remove();
  }

});

$('body').on('click', '[data-action="categories"]', function() {

  loadSlide('categories');

});

// Change your answer
$('body').on('click', '[data-action="change"]', function() {

  // get question slug
  var slug = $(this).attr('data-question');

  // just show the question slide
  loadSlide(slug, 'question');

});

$('body').on('click', '[data-action="set-cat"]', function() {

  var slug = $(this).attr('data-category');

  var reduced = _.without(db.get('pipAss.remainingCategories'), slug);

  db.set('pipAss.remainingCategories', reduced);

  getCatQuestions(slug);

});

// Fix back button
$(window).on('hashchange', function(e) {
  // If we've gone to a question fragment but we haven't
  // pressed a "pick a question" button to get there...
  // the override only happens if we've been here before as recorded
  // by the window.hasHistory array
  if (window.location.hash.substr(0, 9) === '#question' ) {
    if (window.hashHistory.indexOf(window.location.hash) > -1) {
      loadSlide(window.location.hash.substr(1), 'question');
    }
  }
  window.hashHistory.push(window.location.hash);
  _.uniq(window.hashHistory);
});
