(function() {
  var activitySelect, answerQuestion, clearAndGetCategories, clearData, getCategorySectionSelector, numOfCats, numOfTests, startHash, url;

  url = 'http://localhost:9001/build';

  startHash = 'start-or-resume';

  getCategorySectionSelector = function(activityName) {
    return '.loaded#categories-content button[data-category="' + activityName + '"]';
  };

  clearData = function(test) {
    casper.click('a[data-action="your-assessment"]');
    casper.thenClick('button[data-action="delete-data"]');
    casper.then(function() {
      return test.assertExists('#deleted .loaded', 'Deleted message loaded');
    });
    casper.thenClick('button[data-action="menu"]');
    return true;
  };

  clearAndGetCategories = function(test) {
    clearData(test);
    casper.thenClick('button[data-action="' + startHash + '"]');
    test.comment(casper.getCurrentUrl());
    casper.then(function(data) {
      data['answered'] = {};
      return test.assertUrlMatch(url + '/#activities', 'Button press Navigated to ' + this.getCurrentUrl());
    });
    return casper.then(function(data) {
      test.assertExists('.loaded#categories-content', 'Found categories content');
      return true;
    });
  };

  activitySelect = function(test, activityName) {
    var activitySelector;
    activitySelector = getCategorySectionSelector(activityName);
    test.assertExists(activitySelector, 'Found "' + activityName + '" button.');
    casper.click(activitySelector);
    return true;
  };

  answerQuestion = function(value) {
    var hasValue;
    hasValue = false;
    hasValue = casper.exists('.question-container.loaded input[value="' + value + '"]');
    if (hasValue) {
      casper.click('.question-container.loaded input[value="' + value + '"]');
    }
    return hasValue;
  };

  numOfCats = 12;

  numOfTests = numOfCats * 3 + 2;

  casper.test.begin('Answer all questions every category', numOfTests, function(test) {
    return casper.start(url, function() {
      return clearAndGetCategories(test);
    }).then(function(data) {
      var activityName, allCategories, isNext, j, len, match, question, results;
      allCategories = this.getElementsAttribute('#categories-content li button', 'data-category');
      results = [];
      for (j = 0, len = allCategories.length; j < len; j++) {
        activityName = allCategories[j];
        if (activityName !== 'random-category') {
          activitySelect(test, activityName);
          isNext = this.exists('.question-container.loaded button[data-action="pick"]');
          while (isNext) {
            question = this.fetchText('.question-container.loaded h2 em');
            if (answerQuestion(0)) {
              data['answered'][question] = 0;
            }
            this.click('.question-container.loaded button[data-action="pick"]');
            isNext = this.exists('.question-container.loaded');
            if (!isNext) {
              break;
            }
          }
          match = this.getCurrentUrl().indexOf('seen-all-even-skipped');
          if (match > 0) {
            test.comment(this.getCurrentUrl());
            results.push(test.assertSelectorHasText('.box.loaded h1', 'Questions completed!', 'Landed on the answered all questions page'));
          } else {
            test.assertUrlMatch(url + '/#activity-finished', 'Landed on category finished page');
            test.assertSelectorHasText('.box.loaded p strong', activityName.toLowerCase(), 'Category name matches "' + activityName + '"');
            results.push(this.click('#activity-finished button[data-action="activities"]'));
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    }).run(function() {
      return test.done();
    });
  });

  casper.test.begin('Qualify high/ low with both, neither, either', 12, function(test) {
    return casper.start(url, function() {
      return clearAndGetCategories(test);
    }).then(function(data) {
      var answer, answers, cat, i, importantAnswers, j, k, l, len, m, match, numQuestions, questions, questionsObj, ref, ref1, ref2;
      cat = 'Daily Living: Preparing food';
      activitySelect(test, cat);
      answers = this.getElementsInfo('input[data-category-name="' + cat + '"]');
      questionsObj = {};
      for (j = 0, len = answers.length; j < len; j++) {
        answer = answers[j];
        questionsObj[answer.attributes.name] = 1;
      }
      numQuestions = Object.keys(questionsObj).length;
      for (i = k = 1, ref = numQuestions; k <= ref; i = k += 1) {
        if (!answerQuestion(8)) {
          this.click('.question-container.loaded button[data-action="pick"]');
        }
      }
      this.click('.question-container.loaded button[data-action="pick"]');
      match = this.getCurrentUrl().indexOf('qualify-standard-dailyLiving');
      test.assert(match > 0, 'Qualify Low with 8 points from ' + cat);
      this.click('.box.loaded button[data-action="pick"]');
      this.click('.box.loaded button[data-action="activities"]');
      cat = 'Mobility: Planning a journey';
      activitySelect(test, cat);
      questions = this.getElementsInfo('input[data-category-name="' + cat + '"]');
      numQuestions = questions.length;
      this.echo(numQuestions);
      for (i = l = 1, ref1 = numQuestions; l <= ref1; i = l += 1) {
        if (!answerQuestion(10)) {
          this.click('.question-container.loaded button[data-action="pick"]');
        }
      }
      this.click('.question-container.loaded button[data-action="pick"]');
      match = this.getCurrentUrl().indexOf('qualify-standard-mobility');
      test.assert(match > 0, 'Qualify Low with 10 points from ' + cat);
      this.click('.box.loaded button[data-action="your-assessment"]');
      importantAnswers = this.getElementsInfo('ul.q-and-a li').length;
      test.assertEquals(importantAnswers, 2, 'Found 2 important answers');
      this.click('.stats-container.loaded button[data-action="start-or-resume"]');
      this.click('.box.loaded button[data-action="pick"]');
      this.click('.question-container.loaded button[data-action="pick"]');
      this.click('.question-container.loaded button[data-action="pick"]');
      this.echo(this.getCurrentUrl());
      this.click('.box.loaded button[data-action="activities"]');
      cat = 'Daily Living: Washing and bathing';
      activitySelect(test, cat);
      questions = this.getElementsInfo('input[data-category-name="' + cat + '"]');
      numQuestions = questions.length;
      for (i = m = 1, ref2 = numQuestions; m <= ref2; i = m += 1) {
        if (!answerQuestion(4)) {
          this.click('.question-container.loaded button[data-action="pick"]');
        }
      }
      this.click('.question-container.loaded button[data-action="pick"]');
      match = this.getCurrentUrl().indexOf('qualify-enhanced-dailyLiving');
      test.assert(match > 0, 'Qualify High with 12 points from Daily Living');
      test.assert(true);
      return test.assert(true);
    }).run(function() {
      return test.done();
    });
  });

}).call(this);
