import {clear} from "node:console";
import fs from "node:fs";

let data = fs.readFileSync("./data.txt", "utf-8");

console.log(data);


console.log("\n" + "=".repeat(60));
console.log("START DECODING...\n");



const BRAILLE_MAP = {
    '100000': 'a', '110000': 'b', '100100': 'c', '100110': 'd', '100010': 'e',
    '110100': 'f', '110110': 'g', '110010': 'h', '010100': 'i', '010110': 'j',
    '101000': 'k', '111000': 'l', '101100': 'm', '101110': 'n', '101010': 'o',
    '111100': 'p', '111110': 'q', '111010': 'r', '011100': 's', '011110': 't',
    '101011': 'u', '111011': 'v', '010111': 'w', '101101': 'x', '101111': 'y',
    '111111': 'z', '000001': 'CAP', '001111': 'NUM'
};

// 1. Decode Braille
console.log("Decoding Braille...");
let base64Str = '';
let i = 0;
let isCapital = false;
let isNumber = false;
const numberMap = {
    '100000': '1', '110000': '2', '100100': '3', '100110': '4', '100010': '5',
    '110100': '6', '110110': '7', '010100': '8', '010110': '9', '101000': '0'
};

while (i < data.length) {
    const bits = data.slice(i, i + 6);
    if (bits.length !== 6) break;
    
    let char = BRAILLE_MAP[bits];
    
    if (char === 'CAP') {
        isCapital = true;
    } else if (char === 'NUM') {
        isNumber = true;
    } else if (isNumber && numberMap[bits]) {
        base64Str += numberMap[bits];
        isNumber = false;
    } else if (char) {
        base64Str += isCapital ? char.toUpperCase() : char;
        isCapital = false;
    }
    
    i += 6;
}
console.log("Base64:", base64Str.slice(0, 50) + "...");

// 2. Decode Base64
console.log("\nDecoding Base64...");
let rotText;
try {
    rotText = Buffer.from(base64Str, 'base64').toString('utf8');
    console.log("ROT text:", rotText.slice(0, 50) + "...");
} catch (e) {
    console.log("Base64 error:", e.message);
}

// 3. Decode ROT
if (rotText) {
    console.log("\n Decoding ROT...");
    
    // Frequency analysis
    const freq = {};
    for (let char of rotText.toLowerCase()) {
        if (/[a-z]/.test(char)) freq[char] = (freq[char] || 0) + 1;
    }
    
    const mostCommon = Object.entries(freq)
        .sort(([,a], [,b]) => b - a)[0][0];
    
    const shift = (mostCommon.charCodeAt(0) - 'e'.charCodeAt(0) + 26) % 26;
    console.log(`Shift: ${shift} ('${mostCommon}' -> 'e')`);
    
    // Apply ROT
    let finalText = rotText.replace(/[a-zA-Z]/g, char => {
        const base = char === char.toUpperCase() ? 65 : 97;
        return String.fromCharCode((char.charCodeAt(0) - base + shift) % 26 + base);
    });
    
    // 4. Save output.md
    fs.writeFileSync("output.md", finalText);
    
    console.log("\n COMPLETE!");
    console.log("Saved to output.md");
    console.log("\n" + finalText);
}