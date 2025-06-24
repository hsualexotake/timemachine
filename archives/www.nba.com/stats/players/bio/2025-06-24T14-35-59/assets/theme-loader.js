(function () { 
  var initial = (localStorage && localStorage.theme) || '';
  var regex = document.location.search.match(/data-theme=(dark|light)/);
  var theme = (regex) ? regex[1] : initial;
  document.documentElement.setAttribute("data-theme", theme);

  if (localStorage) {
    localStorage.theme = theme;
  }

})();
