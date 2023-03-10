//Regex of file paths
const homePathRegex = /^\/?([A-Za-z0-9\-_ ()]+)\/(home.md)$/i;
const aboutPathRegex = /^\/?([A-Za-z0-9\-_ ()]+)\/(about.md)$/i;
const articlesPathRegex = /^\/?([A-Za-z0-9\-_ ()]+)\/articles\/([A-Za-z0-9\-_ ()]+.md)$/i;
const imagesPathRegex = /^\/?([A-Za-z0-9\-_ ()]+)\/images\/([A-Za-z0-9\-_ ()]+.(jpg|jpeg|png|gif))$/i;
const dragArea = document.querySelector(".dragArea");
dragArea.addEventListener("dragover", dragOver);
dragArea.addEventListener("dragleave", dragLeave);
dragArea.addEventListener("drop", drop);
const folderStructure = document.getElementsByClassName("folder-structure")[0];
const revealFolderStructure = document.getElementsByClassName("reveal-folder-structure")[0];
revealFolderStructure.addEventListener("mouseenter", () => {
    folderStructure.focus();
});
revealFolderStructure.addEventListener("mouseleave", () => {
    folderStructure.blur();
});
const downloadButton = document.getElementsByClassName("download-link")[0];
downloadButton.addEventListener("click", () => {
    alert("To adapt the downloaded site to suit your needs, simply change the url in the base tag of the home.html file.");
});
const iframeContainer = document.getElementsByClassName("iframe-container")[0];
const iframe = document.getElementsByTagName("iframe")[0];
iframe.style.border = "none";
const input = document.getElementById("file-input");
input.addEventListener("change", handleInputSelect);
let markdown = {
    home: undefined,
    about: undefined,
    articles: [],
    images: [],
};
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "drop") {
        console.log("Prevented drop defaults");
    }
}
function resetStyles() {
    dragArea.style.boxShadow = "";
    dragArea.style.border = "";
}
function dragOver(e) {
    preventDefaults(e);
    dragArea.style.boxShadow = "0 0 2em teal";
    dragArea.style.border = "5px solid teal";
}
function dragLeave(e) {
    preventDefaults(e);
    resetStyles();
}
async function drop(e) {
    preventDefaults(e);
    parseDroppedFiles(e.dataTransfer.items);
    resetStyles();
}
/**
 * Display error message and reload page
 *
 * @param message
 */
async function errorDetected(message) {
    alert(message);
    window.location.reload();
}
/**
 * Parse webkitdirectory entries and populate the markdown object.
 *
 * @param this
 */
async function handleInputSelect() {
    let incorrectFiles = [];
    for (const file of this.files) {
        if (!checkFileValidity(file.webkitRelativePath, file.name)) {
            incorrectFiles.push(`\nFile name: ${file.name}`);
            incorrectFiles.push(`\nPath: ${file.webkitRelativePath}\n`);
        }
    }
    for (const file of this.files) {
        const path = file.webkitRelativePath;
        switch (true) {
            case articlesPathRegex.test(path):
                await populateMarkdownPayload(file, true);
                break;
            case imagesPathRegex.test(path):
                await populateMarkdownPayload(file, false, true);
                break;
            case homePathRegex.test(path):
            case aboutPathRegex.test(path):
                await populateMarkdownPayload(file);
                break;
        }
    }
    validityCheck(incorrectFiles);
}
/**
 * Compare file paths against the regexes to determine validity.
 *
 * @param path
 * @param name
 * @returns
 */
function checkFileValidity(path, name) {
    name = name.toLowerCase();
    const isValidArticleName = name !== "home.md" && name !== "about.md";
    switch (true) {
        case articlesPathRegex.test(path) && isValidArticleName:
            return true;
        case imagesPathRegex.test(path):
            return true;
        case homePathRegex.test(path):
        case aboutPathRegex.test(path):
            return true;
        default:
            return false;
    }
}
/**
 * Parse the DataTransferItemList entries and populate the markdown object.
 *
 * @param files
 */
async function parseDroppedFiles(files) {
    let markdownFiles = [];
    let incorrectFiles = [];
    for (const file of files) {
        const mainDirectory = file.webkitGetAsEntry();
        markdownFiles = await getAllDirectoryEntries(mainDirectory);
    }
    for (const entry of markdownFiles) {
        await handleDroppedEntry(entry, incorrectFiles);
    }
    validityCheck(incorrectFiles);
}
/**
 * Check if folder structure is invalid and either alert user if present
 * or proceed to sending the files.
 *
 * @param incorrectFiles
 */
async function validityCheck(incorrectFiles) {
    if (!markdown.home) {
        errorDetected("Must include a home.md");
    }
    else if (incorrectFiles.length !== 0) {
        let alertMessage = incorrectFiles.reduce((message, name) => {
            return message + `\n${name}`;
        }, "The following files are incorrectly located/named/are the wrong type: ");
        await errorDetected(alertMessage);
    }
    else {
        sendFiles();
    }
}
/**
 * Animate styles, append new elements
 * and display previously hidden elements.
 */
function addLinks() {
    const keyframes = [
        {
            width: "80%",
            opacity: "0.3",
        },
    ];
    dragArea.animate(keyframes, {
        duration: 1000,
        easing: "ease-in-out",
        iterations: 1,
    });
    /**
     * Set timeout to animate styles, append new elements
     * and display previously hidden elements.
     */
    setTimeout(() => {
        const nav = document.body.getElementsByTagName("nav")[0];
        iframe.src = "http://127.0.0.1:3000/home";
        iframe.style.border = "";
        iframeContainer.style.display = "grid";
        dragArea.style.display = "none";
        downloadButton.style.display = "block";
        iframeContainer.insertBefore(downloadButton, iframe);
        const homeLink = document.createElement("a");
        homeLink.innerHTML = "Visit Generated Site";
        homeLink.href = "http://127.0.0.1:3000/home";
        nav.lastElementChild.insertBefore(homeLink, nav.lastElementChild.lastElementChild);
    }, 1000);
    folderStructure.style.display = "none";
}
//Parse dropped directory into a markdown object
async function handleDroppedEntry(entry, incorrectFiles, article, image) {
    if (entry.isFile) {
        const file = await getFile(entry);
        if (!checkFileValidity(entry.fullPath, entry.name)) {
            incorrectFiles.push(`\nFile name => ${file.name}`);
            incorrectFiles.push(`Path => ${entry.fullPath}\n`);
            return;
        }
        switch (true) {
            case article:
                await populateMarkdownPayload(file, article);
                break;
            case image:
                await populateMarkdownPayload(file, false, image);
                break;
            default:
                await populateMarkdownPayload(file);
                break;
        }
    }
    else if (entry.isDirectory) {
        if (entry.name.toLowerCase() === "articles") {
            const articles = await getAllDirectoryEntries(entry);
            for (const article of articles) {
                handleDroppedEntry(article, incorrectFiles, true);
            }
        }
        else if (entry.name.toLowerCase() === "images") {
            const images = await getAllDirectoryEntries(entry);
            for (const image of images) {
                await handleDroppedEntry(image, incorrectFiles, null, true);
            }
        }
    }
}
/**
 * Append the correct file contents to the respective
 * markdown property.
 *
 * @param file
 * @param article
 * @param image
 */
async function populateMarkdownPayload(file, article, image) {
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
    }
}
/**
 * Obtain all the entries within a directory and return
 * as a Promise<FileSystemArray[]>
 *
 * @param directory
 * @returns
 */
function getAllDirectoryEntries(directory) {
    const directoryReader = directory.createReader();
    let directories = readAllDirectoryEntries(directoryReader);
    return directories;
}
/**
 * Return an array of FileSystemEntries as a Promise
 *
 * @param directoryReader
 * @returns
 */
function readAllDirectoryEntries(directoryReader) {
    return new Promise((resolve, reject) => {
        directoryReader.readEntries(resolve, reject);
    });
}
/**
 * Return a file from a FileSystemFileEntry
 *
 * @param fileEntry
 * @returns
 */
function getFile(fileEntry) {
    try {
        return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
    }
    catch (err) {
        console.log(err);
    }
}
/**
 * Upload any images found within the markdown folder provided
 *
 * @returns
 */
async function uploadImages() {
    if (markdown.images.length < 1)
        return;
    let imageFormData = new FormData();
    for (const image of markdown.images) {
        imageFormData.append("images", image);
    }
    console.log("Uploading images...");
    let batchId;
    await fetch("http://127.0.0.1:3000/images", {
        method: "POST",
        body: imageFormData,
    })
        .then((res) => {
        return res.json();
    })
        .then((data) => {
        console.log(data);
        /*
        If successfully uploaded, remove from markdown object to
        avoid redundancy.
        */
        if (data.imagesSuccessfullyUploaded) {
            // delete markdown.images;
            // batchId = data.batchId;
            // console.log("Received: ", batchId);
            delete markdown.images;
        }
    })
        .catch((err) => {
        console.log(err);
    });
    return batchId;
}
/**
 * Call uploadImages() and upload markdown files' contents
 * afterwards, then trigger post-upload actions by calling
 * addLinks()
 */
async function sendFiles() {
    if (!markdown.about)
        delete markdown.about;
    console.log(markdown);
    await uploadImages();
    // console.log("Sending files: ", batchId);
    await fetch("http://127.0.0.1:3000/markdown", {
        method: "POST",
        body: JSON.stringify({
            markdown: markdown,
            // batchId: batchId,
        }),
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
        return res.json();
    })
        .then((data) => {
        console.log(data);
        if (data.filesSuccessfullyParsed === true) {
            addLinks();
        }
        markdown = {
            home: undefined,
            about: undefined,
            articles: [],
            images: [],
        };
    })
        .catch((err) => {
        console.log(err);
    });
}
export {};
//# sourceMappingURL=index.js.map