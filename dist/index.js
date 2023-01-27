let markdown = {
    home: undefined,
    about: undefined,
    articles: [],
    images: [],
};
const dragArea = document.querySelector(".dragArea");
const iframe = document.getElementsByTagName("iframe")[0];
iframe.style.border = "none";
const input = document.getElementById("file-input");
input.addEventListener("change", handleInputSelect);
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "drop") {
        console.log("Prevented drop defaults");
    }
}
function resetStyles() {
    dragArea.style.backgroundColor = "";
    dragArea.style.border = "";
}
function dragOver(e) {
    preventDefaults(e);
    // dragArea.style.backgroundColor = "green";
    dragArea.style.border = "5px dotted green";
}
function dragLeave(e) {
    preventDefaults(e);
    resetStyles();
}
async function handleInputSelect() {
    for (const file of this.files) {
        const path = file.webkitRelativePath;
        switch (true) {
            case path.includes(`markdown/articles`):
                populateMarkdown(file, true);
                break;
            case path.includes(`markdown/images`):
                populateMarkdown(file, null, true);
                break;
            default:
                populateMarkdown(file);
                break;
        }
    }
    uploadImages();
    sendFiles();
}
async function drop(e) {
    preventDefaults(e);
    parseFiles(e.dataTransfer.items);
    resetStyles();
}
async function parseFiles(files) {
    let markdownFiles = [];
    for (const file of files) {
        const mainDirectory = file.webkitGetAsEntry();
        markdownFiles = await getAllDirectoryEntries(mainDirectory);
    }
    for (const entry of markdownFiles) {
        await handleDroppedEntry(entry);
    }
    sendFiles();
}
async function sendFiles() {
    await fetch("http://localhost:3000/", {
        method: "POST",
        body: JSON.stringify({ markdown: markdown }),
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
        return res.json();
    })
        .then((data) => {
        console.log(data);
        if (data.parsingStatus === true) {
            addLinks();
        }
        markdown = {
            home: undefined,
            about: undefined,
            articles: [],
            images: [],
        };
    });
}
function addLinks() {
    iframe.src = "dist/templates/home/home.html";
    iframe.style.border = "";
    iframe.style.display = "block";
    dragArea.style.display = "none";
    document.body.appendChild(iframe);
    const homeLink = document.createElement("a");
    homeLink.innerHTML = "Visit site generated";
    homeLink.href = "./dist/templates/home/home.html";
    document.body.insertBefore(homeLink, iframe);
}
//Parse dropped directory into a markdown object
async function handleDroppedEntry(entry, article, image) {
    if (entry.isFile) {
        const file = await getFile(entry);
        switch (true) {
            case article:
                populateMarkdown(file, article);
                break;
            case image:
                populateMarkdown(file, null, image);
                break;
            default:
                populateMarkdown(file);
                break;
        }
    }
    else if (entry.isDirectory) {
        console.log("Directory name is: ", entry.name);
        if (entry.name.toLowerCase() === "articles") {
            const articles = await getAllDirectoryEntries(entry);
            for (const article of articles) {
                handleDroppedEntry(article, true);
            }
        }
        else if (entry.name.toLowerCase() === "images") {
            const images = await getAllDirectoryEntries(entry);
            for (const image of images) {
                await handleDroppedEntry(image, null, true);
            }
            uploadImages();
        }
    }
}
async function populateMarkdown(file, article, image) {
    let name = file.name.toLowerCase();
    const home = /home.md/i;
    const about = /about.md/i;
    switch (true) {
        case home.test(name):
            markdown.home = { name: file.name, content: await file.text() };
            break;
        case about.test(name):
            markdown.about = { name: file.name, content: await file.text() };
            break;
        case article:
            markdown.articles.push({ name: file.name, content: await file.text() });
            break;
        case image:
            markdown.images.push(file);
            break;
        default:
            alert("Check folder structure");
            break;
    }
}
async function uploadImages() {
    let imageFormData = new FormData();
    for (const image of markdown.images) {
        imageFormData.append("images", image);
    }
    await fetch("http://localhost:3000/images", {
        method: "POST",
        body: imageFormData,
    })
        .then((res) => {
        return res.json();
    })
        .then((data) => {
        console.log(data);
        if (data.imagesUploaded) {
            delete markdown.images;
        }
    });
}
function getAllDirectoryEntries(directory) {
    const reader = directory.createReader();
    let directories = readAllDirectoryEntries(reader);
    return directories;
}
function readAllDirectoryEntries(reader) {
    return new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
    });
}
function getFile(fileEntry) {
    try {
        return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
    }
    catch (err) {
        console.log(err);
    }
}
dragArea.addEventListener("dragover", dragOver);
dragArea.addEventListener("dragleave", dragLeave);
dragArea.addEventListener("drop", drop);
export {};
//# sourceMappingURL=index.js.map