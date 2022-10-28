import axios from "axios";
import { secureHeapUsed } from "crypto";
import { JSDOM } from "jsdom";
import { promises as fs, existsSync, mkdirSync } from 'fs';
import js_beautify from "js-beautify";

const BASE_URL = "https://steam.melvoridle.com";
const SCRIPT_URL = "/assets/js/built/";
const SCRAPE_DIR = "out/";

const action = process.argv.includes("scrape") ? 
    "SCRAPE" : process.argv.includes("jsdoc") ? 
    "JSDOC" : null;

if(!action) {
    console.error(
        `No action specified.
        Run 'node index.js scrape' to scrape for Melvor script files 
        or 'node index.js jsdoc to generate jsdoc from the scraped files`);
    process.exit(1);
}

const scrape = async () => {
    const req = await axios.get(BASE_URL);
    const htmlText = req.data;
    const dom = new JSDOM(htmlText);
    const document = dom.window.document;
    const regex = /assets\/js\/built\/(.*)\.js/i;

    const scripts = Array
    .from(document.scripts)
    .map(s => s.src)
    .filter(s => s.includes("/js/built/"))
    .map(s => regex.exec(s)[1])
    .map(s => ({ name: s, fileName: `${s}.js` }));

    console.log(`Found ${scripts.length} files, writing to out/`);

    if(!existsSync(SCRAPE_DIR))
        mkdirSync(SCRAPE_DIR);

    let i = 1;

    for(const script of scripts) {
        console.log(`Writing ${script.fileName} (${i}/${scripts.length})`);
        const req = await axios.get(`${BASE_URL}${SCRIPT_URL}${script.fileName}`);
        await fs.writeFile(`${SCRAPE_DIR}${script.fileName}`, js_beautify(req.data));
        i++;
    }
}

const jsdoc = () => {

}

switch(action) {
    case "SCRAPE":
        scrape();
        break;
    case "JSDOC":
        jsdoc();
        break;
    default:
        break;
}

