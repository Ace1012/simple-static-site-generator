import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import express from "express";
import { JSDOM } from "jsdom";
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
    // appendLinks()
    res.send({ parsingStatus: true });
});
async function appendLinks() { }
async function createHtml(markdown) {
    const keys = Object.keys(markdown);
    let articleCounter = 1;
    for (const key of keys) {
        const outPath = path.join(path.resolve(), `/templates/${key}`);
        const template = fs.readFileSync(`../templates/${key}/${key === "articles" ? "article" : key}.html`, "utf8");
        if (key !== "articles") {
            const outPutFilePath = getOutPutFilePath(key, outPath);
            const parsedFile = parseFile(markdown[key].content);
            const populatedTemplate = populateTemplate(template, parsedFile);
            await saveFile(outPutFilePath, populatedTemplate);
        }
        else {
            console.log("Parsing articles");
            markdown[key].forEach((article) => console.log(article.name));
            for (const article of markdown[key]) {
                const outPutFilePath = getOutPutFilePath(key, outPath, articleCounter++);
                console.log(`article${articleCounter}`);
                const parsedFile = parseFile(article.content);
                const populatedTemplate = populateTemplate(template, parsedFile);
                await saveFile(outPutFilePath, populatedTemplate);
            }
        }
    }
}
function getOutPutFilePath(basename, outPath, articleNumber) {
    const filename = basename === "articles"
        ? `article${articleNumber}.html`
        : `${basename}.html`;
    const outPutFilePath = path.join(outPath, filename);
    return outPutFilePath;
}
function parseFile(fileContents) {
    const parsedFile = matter(fileContents);
    let html = marked(parsedFile.content);
    html = sanitizeHTML(html);
    return { ...parsedFile, html };
}
function sanitizeHTML(html) {
    const element = new JSDOM(html).window.document.body;
    element.innerText = html;
    return element.innerHTML;
}
function populateTemplate(template, parsedFile) {
    return template
        .replace(/<!--CONTENT-->/i, parsedFile.html)
        .replace(/<!--TITLE-->/i, parsedFile.data.title);
}
async function saveFile(outPutFilePath, contents) {
    const directory = path.dirname(outPutFilePath);
    console.log("OutputFilePath: ", outPutFilePath);
    console.log("Dir: ", directory);
    if (!fs.existsSync(outPutFilePath)) {
        fs.mkdir(directory, { recursive: true }, (err) => {
            if (err)
                throw err;
        });
    }
    fs.writeFileSync(outPutFilePath, contents);
    // document.body.appendChild(iframe);
    // mkdirp.sync(dir);
}
app.listen(3000);
//# sourceMappingURL=server.js.map