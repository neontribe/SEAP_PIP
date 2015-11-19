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
