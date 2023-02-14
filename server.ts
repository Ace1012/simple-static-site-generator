import * as fs from "fs";
import * as path from "path";
import express from "express";
import cors from "cors";
import multer from "multer";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import JSZip from "jszip";
import { JSDOM } from "jsdom";
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

//Setup Multer constants
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "dist/templates/images");
  },
  filename(req, file, callback) {
    callback(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

//Create JSDOM element to create append HTML elements to various files
const dom = new JSDOM("<!DOCTYPE html>").window.document;

//Store file locations for deletion after timeout
const filesToDelete = new Map<string, string[]>();

const app = express();
const router = express.Router();
router.use(express.static(path.resolve()));
router.use(express.urlencoded({ extended: true }));
router.use(express.json());
router.use(cors());

/**
 * Send index.html
 */
router.get("/", function (req, res) {
  console.log("Sending index.html");
  res.sendFile("index.html", {
    root: path.join(path.resolve(), "public"),
  });
});

/**
 * Send home page of generated website
 */
router.get("/home", async (req, res) => {
  console.log("Sending home.html");
  res.sendFile("home.html", {
    root: path.join(path.resolve(), "dist/templates/home"),
  });
});

/**
 * Receive markdown content and generate the html files.
 */
router.post("/markdown", (req, res) => {
  const markdown: Markdown = req.body.markdown;
  let batchId = randomUUID();
  filesToDelete.set(batchId, []);
  console.log(batchId);

  createHtml(markdown, batchId);

  deleteFiles(batchId);

  // res.send({ filesSuccessfullyParsed: true, batchId: req.body.batchId });
  res.send({ filesSuccessfullyParsed: true, batchId: batchId });
});

/**
 * Receive images stored in images directory.
 */
router.post("/images", upload.array("images", 12), async (req, res) => {
  // let batchId = req.body.batchId ? req.body.batchId : randomUUID();
  // let batchId = randomUUID();
  res.send({
    imagesSuccessfullyUploaded: true,
    // batchId: batchId,
  });
});

/**
 * Create a zip file containing the generated html files.
 *
 * NB:
 * - The "Download Site" option in the side menu is removed here.
 * - TODO: If the files were already deleted, then an error message is sent instead requesting
 *         regeneration.
 */
router.get("/download", async (req, res) => {
  console.log("Sending zip file");

  const zip = new JSZip();

  const generatedWebsite = zip.folder("Generated Website");

  const publicFolder = generatedWebsite.folder("public");
  const distFolder = generatedWebsite.folder("dist");

  const templates = distFolder.folder("templates");

  const homeFolder = templates.folder("home");
  const aboutFolder = templates.folder("about");
  const errorFolder = templates.folder("error");
  const articlesFolder = templates.folder("articles");
  const imagesFolder = templates.folder("images");

  const homeRegEx = /^home.html$/i;
  const aboutRegEx = /^about.html$/i;
  const errorRegEx = /^404.html$/i;
  const articleRegEx = /^([A-Za-z0-9\-_ ()]+.html)$/i;
  const scriptRegEx = /^script.js$/i;
  const imageRegEx = /^([A-Za-z0-9\-_ ()]+.(jpg|jpeg|png|gif))$/i;

  type WebsiteFolder = {
    home: undefined;
    about: undefined;
    error: undefined;
    articles: undefined;
    images: undefined;
  };

  //Empty object used to obtain an array the WebsiteFolder keys
  const dummyObject: WebsiteFolder = {
    home: undefined,
    about: undefined,
    error: undefined,
    articles: undefined,
    images: undefined,
  };

  const keys = Object.keys(dummyObject) as (keyof WebsiteFolder)[];
  const root = `dist/templates/`;

  //Read contents of styles..css file
  const styles = fs.readFileSync(
    path.join(path.resolve(), `public/styles.css`)
  );
  publicFolder.file("styles.css", styles);

  //Generate the described folder structure within a zip file
  for (let key of keys) {
    console.log(`\nKey: ${key}`);
    //Get the names of all files within the current directory
    const filenames = fs.readdirSync(
      path.join(path.resolve(), `${root}${key}`)
    );
    filenames.forEach((filename) => {
      /**
       * Parse through each concerned file while:
       *  - removing the ".generated-site-controls" div section that houses the "download site"
       *    button as well as any other feature that interacts with the generated site that may be added in future.
       *  - placing the script files into their respective folders.
       */
      switch (true) {
        case homeRegEx.test(filename):
          console.log(`Home found - ${filename}\n`);
          const home = fs.readFileSync(
            path.join(path.resolve(), `${root}home/home.html`)
          );
          const homeContent = new JSDOM(home).window.document;
          homeContent.querySelector(".generated-site-controls").remove();

          homeFolder.file(
            "home.html",
            homeContent.body.parentElement.outerHTML
          );
          break;
        case aboutRegEx.test(filename):
          console.log(`About found - ${filename}\n`);
          const about = fs.readFileSync(
            path.join(path.resolve(), `${root}about/about.html`)
          );
          const aboutContent = new JSDOM(about).window.document;
          aboutContent.querySelector(".generated-site-controls").remove();
          aboutFolder.file(
            "about.html",
            aboutContent.body.parentElement.outerHTML
          );
          break;
        case scriptRegEx.test(filename):
          console.log(`Script found - ${filename}\n`);
          let script: Buffer;
          switch (key) {
            case "home":
              script = fs.readFileSync(
                path.join(path.resolve(), `${root}home/script.js`)
              );
              homeFolder.file("script.js", script);
              break;
            case "about":
              script = fs.readFileSync(
                path.join(path.resolve(), `${root}about/script.js`)
              );
              aboutFolder.file("script.js", script);
              break;
            case "articles":
              script = fs.readFileSync(
                path.join(path.resolve(), `${root}articles/script.js`)
              );
              articlesFolder.file("script.js", script);
              break;
            case "error":
              script = fs.readFileSync(
                path.join(path.resolve(), `${root}error/script.js`)
              );
              errorFolder.file("script.js", script);
              break;
          }
          break;
        case errorRegEx.test(filename):
          console.log(`Error file found - ${filename}\n`);
          const error = fs.readFileSync(
            path.join(path.resolve(), `${root}error/${filename}`)
          );
          errorFolder.file(filename, error);
          break;
        case articleRegEx.test(filename):
          console.log(`Article found - ${filename}\n`);
          const article = fs.readFileSync(
            path.join(path.resolve(), `${root}articles/${filename}`)
          );
          const articleContent = new JSDOM(article).window.document;
          articleContent.querySelector(".generated-site-controls").remove();
          articlesFolder.file(
            filename,
            articleContent.body.parentElement.outerHTML
          );
          break;
        case imageRegEx.test(filename):
          console.log(`Image found - ${filename}\n`);
          const image = fs.readFileSync(
            path.join(path.resolve(), `${root}images/${filename}`)
          );
          imagesFolder.file(filename, image);
          break;
      }
    });
  }

  const zipsDirectory = `zips`;
  const name = `website.zip`;
  const fullPath = `${zipsDirectory}/${name}`;

  //Generate the archive
  const zipContents = await zip.generateAsync({ type: "nodebuffer" });

  //Create temporary directory "zips" to store the archive
  if (!fs.existsSync(zipsDirectory)) {
    fs.mkdirSync(zipsDirectory);
  }

  //Write the file
  fs.writeFileSync(path.join(path.resolve(), fullPath), zipContents);

  //Send archive to the user
  const stat = fs.statSync(fullPath);
  console.log(`Size of ${fullPath} is:  ${stat.size / 1048576} kb`);
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=website.zip");
  res.setHeader("Content-Length", stat.size);
  res.download(path.join(path.resolve(), fullPath));

  //Delete previously create "zips" directory
  if (fs.existsSync(zipsDirectory)) {
    setTimeout(() => {
      fs.rmSync(path.join(path.resolve(), zipsDirectory), {
        recursive: true,
        force: true,
      });
    }, 1000);
  }
});

/**
 * Intersept 404 errors and send the 404.html page.
 */
router.use(function (req, res, next) {
  console.log("Route doesn't exist");
  res.status(404).sendFile("404.html", {
    root: path.join(path.resolve(), "dist/templates/error"),
  });
});

app.use("/", router);

app.listen(3000, () => {
  console.log("\n\n\nServer running...");
  console.log(path.resolve());
});

const nmRegex = /node_modules/i;
const gitRegex = /\.git/i;
const wrongTemplates = /ssg\\templates/i;
//Return the file paths of all files in root directory
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

/**
 * Used to manage storage by deleting generated files after a set time.
 *
 * @param batchId
 */
async function deleteFiles(batchId: string) {
  const files = filesToDelete.get(batchId);
  const minutes = 30;
  console.log(`Deleting in ${minutes} mins`);

  //Set timeout to delete generated html files.
  setTimeout(async () => {
    // console.log("\n\n\nCurrent full directory: ");
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
  }, 30 * 60 * 1000);
}

/**
 * Parse markdown, generate and save the resultant html files.
 *
 * @param markdown
 * @param batchId
 */
async function createHtml(markdown: Markdown, batchId: string) {
  let keys = Object.keys(markdown) as (keyof Markdown)[];

  /**
   * Manipulate array contents to have articles as the first key.
   * This is done to account for all the articles first in order to accurately populate the side menu links.
   */
  keys = keys.filter((key) => key !== "articles");
  keys.splice(0, 0, "articles");

  /**
   * Set of anchor tags used to populate the side menu.
   */
  let sidebarLinks: HTMLAnchorElement[] = [];

  /**
   * A HomeNavbarLinks is created separately for the home page
   * because it takes a different set of anchor tags from the other elements.
   * The home page acts as the hub (due to the <base> tag), therefore its
   * links are absolute while the others are relative.
   */

  let homeSidebarLinks: HTMLAnchorElement[] = [];

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
      createSidebarLinks(homeSidebarLinks, sidebarLinks, articles);
      for (const article of articles) {
        populateNavBar(
          article.outPutFilePath,
          article.populatedTemplate,
          sidebarLinks,
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
        key === "about" ? sidebarLinks : homeSidebarLinks,
        markdown,
        markdown[key].name
      );
    }
  }
}

/**
 * Append the article links (with their proper href values) onto the home sidebar links array
 * and sidebar links array used by the other files.
 *
 * @param homeSidebarLinks
 * @param sidebarLinks
 * @param articles
 */
async function createSidebarLinks(
  homeSidebarLinks: HTMLAnchorElement[],
  sidebarLinks: HTMLAnchorElement[],
  articles: Article[]
) {
  for (const article of articles) {
    let listItem = dom.createElement("li");
    let articleLink = dom.createElement("a");
    articleLink.innerHTML = article.name;
    articleLink.href = `../articles/${article.name}.html`;

    listItem.appendChild(articleLink);
    sidebarLinks.push(articleLink);

    let homeListItem = dom.createElement("li");
    let homeArticleLink = dom.createElement("a");
    homeArticleLink.innerHTML = article.name;
    homeArticleLink.href = `dist/templates/articles/${article.name}.html`;

    homeListItem.appendChild(homeArticleLink);
    homeSidebarLinks.push(homeArticleLink);
  }
}

/**
 * Properly append the home and about links onto the html files.
 *
 * @param filename
 * @param nav
 * @param doc
 * @param markdown
 */
function createBasicLinks(
  filename: string,
  nav: HTMLElement,
  doc: Document,
  markdown: Markdown
) {
  if (filename !== "home.md") {
    const home = doc.createElement("a");
    home.innerHTML = "Home";
    home.href = `../home/home.html`;
    nav.firstElementChild.appendChild(home);
  }
  if (filename !== "about.md" && markdown.about) {
    const about = doc.createElement("a");
    about.innerHTML = "About";
    about.href =
      filename === "home.md"
        ? `dist/templates/about/about.html`
        : `../about/about.html`;
    nav.firstElementChild.appendChild(about);
  }
}

/**
 * Properly append the generated navbar & sidebar content onto the
 * generated html files.
 *
 * @param outPutFilePath
 * @param populatedTemplate
 * @param sidebarLinks
 * @param markdown
 * @param filename
 */
async function populateNavBar(
  outPutFilePath: string,
  populatedTemplate: string,
  sidebarLinks: HTMLAnchorElement[],
  markdown: Markdown,
  filename: string
) {
  const html = new JSDOM(populatedTemplate);
  const doc = html.window.document;
  const nav = doc.body.getElementsByTagName("nav")[0];
  const articleLinks = nav.getElementsByClassName("article-links")[0];

  createBasicLinks(filename, nav, doc, markdown);

  for (const link of sidebarLinks) {
    articleLinks.appendChild(link);
  }

  populatedTemplate = doc.body.parentElement.outerHTML;
  await saveFile(outPutFilePath, populatedTemplate);
}

/**
 * Generate output file path
 *
 * @param basename
 * @param outPath
 * @param articleName
 * @param imageName
 * @returns
 */
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

/**
 * Obtain the front-matter of the markdown file, parse the markdown file into
 * html, sanitize the generated html and return an object containing the front-matter, old markdown
 * and generated html.
 *
 * @param fileContents
 * @returns
 */
function parseFile(fileContents: string): ParsedFile {
  const parsedFile = matter(fileContents);
  let html = marked(parsedFile.content);
  html = sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat("img"),
  });
  return { ...parsedFile, html };
}

/**
 * Populate the html templates by replacing the content comment with the
 * generated html and using the front-matter replace any other comment that
 * may be included in future.
 *
 * @param template
 * @param parsedFile
 * @returns
 */
function populateTemplate(template: string, parsedFile: ParsedFile) {
  return template
    .replace(/<!--CONTENT-->/i, parsedFile.html)
    .replace(/<!--TITLE-->/i, parsedFile.data.title);
}

/**
 * Create the file by writing it onto the file system.
 *
 * @param outPutFilePath
 * @param contents
 */
async function saveFile(outPutFilePath: string, contents: string) {
  fs.writeFileSync(outPutFilePath, contents);
}