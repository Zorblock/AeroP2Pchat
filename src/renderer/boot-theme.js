(() => {
  const theme =
    new URLSearchParams(window.location.search).get("theme") === "dark"
      ? "dark"
      : "light";
  document.documentElement.dataset.theme = theme;
})();
