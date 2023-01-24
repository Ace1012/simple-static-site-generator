const nav = document.getElementsByTagName("nav")[0];
const pathname = window.location.pathname.split("/").pop().split(".")[0].toLowerCase();
const currentArticleLink = Array.from(nav.getElementsByTagName("a")).find((a) => {
    const name = a.innerHTML.replace(/\s+/g, "").toLowerCase();
    console.log(`name: ${name}, \npathname: ${pathname}`)
    return name === pathname
  });
  
  if (currentArticleLink) {
    currentArticleLink.style.backgroundColor = "rosybrown";
    currentArticleLink.style.color = "white";
  }