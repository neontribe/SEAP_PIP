(function() {
  var countOpen, countSuccess, guideSectionSelector, guideSections, hash, url;

  url = 'http://localhost:9001/build';

  hash = 'about-pip';

  guideSections = [];

  guideSectionSelector = '.flow.loaded .expandies h2 button';

  countSuccess = 0;

  countOpen = function(selector) {
      var openGuideSections, openSections, openSectionsFound;
      openSections = 0;
      openSectionsFound = casper.exists(selector + '[aria-expanded="true"]');
      openGuideSections = openSectionsFound ? casper.getElementsInfo(selector + '[aria-expanded="true"]') : void 0;
      if (openSectionsFound) {
            openSections = openGuideSections.length;
          }
      return openSections;
    };

  casper.test.begin('PIP Guide', 3, function(test) {
      return casper.start(url, function() {
            this.click('button[data-action="' + hash + '"]');
            return test.comment(this.getCurrentUrl());
          }).then(function(data) {
            var guideSection, i, len, nowOpen, openGuideSections;
            test.assertUrlMatch(url + '/#' + hash, 'Button press Navigated to ' + this.getCurrentUrl());
            test.assertExists(guideSectionSelector);
            guideSections = this.getElementsAttribute(guideSectionSelector, 'aria-controls');
            for (i = 0, len = guideSections.length; i < len; i++) {
                    guideSection = guideSections[i];
                    this.echo(guideSection);
                    data.startOpen = countOpen(guideSectionSelector);
                    test.comment(data.startOpen + ' Guide sections opened at start');
                    test.comment('Click ' + guideSection + ' to open');
                    this.click(guideSectionSelector + '[aria-controls="' + guideSection + '"]');
                    openGuideSections = countOpen(guideSectionSelector);
                    if (openGuideSections !== data.startOpen) {
                              countSuccess++;
                            }
                    test.comment('Click ' + guideSection + ' to close');
                    this.click(guideSectionSelector + '[aria-controls="' + guideSection + '"]');
                    nowOpen = countOpen(guideSectionSelector);
                    if (nowOpen === data.startOpen) {
                              countSuccess++;
                            }
                  }
            return test.assert(countSuccess / 2 === guideSections.length, guideSections.length + ' sections opened and closed.');
          }).run(function() {
                return test.done();
              });
    });

}).call(this);
