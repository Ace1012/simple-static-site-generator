import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { mkdirp } from "mkdirp";
import express from "express";
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(function (req, res, next) {
    console.log("In middleware");
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});
function logger(req, res, next) {
    // console.log(req.originalUrl);
    next();
}
console.log("Server running...");
// app.use("/", logger, userRouter);
app.post("/", (req, res) => {
    console.log("Message arrived!");
    console.log(req.body);
    res.send(JSON.stringify(req.body));
});
app.listen(3000);
function parseFile(dir) {
    const file = fs.readFileSync(dir, "utf-8");
    const parsedFile = matter(file);
    const html = marked(parsedFile.content);
    return { ...parsedFile, html };
}
function populateTemplate(template, parsedFile) {
    return template
        .replace(/<!--CONTENT-->/i, parsedFile.content)
        .replace(/<!--TITLE-->/i, parsedFile.data.title);
}
const filePath = path.join(path.resolve(), "../src/mardown/home.md");
const outPath = path.resolve();
const outPutFilePath = getOutPutFilePath(filePath, outPath);
console.log(outPutFilePath);
function saveFile(fileName, contents) {
    const dir = path.dirname(fileName);
    mkdirp.sync(dir);
    fs.writeFileSync(fileName, contents);
}
function getOutPutFilePath(fileName, outPath) {
    const baseName = path.basename(fileName);
    const newFileName = baseName.split(".")[0] + ".html";
    const outPutFilePath = path.join(outPath, newFileName);
    return outPutFilePath;
}
const parsedFile = parseFile(path.join(path.resolve(), "../src/markdown/home.md"));
const template = fs.readFileSync(path.join(path.resolve(), "../src/templates/home.html"), "utf-8");
const populatedTemplate = populateTemplate(template, parsedFile);
// saveFile(outFileName, populatedTemplate)
// app.listen(3000);
//# sourceMappingURL=server.js.map