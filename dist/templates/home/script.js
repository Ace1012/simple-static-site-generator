const nav = document.getElementsByTagName("nav")[0];
if (window.self === window.top) {
    const backToSite = document.createElement("a");
    backToSite.href = "../../../index.html";
    backToSite.innerHTML = "Back to site generator";
    backToSite.style.gridColumn = "1/-1";
    backToSite.style.width = "50%";
    document.body.insertBefore(backToSite, nav);
}
// export {};
//# sourceMappingURL=script.js.map