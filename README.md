# Simple Static Site Generator

This is a simple static site generator. It is meant to take a properly structured directory containing
markdown files into and generate html pages.

The frontend uses basic ```html```, ```css``` and ```javascript(typescript)``` whilst the backend ```node``` server makes use of various libraries [discussed here](#libraries-used "More information on libraries used in the backend").

## Table of Contents:



- [Description](#description "Brief description")
- [How to Use](#how-to-use "Details on how to use the site") :
  - [Dragging and Dropping](#1-dragging-and-dropping "Selecting folder from the file explorer via dragging and dropping")
  - [Selecting from File Explorer](#2-selecting-from-file-explorer "Selecting folder from the file explorer via the input element")
  - [Folder Structure](#folder-structure "Rules on how the folder must be structured")
  - [Unsuccessful Generation](#unsuccessful-generation "Unsuccessful generation scenerio description")
  - [Successful Generation](#successful-generation "Successful generation scenerio description")
- [Site Generation Process](#site-generation-process "More details on the entire generation process") :
  - [Frontend File Parsing](#frontend-file-parsing "How files are parsed on the frontend")
  - [Backend Restful Endpoints](#backend-restful-endpoints "Details on the backend endpoints")
  - [Handling Images](#handling-images "How the images are handled")
- [Libraries Used](#libraries-used "List of the libraries this project makes use of") :
  - [Express](#1-express "More on Express usage")
  - [Gray-Matter](#2-gray-matter "More on Gray-Matter usage")
  - [Marked](#3-marked "More on marked usage")
  - [Multer](#4-multer "More on multer usage")
  - [JSDOM](#5-jsdom "More on JSDOM usage")
  - [Sanitize-HTML](#6-sanitize-html "More on Sanitize-HTML usage")
  - [JSZIP](#7-jszip "More on JSZIP usage")
- [Limitations](#setting-up "Steps to follow to setup project locally")
- [Possible Improvements](#setting-up "Steps to follow to setup project locally")
- [Installation](#installation-instructions "Installation instructions")
- [Usage](#usage "Usage")
- [References/Credits](#referencescredits "Credits")

## Description



Static site generation is the process of generating static HTML webpages by using a set of templates and populating them with data. A static site generator is a tool used to achieve this.

This simple tool is used to create a website that supports a homepage, any number of articles as well as some supporting pages (such as an about page and error pages). It does so by populating the existing templates using data extracted from the markdown files provided by the user.

## How to use



<br>

![Static Site generator Home](./ssg-home.png "Simple Static Site Generator Home Page")
The site requires a structured folder ([see here](#folder-structure "More on folder structure")) with the relevant markdown files to generate the site. The files can be supplied either by:

1. Dragging and dropping the files
1. Selecting the files from the input element.

### 1. Dragging and Dropping



**The folder containing the relevant files can be dragged and dropped in the designated area to complete the process.**

![Drag-1](./ssg-drag1.png "Drag folder from explorer window")

**When you drag over the relevant area, the border turns green indicating it is droppable.**

![Drag-2](./ssg-drag2.png "On drag-over, the droppable-area's border turns teal")

<br>

### 2. Selecting from File Explorer



Another option available is to simply select from your file explorer by clicking "Choose File":

After clicking `Choose File`, select the relevant directory from file explorer window.

![Input-1](./ssg-explorer1.png "Select the relevant parent folder housing all your files from the file explorer")

A confirmation prompt will display the number of files selected

![Input-2](./ssg-explorer2.png "A confirmation prompt is triggered showing number of files selected")

To note: Only folders can be selected. Any files that are dragged and dropped will be rejected

<br>

### Unsuccessful Generation



If the folder structure is not valid, a prompt will display all the issues via a message containing the files that failed the validity check as well as their locations.

![Unsuccessful](./unsuccessful.png "Unsuccessful")

### Successful Generation



If the folder adheres to the folder structure specifications, the site will be generated and can be previewed within an `iframe`.
![Successful](./successful.png "Successful")

After site generation, a new link will be appended on the navbar before the documentation link. Clicking this will take you to the home page of your site.

![Visit Site Generated](./visit-site-generated.png "Visit Site Generated")

Example site:
!["Example site"](./example-site.png "Example site")

The generated site can also be downloaded.
!["Download site1"](./download-site1.png "Download site")
!["Download site2"](./download-site2.png "Download site from generated site menu")

!["Download site3"](./download-site3.png "Message notifiying user how to make use of site files")
!["Download site4"](./download-site4.png "saving website.zip")
<br>
<br>

#### Folder Structure



The folder provided should be organized in the following way:

![File Structure](./SSG-Folder-Structure.jpg "File Structure")

The main directory can have **ANY** name.

The main directory should have up to 4 entries:

- A home markdown file (**Mandatory**).
- An about markdown file.
- An articles folder with article markdown files.
- An images folder with images.

The files must meet the following requirements:

- Home Markdown File
  - The file name **MUST** be "home.md" but this is case insensitive.
  - This is a required file.
- About Markdown File
  - The file name **MUST** be "about.md" but this is case insensitive.
- Article Markdown Files
  - The articles can have any name **EXCEPT** `home.md` and `about.md`.
- Images
  - Any image referenced from the other markdown files must be placed in this directory or referenced online, meaning they are already hosted elsewhere.

**To note:**

- Any additional directories aside from `articles` and `images` will be ignored.
  - e.g in `MARKDOWN-FOLDER > VIDEOS`, "videos" will be ignored.
- Any additional files, for example `.txt, .xlsx, .exe files etc` will be flagged and the user notified.
  - Only `(.md|.jpg|.jpeg|.png|.gif)` file extensions are allowed.

<br>
<br>

## Site Generation Process

### Frontend File Parsing



After the user drops/selects the markdown main directory, their contents are parsed and organized, using the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API "File System Access API MDN documentation"), into an object of type:

```typescript
interface Markdown {
  home: MarkdownFile;
  about: MarkdownFile;
  articles?: MarkdownFile[];
  images?: File[];
}
```

```typescript
interface MarkdownFile {
  name: string;
  content: string;
}
```

...as well as regular [File](https://developer.mozilla.org/en-US/docs/Web/API/File "MDN File Definition") objects in the case of the images.

The relevant file information is extracted and stored in a `MarkdownFile` object. This is done to ensure only relevant information is sent to the node server (only the front-matter and contents).

The purpose of this is to convert the contents of each file, except the images ([see here](#handling-images "How images are handled")), into a string in order to stringify and send the populated `Markdown` object to the node server for site generation.

As the folder contents are being parsed, they are checked for folder structure validity. In case any [discrepancies](#folder-structure "More on valid folder structure") are detected, the user will be notified via an alert that shows the names and paths of all files that failed the validity check.

### Backend Restful Endpoints



The backend is an express server with the following endpoints:

- The `("/")` endpoint sends the `index.html` page which is the main site.

- The `("/images")` endpoint receives images sent from the front-end and [handles them](#handling-images "How images are handled").

- The `("/markdown")` endpoint receives the markdown files' content which then go through the following procedure:
  1. The object's keys are obtained using `Object.keys()`. This will make access to each [Markdown property](#site-generation-process "Markdown type location") available through a loop.
  1. The order of the keys array is manipulated to make the `articles` property the first element. This is done so that the [articles are parsed first](#5-jsdom "Further explanation for parsing articles first") for an accurate generation of nav-links.
  1. The front-matter is parsed using [gray-matter](#2-gray-matter "More about Gray-matter").
  1. The contents are parsed into HTML using [marked](#3-marked "More about marked") and immediately [sanitized](#6-sanitize-html "More about sanitize-html").
  1. Due to the altered order of the keys, the articles are the first to get parsed and are then used to create an accurate sidebar which is then appended to each before the resultant html is saved.
  1. For the other files, the appropriate template is then populated using the clean html as well as the accurate sidebar.

- The `("/home")` endpoint sends the homepage of the generated site.

- The `("/download")` endpoint will create an archive using [JSZIP](#7-jszip "More about JSZIP") with the following folder structure:

  ```
        Generated Website:
                  |_public:
                        |_styles.css
                  |_dist:
                        |_templates:
                          |_home:
                                |_home.html
                                |_script.js
                          |_about:
                                |_about.html
                                |_script.js
                          |_error:
                                |_404.html
                                |_script.js
                          |_articles
                            ...
                          |_images
                            ...
  ```

This archive contains the generated site's `.html` , `.js` and `.css` files.


### Handling Images



Due to this being a simple site generator, the images are stored locally on the backend's file system. For a bigger project, a file server to store and serve the images would be preferable.

The images are sent first before the contents of the other files. They are received and stored using [Multer](#multer "More about Multer").
<br>
<br>

### Libraries Used



#### 1. Express

Express is a minimalist web framework used to expose two end-points that cater to transfering the markdown information, as well any images included, to the backend for site generation.

More information can be found [here](https://expressjs.com/).
<br>
<br>

#### 2. Gray-Matter

Gray-Matter is a library used to parse the [front-matter](https://www.scribendi.com/advice/front_matter.en.html "What is front-matter?") from the markdown files (if available). This information is then used to populate the templates during site generation, for example, the title, date, author etc can all be specified.

More information can be found [here](https://www.npmjs.com/package/gray-matter "Gray-Matter documentation").
<br>
<br>

#### 3. Marked

Marked is a javascript library used to quickly parse markdown into HTML.

The content received from the front-end simply contains the stringified contents of the markdown files. This is parsed by marked after [gray-matter](#2-gray-matter "More about gray-matter") parses the contents' front-matter.

**Important: It does not sanitize the HTML that it outputs, therefore [sanitization](#6-sanitize-html "Sanitize-HTML library") was done manually.**
<br>
<br>

#### 4. Multer

Multer is a node.js middleware that is handles `multipart/form-data`.

It was used to handle images sent from the front-end (as form data) and store them appropriately. A big pro of using it was the control it allows the developer to exert over aspects such as storage management, maximum number of images that can be sent etc.

More information about Multer can be found [here](https://www.npmjs.com/package/multer "Multer documentation").
<br>
<br>

#### 5. JSDOM

JSDOM is a pure-JavaScript implementation of many web standards, notably the WHATWG DOM and HTML Standards.

After all the articles are parsed (meaning at this stage all the articles are known), it was used to append links to each article onto each template. This ensures that all pages are connected and ready to be served from just the home page.

More about JSDOM can be found [here](https://www.npmjs.com/package/jsdom "JSDOM documentation").
<br>
<br>

#### 6. Sanitize-HTML

Sanitize-HTML is, as its name suggests, a simple HTML sanitizer.

It was used to ensure no malicious code ends up being parsed. It was also chosen because of its robust customization options.

More about sanitize-html can be found [here](https://www.npmjs.com/package/sanitize-html "Sanitize-html documentaion")

#### 7. JSZIP
JSZIP is a library for creating, reading and editing .zip files with JavaScript.

It was used to create a [zip archive](#backend-restful-endpoints "More on the zip file's structure") consisiting of the generated site's files that is then sent to the user for download.

A temporary archive is written on the file system after creating it using JSZIP. The contents are then

More about JSZIP can be found [here](https://www.npmjs.com/package/jszip "JSZIP documentation").

## Limitations

So far the files generated, as well as images, are stored locally on the file system. This leads to a few problems:

1. Due to storing files on the file server, the amount of storage available is limited. A file server/bucket or database for persistence. This is somewhat alleviated by the short life-span of the generated files but is bad for scalability.

1. When the server is restarted, any generated files that may have been stored are lost.

1. Possible overwriting of generated files due to similar naming conventions.

## Possible Improvements

1. Instead of using the file system as a means of storage, a bucket or database can be used instead.

1. Generation of a unique identifier that can be used to name and link files generated by a user to prevent overwriting.

    - For example, prefixing a random id ( like ``2fe0e0e8`` ) to the generated files and returning these ids to the users that can then be used to access their user-specific files.

## Installation Instructions

```
git clone https://github.com/Ace1012/simple-static-site-generator.git
npm install
```

## Usage

```
npm run start
```
## References/Credits

- Project's foundation was an inspiration from [Joel Codes](https://youtu.be/NPgg3rpZ_RU "Make your own custom STATIC SITE GENERATOR with NodeJS | JavaScript").
