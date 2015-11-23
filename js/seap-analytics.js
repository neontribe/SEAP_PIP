// Which c-app site are we?
var siteTitle = $(document).find("title").text();
    site = 'c-app';
    if (siteTitle === 'ESA Assessment Support') {
      site = 'esa';
    }
    if (siteTitle === 'PIP Assessment Support') {
      site = 'pip';
    }

var siteAss = site + 'Ass';

// Track all slides as pageviews
$(window).on('hashchange', function(e) {
  // @todo add list of # not to track. For now let's call every change a page.
  var page = window.location.hash;
  ga('send', 'pageview', page);
});

// Event on every a click
$('body').on('click', 'a', function(e) {
  var page = '';
      linkText = $(this).text();
  // Attempt to get the page we came from in the hashHistory.
  // If that fails, call it unknown.
  page = _.last(window.hashHistory);
  if (!page) {
    page = 'unknown';
  }
  ga('send', 'event', page, 'a-link-click', linkText, null);
});

// Event on every button click
$('body').on('click', 'button', function(e) {
  var page = '';
      linkText = $(this).text();
  // Attempt to get the page we came from in the hashHistory.
  // If that fails, call it unknown.
  page = _.last(window.hashHistory);
  if (!page) {
    page = 'unknown';
  }
  ga('send', 'event', page, 'button-click', linkText, null);
});

// Event on visit to stats page
$('#stats-content').on('stats-analytic-event', function(e) {
  var numAll = window.allQuestions.length;
      numSeen = db.get(siteAss).seenQuestions.length;
      numSkipped = db.get(siteAss).skippedQuestions.length;
      answers = db.get(siteAss).answers;
      numAnswered = 0;

  $.each(answers, function(key, value) {
    numAnswered += _.size(value);
  });

  // Percentage of questions seen and skipped.
  var percentSkipped = (numSkipped/numSeen).toFixed(2);
  ga('send', 'event', '#stats', 'question-progress', 'percent skipped', percentSkipped);

  // Percentage of all questions answered (including ones not yet seen).
  var percentAnswered = (numAnswered/numAll).toFixed(2);
  ga('send', 'event', '#stats', 'question-progress', 'percent answered', percentAnswered);

});

//Event on seen all and click stats
$('#seen-all').on('click', '[data-action="stats"]', function() {
  var numAll = window.allQuestions.length;
      numAnswered = 0;
      answers = db.get(siteAss).answers;

  $.each(answers, function(key, value) {
    numAnswered += _.size(value);
  });
  var percentAnswered = (numAnswered/numAll).toFixed(2);
  ga('send', 'event', '#seen-all', 'more-prepared:stats-button-click', 'percent answered', percentAnswered);
});
