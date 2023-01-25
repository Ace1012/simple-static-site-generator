import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import express from "express";
import multer from "multer";

export interface MarkdownFile {
  name: string;
  content: string;
}

export interface Markdown {
  home: MarkdownFile;
  about: MarkdownFile;
  articles?: MarkdownFile[];
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./templates/images");
  },
  filename(req, file, callback) {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

type ParsedFile = matter.GrayMatterFile<string> & { html: string };

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
  const markdown: Markdown = req.body.markdown;
  console.log();

  createHtml(markdown);

  res.send({ parsingStatus: true });
});

app.post("/images", upload.array("images", 12), async (req, res) => {
  const images = req.files as Express.Multer.File[];
  console.log("Images are: ");
  console.log(images);

  for (const image of images) {
    console.log("Image: ", image.filename);
  }

  res.send({ imagesUploaded: true });
});

async function createHtml(markdown: Markdown) {
  const keys = Object.keys(markdown);
  let articleCounter = 1;

  for (const key of keys) {
    const outPath = path.join(path.resolve(), `/templates/${key}`);
    const template =
      key === "images"
        ? ""
        : fs.readFileSync(
            `../templates/${key}/${key === "articles" ? "article" : key}.html`,
            "utf8"
          );
    if (key !== "articles" && key !== "images") {
      const outPutFilePath = getOutPutFilePath(key, outPath);
      const parsedFile = parseFile(markdown[key].content);
      const populatedTemplate = populateTemplate(template, parsedFile);
      await saveFile(outPutFilePath, populatedTemplate);
    }
    if (key === "articles") {
      console.log("Parsing articles");
      for (const article of markdown[key]) {
        const outPutFilePath = getOutPutFilePath(
          key,
          outPath,
          articleCounter++
        );
        // console.log(`article${articleCounter}`);
        const parsedFile = parseFile(article.content);
        const populatedTemplate = populateTemplate(template, parsedFile);
        await saveFile(outPutFilePath, populatedTemplate);
      }
    }
  }
}

function getOutPutFilePath(
  basename: string,
  outPath: string,
  articleNumber?: number,
  imageName?: string
) {
  if (imageName) console.log(imageName);
  const filename = articleNumber
    ? `article${articleNumber}.html`
    : imageName
    ? `${imageName}`
    : `${basename}.html`;
  const outPutFilePath = path.join(outPath, filename);
  return outPutFilePath;
}

function parseFile(fileContents: string): ParsedFile {
  const parsedFile = matter(fileContents);
  let html = marked(parsedFile.content);
  // html = sanitizeHTML(html);
  return { ...parsedFile, html };
}

// function sanitizeHTML(html: string) {
//   const element = new JSDOM(html).window.document.body;
//   element.innerText = html;
//   return element.innerHTML;
// }

function populateTemplate(template: string, parsedFile: ParsedFile) {
  return template
    .replace(/<!--CONTENT-->/i, parsedFile.html)
    .replace(/<!--TITLE-->/i, parsedFile.data.title);
}

async function saveFile(outPutFilePath: string, contents: string) {
  const directory = path.dirname(outPutFilePath);
  console.log("OutputFilePath: ", outPutFilePath);
  // console.log("Dir: ", directory);
  if (!fs.existsSync(outPutFilePath)) {
    fs.mkdir(directory, { recursive: true }, (err) => {
      if (err) throw err;
    });
  }
  fs.writeFileSync(outPutFilePath, contents);
}

app.listen(3000);
