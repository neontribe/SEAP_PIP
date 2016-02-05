# Go to about page
# Check there are expandable divs containing h2 button
# Get ids for all the h2 buttons
# Check theat clicking h2 button unhides and expands
# Check that clicking h2 button with visable content hides and collapses
# Todo - check external links - make sure they open in new tab
# Todo - count elements
# Todo - check for practise and menu links at bottom
# Todo - check for pdf guide link

url = 'http://localhost:9001/build'
hash = 'about-pip'
guideSections = []
guideSectionSelector = '.flow.loaded .expandies h2 button'
countSuccess = 0

# Helper to count number of expanded sections of selector type
countOpen = (selector) ->
  openSections = 0
  # check if any sections are open and return count
  openSectionsFound =
    casper.exists selector + '[aria-expanded="true"]'
  openGuideSections =
    casper.getElementsInfo selector +
      '[aria-expanded="true"]' if openSectionsFound
  openSections = openGuideSections.length if openSectionsFound
  openSections

casper.test.begin 'PIP Guide', 3, (test) ->
  # Start at home, click about esa button
  casper
    .start url, ->
      @click 'button[data-action="' + hash + '"]'
      test.comment this.getCurrentUrl()
  
    .then (data) ->
    # Correct url appears
      test.assertUrlMatch url + '/#' + hash,
        'Button press Navigated to ' + @getCurrentUrl()
      # visible loaded content contains expandies
      test.assertExists guideSectionSelector
      guideSections = @getElementsAttribute(guideSectionSelector,
        'aria-controls')
      for guideSection in guideSections
        @echo guideSection
        # check if any sections are open and return count
        data.startOpen = countOpen guideSectionSelector
        test.comment data.startOpen + ' Guide sections opened at start'
        test.comment 'Click ' + guideSection + ' to open'
        @click guideSectionSelector + '[aria-controls="' + guideSection+'"]'
        # verify that a different number of sections are now open
        openGuideSections = countOpen guideSectionSelector
        countSuccess++ if openGuideSections != data.startOpen
        # click again to close
        test.comment 'Click ' + guideSection + ' to close'
        @click guideSectionSelector + '[aria-controls="' + guideSection+'"]'
        # check if any sections are open and return count
        nowOpen = countOpen guideSectionSelector
        countSuccess++ if nowOpen == data.startOpen

      test.assert countSuccess/2 == guideSections.length,
        guideSections.length + ' sections opened and closed.'
    .run ->
      test.done()
