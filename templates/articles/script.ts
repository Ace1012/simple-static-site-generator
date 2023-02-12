const nav = document.getElementsByTagName("nav")[0];

const pathname = window.location.pathname
  .split("/")
  .pop()
  .split(".")[0]
  .toLowerCase()
  .replace(/%20/g, "");

const sideMenuToggler = nav.querySelector(".side-menu-toggler") as HTMLElement;
sideMenuToggler.addEventListener("click", handleMenuToggler);

const sideMenu = nav.querySelector(".side-menu") as HTMLElement;
const sideMenuLinks = sideMenu.querySelector(".article-links") as HTMLElement;

const closeMenu = sideMenu.querySelector(".close-menu") as HTMLButtonElement;
closeMenu.addEventListener("click", handleMenuToggler);

const downloadButton = document.getElementsByClassName(
  "download-link"
)[0] as HTMLElement;

downloadButton.addEventListener("click", () => {
  alert(
    "To adapt the downloaded site to suit your needs, simply change the url in the base tag of the home.html file."
  );
});

if (window.self === window.top) {
  const backToSite = document.createElement("a");
  backToSite.href = `https://simple-static-site-generator.vercel.app`;
  backToSite.id = "back-to-site";
  backToSite.innerText = "Back to Site Generator";
  const basicLinks = nav.getElementsByClassName("basic-links")[0];
  basicLinks.insertBefore(backToSite, basicLinks.firstElementChild);
}

highlightLink(Array.from(sideMenuLinks.getElementsByTagName("a")));

//Highlight current link
function highlightLink(links: Element[]) {
  const currentArticleLink = Array.from(links).find((a) => {
    const name = a.innerHTML.replace(/\s+/g, "").toLowerCase();
    return name === pathname;
  }) as HTMLAnchorElement;

  if (currentArticleLink) {
    currentArticleLink.id = "current-article-link";
    currentArticleLink.focus();
  }
}

function handleMenuToggler() {
  sideMenu.classList.toggle("open");
}
