(function() {
  var config = %CONFIG%;
  if (config.username && config.password) {
    chrome.webRequest.onAuthRequired.addListener(
      function(details) {
        return { authCredentials: { username: config.username, password: config.password } };
      },
      { urls: ['<all_urls>'] },
      ['blocking']
    );
  }
})();
