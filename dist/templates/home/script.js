const nav = document.getElementsByTagName("nav")[0];
const navLinksContainer = document.querySelector(".nav-links-container");
const navLinks = nav.getElementsByClassName("nav-links")[0];
navLinks.addEventListener("mouseenter", triggerMoreArrow);
const mobileMenuToggler = nav.querySelector(".mobile-nav-links-toggler");
mobileMenuToggler.addEventListener("click", handleMenuToggler);
const mobileMenu = nav.querySelector(".mobile-nav-links-menu");
const closeMenu = mobileMenu.querySelector(".close-menu");
const menuArticleLinks = mobileMenu.querySelector(".article-links");
closeMenu.addEventListener("click", handleMenuToggler);
const articleLinks = Array.from(navLinks.getElementsByTagName("a"));
articleLinks.forEach((a) => menuArticleLinks.appendChild(a.cloneNode(true)));
const upArrow = "⬆";
const downArrow = "⬇";
let initialObserverCall = true;
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.target === articleLinks[0]) {
            if (entry.isIntersecting) {
                navLinksContainer.dataset.arrow = downArrow;
            }
            else {
                if (!initialObserverCall) {
                    navLinksContainer.dataset.arrow = `${upArrow} ${downArrow}`;
                }
            }
        }
        else if (entry.target === articleLinks[articleLinks.length - 1]) {
            if (entry.isIntersecting) {
                navLinksContainer.dataset.arrow = upArrow;
            }
            else {
                if (!initialObserverCall) {
                    navLinksContainer.dataset.arrow = `${upArrow} ${downArrow}`;
                }
            }
        }
    });
    initialObserverCall = false;
});
if (window.self === window.top) {
    const backToSite = document.createElement("a");
    backToSite.href = `https://sssg-rapando.onrender.com`;
    backToSite.id = "back-to-site";
    backToSite.innerText = "Back to Site Generator";
    const basicLinks = nav.getElementsByClassName("basic-links")[0];
    basicLinks.insertBefore(backToSite, basicLinks.firstChild);
    // document.body.insertBefore(backToSite, nav);
}
if (articleLinks.length > 3) {
    articleLinks.forEach((a, index, arr) => {
        if (index === 0) {
            observer.observe(a);
        }
        if (index === arr.length - 1) {
            observer.observe(a);
        }
    });
}
function triggerMoreArrow() {
    if (articleLinks.length > 3) {
        nav.classList.add("mouse-over");
        setTimeout(() => {
            nav.classList.remove("mouse-over");
        }, 1000);
    }
}
function handleMenuToggler() {
    mobileMenu.classList.toggle("open");
}
export {};
//# sourceMappingURL=script.js.map