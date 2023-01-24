// import * as fs from "fs";

interface MarkdownFile {
  name: string;
  content: string;
}

interface Markdown {
  home: MarkdownFile;
  about: MarkdownFile;
  articles: MarkdownFile[];
}

const dragArea: HTMLDivElement = document.querySelector(".dragArea");
const iframe = document.getElementsByTagName("iframe")[0];
// const file = fs.readFileSync(`./home/home.html`, "utf8");
// if (file) {
//   addLinks();
// }
iframe.style.border = "none";

function preventDefaults(e: Event) {
  e.preventDefault();
  e.stopPropagation();
  if (e.type === "drop") {
    console.log("Prevented drop defaults");
  }
}

function resetStyles() {
  dragArea.style.backgroundColor = "";
}

function dragOver(e: DragEvent) {
  preventDefaults(e);
  dragArea.style.backgroundColor = "green";
}

function dragLeave(e: DragEvent) {
  preventDefaults(e);
  resetStyles();
}

async function drop(e: DragEvent) {
  preventDefaults(e);
  const files = e.dataTransfer.items;
  let markdown: Markdown = {
    home: undefined,
    about: undefined,
    articles: [],
  };
  console.log(files);
  resetStyles();
  let markdownFiles: FileSystemEntry[] = [];
  for (const mainDirectory of files) {
    markdownFiles = await getAllDirectoryEntries(
      mainDirectory.webkitGetAsEntry() as FileSystemDirectoryEntry
    );
  }
  for (const entry of markdownFiles) {
    await handleEntry(entry, markdown);
  }
  console.log("Markdown: ", markdown);

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
    .then((data: { parsingStatus: boolean }) => {
      console.log(data);
      if (data.parsingStatus === true) {
        addLinks()
      }
    });
}

function addLinks() {
  iframe.src = "dist/templates/home/home.html";
  iframe.style.border = "";
  iframe.style.display = "block";
  dragArea.style.display = "none";
  document.body.appendChild(iframe);
  const homeLink = document.createElement("a");
  homeLink.innerHTML = "Visit home of site created";
  homeLink.href = "./dist/templates/home/home.html";
  document.body.insertBefore(homeLink, iframe);
}

//Parse dropped directory into a markdown object
async function handleEntry(entry: FileSystemEntry, markDown: Markdown, article?:boolean) {
  if (entry.isFile) {
    const file = await getFile(entry as FileSystemFileEntry);
    let name = file.name.toLowerCase();

    const home = /home.md/i;
    const about = /about.md/i;

    switch (true) {
      case home.test(name):
        markDown.home = { name: file.name, content: await file.text() };
        break;
      case about.test(name):
        markDown.about = { name: file.name, content: await file.text() };
        break;
      case article:
        markDown.articles.push({ name: file.name, content: await file.text() });
        break;
      default:
        alert("Check folder structure");
        break;
    }
  } else if (entry.isDirectory) {
    if (entry.name.toLowerCase() === "articles") {
      const articles = await getAllDirectoryEntries(
        entry as FileSystemDirectoryEntry
      );
      for (const article of articles) {
        handleEntry(article, markDown, true);
      }
    }
  }
}

function getAllDirectoryEntries(
  directory: FileSystemDirectoryEntry
): Promise<FileSystemEntry[]> {
  const reader = directory.createReader();
  let directories = readAllDirectoryEntries(reader);
  return directories;
}

function readAllDirectoryEntries(reader: FileSystemDirectoryReader) {
  return new Promise<FileSystemEntry[]>((resolve, reject) => {
    reader.readEntries(resolve, reject);
  });
}

function getFile(fileEntry: FileSystemFileEntry): Promise<File> {
  try {
    return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
  } catch (err) {
    console.log(err);
  }
}

dragArea.addEventListener("dragover", dragOver);
dragArea.addEventListener("dragleave", dragLeave);
dragArea.addEventListener("drop", drop);
