var url = 'http://localhost:9001/build';
var hash = 'about-pip';

casper.test.begin('PIP Guide', 1, function suite(test) {
  // Start at home, click about esa button
  casper.start(url, function() {
    this.click('button[data-action="' + hash + '"]');
    test.comment(this.getCurrentUrl());
  });
  casper.then(function() {
    // Correct url appears
    test.assertUrlMatch(url+'/#' + hash, 'Button press Navigated to ' + this.getCurrentUrl());
    // child of div#about-esa is div.loaded
  });
  casper.run(function() {
    test.done();
  });
});
