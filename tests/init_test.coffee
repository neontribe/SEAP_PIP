# Check site is serving
# Check title is My PIP Assessment
# Check count 3 menu links in main nav (Main Menu, my assessment, my data)
# Make sure we aren't on resume screen, then
# Check count 3 option buttons - (guide, practise, my assessment)

url = 'http://localhost:9001/build'

casper.test.begin 'Title page', 4, (test)->
  casper
    .start url, ->
      test.comment @getCurrentUrl()
      test.assertHttpStatus 200, 'SEAP PIP is up'
      test.assertTitle 'My PIP Assessment', 'PIP page title is the one expected'
      # 3 Menu links in header
      test.assertElementCount 'header nav li a', 3, '3 header menu links'
      # make sure we aren't on the resume message
      if @getCurrentUrl().search 'resume' != -1 then
      @click 'a[data-action="menu"]'
    .then ->
      # 3 buttons
      test.assertElementCount '.flow.loaded button', 3, '3 buttons in view'
    .run ->
      test.done()
