import fs from "node:fs";

let data = fs.readFileSync("./data.txt", "utf-8");

console.log("\n" + "=".repeat(60));
console.log("START DECODING...\n");

const BRAILLE_MAP = {
    '100000': 'a', '110000': 'b', '100100': 'c', '100110': 'd', '100010': 'e',
    '110100': 'f', '110110': 'g', '110010': 'h', '010100': 'i', '010110': 'j',
    '101000': 'k', '111000': 'l', '101100': 'm', '101110': 'n', '101010': 'o',
    '111100': 'p', '111110': 'q', '111010': 'r', '011100': 's', '011110': 't',
    '101001': 'u', '111001': 'v', '010111': 'w', '101101': 'x', '101111': 'y',
    '101011': 'z',
    '001010': '/', '011010': '+', '011011': '=', '111111': '=', '000111': '=' 
};

const NUM_MAP = {
    'a': '1', 'b': '2', 'c': '3', 'd': '4', 'e': '5',
    'f': '6', 'g': '7', 'h': '8', 'i': '9', 'j': '0'
};

// 1. Decode Braille
const lines = data.split('\n');
let base64Str = '';
let isCapital = false;
let isNum = false;

for (const line of lines) {
    const clean = line.replace(/ /g, ''); 
    let i = 0;
    while (i < clean.length) {
        const bits = clean.slice(i, i + 6);
        if (bits.length !== 6) break;

        if (bits === '000001') {
            isCapital = true;
        } else if (bits === '001111') {
            isNum = true;
        } else {
            let char = BRAILLE_MAP[bits];
            if (char !== undefined) {
                if (isNum) {
                    base64Str += NUM_MAP[char] || char;
                    isNum = false; 
                } else if (isCapital) {
                    base64Str += char.toUpperCase();
                    isCapital = false; 
                } else {
                    base64Str += char;
                }
            }
        }
        i += 6;
    }
}

console.log("Base64 (first 100 chars):", base64Str.slice(0, 100));

// 2. Decode Base64
console.log("\nDecoding Base64...");
let rotText;
try {
    rotText = Buffer.from(base64Str, 'base64').toString('utf8');
    console.log("ROT text (first 100 chars):", rotText.slice(0, 100).replace(/\n/g, ' '));
} catch (e) {
    console.error("Base64 error:", e.message);
    process.exit(1);
}

// 3. Decode ROT 
const COMMON_WORDS = new Set([
    'the','and','of','to','a','in','is','it','you','that','he','was',
    'for','on','are','with','as','i','his','they','be','at','one','have',
    'this','from','or','had','by','not','but','we','what','all','were',
    'when','your','can','said','there','use','an','each','she','which','do',
    'how','their','if','will','up','other','about','out','many','then','them',
    'so','some','her','would','make','like','him','into','time','has','look',
    'two','more','go','see','no','way','could','my','than','been','its','who',
    'now','did','get','may','part', 'me', 'love', 'day', 'night', 'light',
    'heart', 'life', 'eyes', 'sky', 'dream', 'breath', 'sea', 'wind', 'hand',
    'code', 'bug', 'error', 'screen'
]);

function scoreText(text) {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    return words.filter(w => COMMON_WORDS.has(w)).length;
}

let bestShift = 0;
let bestScore = -1;
let bestText = '';

for (let s = 0; s < 26; s++) {
    const attempt = rotText.replace(/[a-zA-Z]/g, char => {
        const base = char >= 'a' ? 97 : 65;
        return String.fromCharCode((char.charCodeAt(0) - base + s) % 26 + base);
    });
    const score = scoreText(attempt);
    if (score > bestScore) {
        bestScore = score;
        bestShift = s;
        bestText = attempt;
    }
}

console.log(`\n✓ Best shift: ${bestShift} (score=${bestScore})`);

// 4. Format Output
const title = "# Decoded Poem\n\n";
const poemLines = bestText
    .split(/\n/)
    .map(l => l.trim())
    .join('\n');

const mdContent = title + poemLines + '\n';

fs.writeFileSync("output.md", mdContent, 'utf8');

console.log("\nCOMPLETE! Saved to output.md");
console.log("\n" + mdContent);