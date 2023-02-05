const nav = document.getElementsByTagName("nav")[0];
const navLinksContainer = document.querySelector(
  ".nav-links-container"
) as HTMLElement;

const navLinks = nav.getElementsByClassName("nav-links")[0] as HTMLElement;
navLinks.addEventListener("mouseenter", triggerMoreArrow);

const mobileMenuToggler = nav.querySelector(
  ".mobile-nav-links-toggler"
) as HTMLElement;
mobileMenuToggler.addEventListener("click", handleMenuToggler);

const mobileMenu = nav.querySelector(".mobile-nav-links-menu") as HTMLElement;
const closeMenu = mobileMenu.querySelector(".close-menu") as HTMLButtonElement;
const menuArticleLinks = mobileMenu.querySelector(
  ".article-links"
) as HTMLElement;
closeMenu.addEventListener("click", handleMenuToggler);

const articleLinks = Array.from(navLinks.getElementsByTagName("a"));
articleLinks.forEach((a) => menuArticleLinks.appendChild(a.cloneNode(true)));

const upArrow = "⬆";
const downArrow = "⬇";

let topIntersecting = false;
let bottomIntersecting = false;

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.target === articleLinks[0]) {
      if (entry.isIntersecting) {
        console.log("Top is intersecting");
        topIntersecting = true;
        navLinksContainer.dataset.arrow = downArrow;
      } else {
        topIntersecting = false;
      }
    } else if (entry.target === articleLinks[articleLinks.length - 1]) {
      if (entry.isIntersecting) {
        console.log("Bottom is intersecting");
        bottomIntersecting = true;
        navLinksContainer.dataset.arrow = upArrow;
      } else {
        bottomIntersecting = false;
      }
    }
  });
  if (!topIntersecting && !bottomIntersecting) {
    navLinksContainer.dataset.arrow = `${upArrow} ${downArrow}`;
  }
  console.log("Stats", { top: topIntersecting, bottom: bottomIntersecting });
});

if (window.self === window.top) {
  const backToSite = document.createElement("a");
  backToSite.href = `http://127.0.0.1:5500`;
  backToSite.id = "back-to-site";
  backToSite.innerText = "Back to site generator";
  const basicLinks = nav.getElementsByClassName("basic-links")[0]
  basicLinks.insertBefore(backToSite, basicLinks.firstChild)
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
    setTimeout(
      () => {
        nav.classList.remove("mouse-over");
      },
      1000
    );
  }
}

function handleMenuToggler() {
  mobileMenu.classList.toggle("open");
}
