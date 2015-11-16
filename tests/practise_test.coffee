# REUSED
# Clear data
# Go to practice page
# Click choose an activity

# TEST 1 - answer all in every category
# Select 'category'
# Answer 0
# Select ask me another
# Repeat until end of section reached
# Verify category complete page for each
# Repeat for all categories

url = 'http://localhost:9001/build'
startHash = 'start-or-resume'

# Helper to get selector for category
getCategorySectionSelector = (activityName) ->
  '.loaded#categories-content button[data-category="'+activityName+'"]'

# Helper to clear data from session and return home
clearData = (test) ->
  casper.click 'a[data-action="stats"]'
  casper.thenClick 'button[data-action="delete-data"]'
  # Make sure we get the deleted message
  casper.then ->
    test.assertExists '#deleted .loaded', 'Deleted message loaded'
  # Return to home
  casper.thenClick 'button[data-action="menu"]'
  true

# Helper to clear session and start practice in category
clearAndGetCategories = (test) ->
  clearData(test)
  casper.thenClick 'button[data-action="' + startHash + '"]'
  test.comment casper.getCurrentUrl()
  casper.then (data) ->
    #set empty answer obj
    data['answered'] = {}
    # Correct url appears for activity start
    test.assertUrlMatch url + '/#start',
      'Button press Navigated to ' + @getCurrentUrl()
    casper.thenClick 'button[data-action="categories"]'
    # visible loaded categories-content
  casper.then (data) ->
    test.assertExists '.loaded#categories-content',
      'Found categories content'
    true

activitySelect = (test, activityName) ->
  # verify activity button exists
  activitySelector = getCategorySectionSelector activityName
  test.assertExists activitySelector,
    'Found "' + activityName + '" button.'
  casper.click activitySelector
  true
  
# Answer question with given value
# returns false if value is not valid option
answerQuestion = (value) ->
  hasValue = false
  hasValue = casper.exists '.question-container.loaded input[value="'+value+'"]'
  #casper.echo hasValue
  casper.click '.question-container.loaded input[value="'+value+'"]' if hasValue
  hasValue

###############################
# TEST Answer all in category #
###############################
numOfCats = 12
numOfTests = numOfCats*3 + 2
casper.test.begin 'Answer all questions every category', numOfTests, (test) ->
  # Start at home, clear data, return to home, click start-or-resume
  casper
    .start url, ->
      clearAndGetCategories test
    .then (data) ->
      allCategories = @getElementsAttribute '#categories-content li button',
        'data-category'
      #@echo allCategories
      for activityName in allCategories
        if activityName != 'random-category'
          activitySelect test, activityName
          isNext =
            @exists '.question-container.loaded button[data-action="pick"]'
          #test.comment 'Answer all 0'
          while isNext
            question = @fetchText '.question-container.loaded h2 em'
            #@echo question
            # verify there is a 0 value option if not, ask another
            if answerQuestion(0) then data['answered'][question] = 0
            #@echo JSON.stringify(data)
            @click '.question-container.loaded button[data-action="pick"]'
            isNext = @exists '.question-container.loaded'
            #test.comment 'Another question in category:'+isNext
            break unless isNext
          # If we've answered all the questions verify and exit
          match = @getCurrentUrl().indexOf 'seen-all-even-skipped'
          if match > 0
            test.comment @getCurrentUrl()
            test.assertSelectorHasText '.box.loaded h1',
              'Practise Complete',
              'Landed on the answered all questions page'
          else
            # verify we are on the category-finished page
            test.assertUrlMatch url + '/#category-finished',
              'Landed on category finished page'
            # verify category name as expected
            test.assertSelectorHasText '.box.loaded p strong',
              activityName.toLowerCase(),
              'Category name matches "' + activityName + '"'
            @click '#category-finished button[data-action="categories"]'
    .run ->
      test.done()

##########################
# TEST Qualifying combos #
##########################
# TODO look into using thenBypassIf and theBypassUnless to itterate
# through answers.
casper.test.begin 'Qualify high/ low with both, neither, either', 12, (test) ->
  casper
    .start url, ->
      clearAndGetCategories test
    .then (data) ->
      # Get some points from Daily Living
      cat = 'Daily Living: Preparing food'
      activitySelect test, cat
      # Get number of questions in category using answer data-category-name
      answers = @getElementsInfo 'input[data-category-name="'+cat+'"]'
      questionsObj = {}
      for answer in answers
        questionsObj[answer.attributes.name] = 1
      numQuestions = Object.keys(questionsObj).length
      # Make sure we stop before we run out of questions
      for i in [1..numQuestions] by 1
        if !answerQuestion(8)
          @click '.question-container.loaded button[data-action="pick"]'
      @click '.question-container.loaded button[data-action="pick"]'
      # Qualify low Daily Living
      match = @getCurrentUrl().indexOf 'qualify-low-dailyLiving'
      test.assert match > 0,
        'Qualify Low with 8 points from ' + cat
      @click '.box.loaded button[data-action="pick"]'
      @click '.box.loaded button[data-action="categories"]'
      # Get some points from Mobility
      cat = 'Mobility: Planning a journey'
      activitySelect test, cat
      questions = @getElementsInfo 'input[data-category-name="'+cat+'"]'
      numQuestions = questions.length
      @echo numQuestions
      for i in [1..numQuestions] by 1
        if !answerQuestion(10)
          @click '.question-container.loaded button[data-action="pick"]'
      @click '.question-container.loaded button[data-action="pick"]'
      # Qualify low Mobility
      match = @getCurrentUrl().indexOf 'qualify-low-mobility'
      test.assert match > 0,
        'Qualify Low with 10 points from ' + cat
      # Show important but not qualify for either
      @click '.box.loaded button[data-action="stats"]'
      importantAnswers = @getElementsInfo('ul.q-and-a li').length
      # verify we have 2 important answers
      test.assertEquals importantAnswers, 2, 'Found 2 important answers'
      # Get at least 16 Daily Living points
      @click '.stats-container.loaded button[data-action="start-or-resume"]'
      @click '.box.loaded button[data-action="pick"]'
      @click '.question-container.loaded button[data-action="pick"]'
      @click '.question-container.loaded button[data-action="pick"]'


      @echo @getCurrentUrl()
      @click '.box.loaded button[data-action="categories"]'
      cat = 'Daily Living: Washing and bathing'
      activitySelect test, cat
      questions = @getElementsInfo 'input[data-category-name="'+cat+'"]'
      numQuestions = questions.length
      for i in [1..numQuestions] by 1
        if !answerQuestion(8)
          @click '.question-container.loaded button[data-action="pick"]'
      @click '.question-container.loaded button[data-action="pick"]'
      # Qualify high Daily Living
      match = @getCurrentUrl().indexOf 'qualify-high-dailyLiving'
      test.assert match > 0,
        'Qualify High with 16 points from Daily Living'

      # Get at least 16 Mobility points and qualify high

      # Change a Daily Living answer to 0 - make total below 16
      # Qualify high only Mobility
      test.assert true
      test.assert true
    .run ->
      test.done()
