import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import express from "express";
import multer from "multer";
import { JSDOM } from "jsdom";
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "./templates/images");
    },
    filename(req, file, callback) {
        callback(null, file.originalname);
    },
});
const upload = multer({ storage: storage });
let dom = new JSDOM("<!DOCTYPE html>").window.document;
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});
console.log("Server running...");
app.post("/", async (req, res) => {
    const markdown = req.body.markdown;
    console.log();
    createHtml(markdown);
    res.send({ parsingStatus: true });
});
app.post("/images", upload.array("images", 12), async (req, res) => {
    const images = req.files;
    // console.log("Images are: ");
    // console.log(images);
    for (const image of images) {
        console.log("Image: ", image.filename);
    }
    res.send({ imagesUploaded: true });
});
async function createHtml(markdown) {
    let keys = Object.keys(markdown);
    keys = keys.filter((key) => key !== "articles");
    keys.splice(0, 0, "articles");
    let navbarLinks = dom.createElement("div");
    navbarLinks.className = "nav-links";
    for (const key of keys) {
        const outPath = path.join(path.resolve(), `/templates/${key}`);
        const template = key === "images"
            ? ""
            : fs.readFileSync(`../templates/${key}/${key === "articles" ? "article" : key}.html`, "utf8");
        let articles = [];
        if (key === "articles") {
            console.log("Parsing articles");
            for (const article of markdown[key]) {
                const outPutFilePath = getOutPutFilePath(key, outPath, article.name.split(".")[0]);
                const parsedFile = parseFile(article.content);
                const populatedTemplate = populateTemplate(template, parsedFile);
                const generatedArticle = {
                    name: article.name.split(".")[0],
                    outPutFilePath: outPutFilePath,
                    populatedTemplate: populatedTemplate,
                };
                articles.push(generatedArticle);
            }
            createNavLinks(navbarLinks, articles);
            for (const article of articles) {
                populateNavBar(article.outPutFilePath, article.populatedTemplate, navbarLinks);
            }
        }
        if (key === "about" || key === "home") {
            const outPutFilePath = getOutPutFilePath(key, outPath);
            const parsedFile = parseFile(markdown[key].content);
            const populatedTemplate = populateTemplate(template, parsedFile);
            console.log(populatedTemplate);
            populateNavBar(outPutFilePath, populatedTemplate, navbarLinks);
        }
    }
}
async function createNavLinks(navbarLinks, articles) {
    for (const article of articles) {
        let listItem = dom.createElement("li");
        let articleLink = dom.createElement("a");
        articleLink.innerHTML = article.name;
        articleLink.href = `../articles/${article.name}.html`;
        listItem.appendChild(articleLink);
        navbarLinks.appendChild(listItem);
    }
}
async function populateNavBar(outPutFilePath, populatedTemplate, navbarLinks) {
    const html = new JSDOM(populatedTemplate);
    const doc = html.window.document;
    doc.body.getElementsByTagName("nav")[0].appendChild(navbarLinks);
    populatedTemplate = doc.head.outerHTML + doc.body.outerHTML;
    console.log("Html doc is: \n", populatedTemplate);
    await saveFile(outPutFilePath, populatedTemplate);
}
function getOutPutFilePath(basename, outPath, articleName, imageName) {
    if (imageName)
        console.log(imageName);
    const filename = articleName
        ? `${articleName}.html`
        : imageName
            ? `${imageName}`
            : `${basename}.html`;
    const outPutFilePath = path.join(outPath, filename);
    return outPutFilePath;
}
function parseFile(fileContents) {
    const parsedFile = matter(fileContents);
    let html = marked(parsedFile.content);
    return { ...parsedFile, html };
}
function populateTemplate(template, parsedFile) {
    return template
        .replace(/<!--CONTENT-->/i, parsedFile.html)
        .replace(/<!--TITLE-->/i, parsedFile.data.title);
}
async function saveFile(outPutFilePath, contents) {
    const directory = path.dirname(outPutFilePath);
    console.log("OutputFilePath: ", outPutFilePath);
    // console.log("Dir: ", directory);
    if (!fs.existsSync(outPutFilePath)) {
        fs.mkdir(directory, { recursive: true }, (err) => {
            if (err)
                throw err;
        });
    }
    fs.writeFileSync(outPutFilePath, contents);
}
app.listen(3000);
//# sourceMappingURL=server.js.map