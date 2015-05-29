var url = 'http://localhost:9001/build';
casper.test.begin('Title page', 3, function suite(test) {
    casper.start(url, function() {
      this.test.comment(this.getCurrentUrl());
      this.test.assertHttpStatus(200, 'SEAP is up');
      test.assertTitle("My PIP Assessment", "PIP page title is the one expected");
      test.assertExists('a[data-action="stats"]', "My assessment menu link found");
    });

    casper.run(function() {
        test.done();
    });
});
