import {clear} from "node:console";
import fs from "node:fs"

let data = fs.readFileSync("./data.txt", "uft-8");

console.log(data);