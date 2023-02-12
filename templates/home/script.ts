const nav = document.getElementsByTagName("nav")[0];

const sideMenuToggler = nav.querySelector(".side-menu-toggler") as HTMLElement;
sideMenuToggler.addEventListener("click", handleMenuToggler);

const sideMenu = document.querySelector(".side-menu") as HTMLElement;
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

function handleMenuToggler() {
  sideMenu.classList.toggle("open");
}
