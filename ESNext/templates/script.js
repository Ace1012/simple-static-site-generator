const dragArea = document.querySelector(".dragArea");
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}
function resetStyles() {
    dragArea.style.backgroundColor = "";
}
function dragOver(e) {
    preventDefaults(e);
    dragArea.style.backgroundColor = "green";
}
function dragLeave(e) {
    preventDefaults(e);
    resetStyles();
}
async function drop(e) {
    preventDefaults(e);
    const files = e.dataTransfer.items;
    let markDown = {
        home: undefined,
        about: undefined,
        articles: [],
    };
    console.log(files);
    resetStyles();
    let markdownFiles = [];
    for (const mainDirectory of files) {
        markdownFiles = await getAllDirectoryEntries(mainDirectory.webkitGetAsEntry());
    }
    for (const entry of markdownFiles) {
        await handleEntry(entry, markDown);
    }
    console.log("Markdown: ", markDown);
    fetch("http://localhost:3000", {
        method: "POST",
        body: JSON.stringify({ markdown: markDown }),
        headers: {
            "Content-Type": "application/json",
            //
        },
    })
        .then((res) => {
        return res.json();
    })
        .then((data) => {
        console.log(data);
    });
}
//Parse dropped directory into a markdown object
async function handleEntry(entry, markDown) {
    if (entry.isFile) {
        const file = await getFile(entry);
        // let name = (await file.text()).toLowerCase().split(".")[0];
        let name = file.name.toLowerCase();
        if (name === "home.md") {
            // console.log("Home found: ", file.name);
            markDown.home = { name: file.name, content: await file.text() };
            // console.log("Current markdown: ", markDown);
        }
        else if (name === "about.md") {
            // console.log("About found: ", file.name);
            markDown.about = { name: file.name, content: await file.text() };
            // console.log("Current markdown: ", markDown);
        }
        else if (name.match(/article[0-9]+\.md/i)) {
            // console.log("Article found: ", file.name);
            markDown.articles.push({ name: file.name, content: await file.text() });
            // console.log("Current markdown: ", markDown);
        }
    }
    else if (entry.isDirectory) {
        if (entry.name.toLowerCase() === "articles") {
            const articles = await getAllDirectoryEntries(entry);
            for (const article of articles) {
                handleEntry(article, markDown);
            }
        }
    }
}
async function getAllDirectoryEntries(directory) {
    const reader = directory.createReader();
    let articles = readAllDirectoryEntries(reader);
    return articles;
}
async function readAllDirectoryEntries(reader) {
    return await new Promise((resolve, reject) => {
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