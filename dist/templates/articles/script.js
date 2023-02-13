const nav = document.getElementsByTagName("nav")[0];
const pathname = window.location.pathname
    .split("/")
    .pop()
    .split(".")[0]
    .toLowerCase()
    .replace(/%20/g, "");
const sideMenuToggler = nav.querySelector(".side-menu-toggler");
sideMenuToggler.addEventListener("click", handleMenuToggler);
const sideMenu = nav.querySelector(".side-menu");
const sideMenuLinks = sideMenu.querySelector(".article-links");
const closeMenu = sideMenu.querySelector(".close-menu");
closeMenu.addEventListener("click", handleMenuToggler);
const downloadButton = document.getElementsByClassName("download-link")[0];
downloadButton.addEventListener("click", () => {
    alert("To adapt the downloaded site to suit your needs, simply change the url in the base tag of the home.html file.");
});
if (window.self === window.top) {
    const backToSite = document.createElement("a");
    backToSite.href = `https://sssg-rapando.onrender.com`;
    backToSite.id = "back-to-site";
    backToSite.innerText = "Back to Site Generator";
    const basicLinks = nav.getElementsByClassName("basic-links")[0];
    basicLinks.insertBefore(backToSite, basicLinks.firstElementChild);
}
highlightLink(Array.from(sideMenuLinks.getElementsByTagName("a")));
//Highlight current link
function highlightLink(links) {
    const currentArticleLink = Array.from(links).find((a) => {
        const name = a.innerHTML.replace(/\s+/g, "").toLowerCase();
        return name === pathname;
    });
    if (currentArticleLink) {
        currentArticleLink.id = "current-article-link";
        currentArticleLink.focus();
    }
}
function handleMenuToggler() {
    sideMenu.classList.toggle("open");
}
export {};
//# sourceMappingURL=script.js.map