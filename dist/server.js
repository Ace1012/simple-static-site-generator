import * as fs from "fs";
import * as path from "path";
import express from "express";
import multer from "multer";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { JSDOM } from "jsdom";
import cors from "cors";
import { randomUUID } from "crypto";
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "dist/templates/images");
    },
    filename(req, file, callback) {
        callback(null, file.originalname);
    },
});
const upload = multer({ storage: storage });
const dom = new JSDOM("<!DOCTYPE html>").window.document;
const filesToDelete = new Map();
const app = express();
const router = express.Router();
router.use(express.static(path.resolve()));
router.use(express.urlencoded({ extended: true }));
router.use(express.json());
router.use(cors({
    origin: "*",
}));
router.get("/", function (req, res) {
    console.log("Sending index.html");
    res.set("Access-Control-Allow-Origin", "*");
    res.sendFile("index.html", {
        root: path.join(path.resolve(), "public"),
    });
});
router.get("/loadHome", async (req, res) => {
    // res.sendFile("home.html", {
    //   root: path.join(path.resolve(), "dist/templates/home"),
    // });
    let array = [];
    const paths = await getWrittenFiles(path.join(path.resolve(), "dist"), array);
    console.log(paths);
    res.json({
        paths: paths
    });
});
router.post("/markdown", (req, res) => {
    const markdown = req.body.markdown;
    let batchId = randomUUID();
    filesToDelete.set(batchId, []);
    console.log(batchId);
    createHtml(markdown, batchId);
    // getWrittenFiles(path.join(path.resolve(), "dist"))
    deleteFiles(batchId);
    res.send({ filesSuccessfullyParsed: true });
});
router.post("/images", upload.array("images", 12), async (req, res) => {
    res.send({ imagesSuccessfullyUploaded: true });
});
router.delete("/delete", (req, res) => {
    res.send({ deleted: true });
});
router.use(function (req, res, next) {
    console.log("Route doesn't exist");
    res.status(404).sendFile("404.html", {
        root: path.join(path.resolve(), "dist/templates/error"),
    });
});
app.use("/", router);
app.listen(3000);
console.log("Server running...");
console.log(path.resolve());
// function getWrittenFiles(){
//   try {
//     const arrayOfFiles = fs.readdirSync(path.join(path.resolve(), "dist"))
//     console.log(arrayOfFiles)
//   } catch(e) {
//     console.log(e)
//   }
// }
async function getWrittenFiles(dir, paths) {
    fs.readdirSync(dir).forEach(async (file) => {
        let fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            // console.log("Directory:\t",fullPath);
            paths.push(fullPath);
            await getWrittenFiles(fullPath, paths);
        }
        else {
            // console.log("File:\t",fullPath);
            paths.push(fullPath);
        }
    });
    return paths;
}
function deleteFiles(batchId) {
    const files = filesToDelete.get(batchId);
    const minutes = 1;
    setTimeout(() => {
        files.forEach((path) => {
            console.log(path);
            fs.unlink(path, (err) => {
                if (err)
                    console.log(err);
                else
                    console.log("File deleted");
            });
        });
        filesToDelete.delete(batchId);
    }, minutes * 60 * 1000);
}
async function createHtml(markdown, batchId) {
    let keys = Object.keys(markdown);
    /*
    Manipulate array contents to have articles as the first key.
    This is done to account for all the articles first in order to accurately populate the navbar links.
    */
    keys = keys.filter((key) => key !== "articles");
    keys.splice(0, 0, "articles");
    let navbarLinksContainer = dom.createElement("div");
    navbarLinksContainer.className = "nav-links-container";
    let navbarLinks = dom.createElement("div");
    navbarLinksContainer.appendChild(navbarLinks);
    navbarLinks.className = "nav-links";
    for (const key of keys) {
        const outPath = path.join(path.resolve(), `dist/templates/${key}`);
        const template = key === "images"
            ? ""
            : fs.readFileSync(path.join(path.resolve(), `templates/${key}/${key === "articles" ? "article" : key}.html`), "utf8");
        let articles = [];
        if (key === "articles") {
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
                filesToDelete.set(batchId, [
                    ...filesToDelete.get(batchId),
                    outPutFilePath,
                ]);
            }
            createNavLinks(navbarLinks, articles);
            for (const article of articles) {
                populateNavBar(article.outPutFilePath, article.populatedTemplate, navbarLinksContainer, markdown, article.name);
            }
        }
        if (key === "about" || key === "home") {
            const outPutFilePath = getOutPutFilePath(key, outPath);
            const parsedFile = parseFile(markdown[key].content);
            const populatedTemplate = populateTemplate(template, parsedFile);
            filesToDelete.set(batchId, [
                ...filesToDelete.get(batchId),
                outPutFilePath,
            ]);
            populateNavBar(outPutFilePath, populatedTemplate, navbarLinksContainer, markdown, markdown[key].name);
        }
    }
}
async function createNavLinks(navbarLinks, articles) {
    for (const article of articles) {
        let listItem = dom.createElement("li");
        let articleLink = dom.createElement("a");
        articleLink.innerHTML = article.name;
        let href = `templates/articles/${article.name}.html`;
        articleLink.href = `https://sssg-rapando.onrender.com/dist/${href}`;
        listItem.appendChild(articleLink);
        navbarLinks.appendChild(listItem);
    }
}
async function populateNavBar(outPutFilePath, populatedTemplate, navbarLinksContainer, markdown, filename) {
    const html = new JSDOM(populatedTemplate);
    const doc = html.window.document;
    const nav = doc.body.getElementsByTagName("nav")[0];
    if (filename !== "about.md" && markdown.about) {
        const about = doc.createElement("a");
        about.innerHTML = "About";
        about.href =
            "https://sssg-rapando.onrender.com/dist/templates/about/about.html";
        nav.firstElementChild.appendChild(about);
    }
    nav.insertBefore(navbarLinksContainer, nav.lastElementChild);
    populatedTemplate = doc.head.outerHTML + doc.body.outerHTML;
    await saveFile(outPutFilePath, populatedTemplate);
}
function getOutPutFilePath(basename, outPath, articleName, imageName) {
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
    html = sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat("img"),
    });
    return { ...parsedFile, html };
}
function populateTemplate(template, parsedFile) {
    return template
        .replace(/<!--CONTENT-->/i, parsedFile.html)
        .replace(/<!--TITLE-->/i, parsedFile.data.title);
}
async function saveFile(outPutFilePath, contents) {
    const directory = path.dirname(outPutFilePath);
    if (!fs.existsSync(outPutFilePath)) {
        fs.mkdir(directory, { recursive: true }, (err) => {
            if (err)
                throw err;
        });
    }
    fs.writeFileSync(outPutFilePath, contents);
}
//# sourceMappingURL=server.js.map