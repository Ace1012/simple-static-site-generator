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

interface MarkdownFile {
  name: string;
  content: string;
}

interface Markdown {
  home: MarkdownFile;
  about?: MarkdownFile;
  articles?: MarkdownFile[];
  images?: File[];
}

interface Article {
  name: string;
  outPutFilePath: string;
  populatedTemplate: string;
}

type ParsedFile = matter.GrayMatterFile<string> & { html: string };

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
const filesToDelete = new Map<string, string[]>();

const app = express();
const router = express.Router();
router.use(express.static(path.resolve()));
router.use(express.urlencoded({ extended: true }));
router.use(express.json());
router.use(cors());

router.get("/", function (req, res) {
  console.log("Sending index.html");
  res.set("Access-Control-Allow-Origin", "*");
  res.sendFile("index.html", {
    root: path.join(path.resolve(), "public"),
  });
});

router.get("/loadHome", async (req, res) => {
  console.log("Sending home.html");
  res.sendFile("home.html", {
    root: path.join(path.resolve(), "dist/templates/home"),
  });
});

router.post("/markdown", (req, res) => {
  const markdown: Markdown = req.body.markdown;
  let batchId = randomUUID();
  filesToDelete.set(batchId, []);
  console.log(batchId);

  createHtml(markdown, batchId);

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
console.log("\n\n\nServer running...");
console.log(path.resolve());

const nmRegex = /node_modules/i;
const gitRegex = /\.git/i;
const wrongTemplates = /ssg\\templates/i;

async function getAllCurrentFiles(dir: string, paths: string[]) {
  fs.readdirSync(dir).forEach(async (file) => {
    let fullPath = path.join(dir, file);
    if (
      fs.lstatSync(fullPath).isDirectory() &&
      !(
        nmRegex.test(fullPath) ||
        gitRegex.test(fullPath) ||
        wrongTemplates.test(fullPath)
      )
    ) {
      paths.push(fullPath);
      await getAllCurrentFiles(fullPath, paths);
    } else {
      paths.push(fullPath);
    }
  });
  return paths;
}

async function deleteFiles(batchId: string) {
  (await getAllCurrentFiles(path.join(path.resolve(), "dist"), [])).forEach(
    (path) => console.log(path)
  );
  const files = filesToDelete.get(batchId);
  // const minutes = 0.167;
  const minutes = 30;
  setTimeout(async () => {
    console.log("\n\n\nCurrent full directory: ");
    (await getAllCurrentFiles(path.join(path.resolve(), "dist"), [])).forEach(
      (path) => console.log(path)
    );
    console.log("\n\n\nDeleting files...");
    files.forEach((path) => {
      console.log(path);
      fs.unlink(path, (err) => {
        if (err) console.log(err);
      });
    });
    filesToDelete.delete(batchId);
  }, minutes * 60 * 1000);
}

async function createHtml(markdown: Markdown, batchId: string) {
  let keys = Object.keys(markdown);

  /*
  Manipulate array contents to have articles as the first key.
  This is done to account for all the articles first in order to accurately populate the navbar links.
  */
  keys = keys.filter((key) => key !== "articles");
  keys.splice(0, 0, "articles");

  let navbarLinksContainer: HTMLDivElement = dom.createElement("div");
  navbarLinksContainer.className = "nav-links-container";

  let navbarLinks: HTMLDivElement = dom.createElement("div");
  navbarLinksContainer.appendChild(navbarLinks);
  navbarLinks.className = "nav-links";

  for (const key of keys) {
    const outPath = path.join(path.resolve(), `dist/templates/${key}`);
    const template =
      key === "images"
        ? ""
        : fs.readFileSync(
            path.join(
              path.resolve(),
              `templates/${key}/${key === "articles" ? "article" : key}.html`
            ),
            "utf8"
          );
    console.log(outPath);
    let articles: Article[] = [];
    if (key === "articles") {
      for (const article of markdown[key]) {
        const outPutFilePath = getOutPutFilePath(
          key,
          outPath,
          article.name.split(".")[0]
        );
        const parsedFile = parseFile(article.content);
        const populatedTemplate = populateTemplate(template, parsedFile);
        const generatedArticle: Article = {
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
        populateNavBar(
          article.outPutFilePath,
          article.populatedTemplate,
          navbarLinksContainer,
          markdown,
          article.name
        );
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

      populateNavBar(
        outPutFilePath,
        populatedTemplate,
        navbarLinksContainer,
        markdown,
        markdown[key].name
      );
    }
  }
}

async function createNavLinks(
  navbarLinks: HTMLDivElement,
  articles: Article[]
) {
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

async function populateNavBar(
  outPutFilePath: string,
  populatedTemplate: string,
  navbarLinksContainer: HTMLDivElement,
  markdown: Markdown,
  filename: string
) {
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

function getOutPutFilePath(
  basename: string,
  outPath: string,
  articleName?: string,
  imageName?: string
) {
  const filename = articleName
    ? `${articleName}.html`
    : imageName
    ? `${imageName}`
    : `${basename}.html`;
  const outPutFilePath = path.join(outPath, filename);
  return outPutFilePath;
}

function parseFile(fileContents: string): ParsedFile {
  const parsedFile = matter(fileContents);
  let html = marked(parsedFile.content);
  html = sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat("img"),
  });
  return { ...parsedFile, html };
}

function populateTemplate(template: string, parsedFile: ParsedFile) {
  return template
    .replace(/<!--CONTENT-->/i, parsedFile.html)
    .replace(/<!--TITLE-->/i, parsedFile.data.title);
}

async function saveFile(outPutFilePath: string, contents: string) {
  // const directory = path.dirname(outPutFilePath);
  // console.log(outPutFilePath);
  // if (!fs.existsSync(outPutFilePath)) {
  //   fs.mkdir(directory, { recursive: true }, (err) => {
  //     if (err) throw err;
  //   });
  // }
  fs.writeFileSync(outPutFilePath, contents);
}
