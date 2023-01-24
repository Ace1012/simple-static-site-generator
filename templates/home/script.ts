const nav = document.getElementsByTagName("nav")[0];

if (window.self === window.top) {
  const backToSite = document.createElement("a");
  backToSite.href = "../../../index.html";
  backToSite.innerHTML = "Back to site generator";
  document.body.insertBefore(backToSite, nav);
}
