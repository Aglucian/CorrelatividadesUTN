import fs from 'fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function run() {
    try {
        const data = await fs.readFile('Correlativas-plan-2023.pdf');
        const pdf = await pdfjsLib.getDocument({
            data: new Uint8Array(data),
            useSystemFonts: true,
            disableFontFace: true
        }).promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const text = textContent.items.map(item => item.str).join(' | ');
            fullText += `--- Page ${i} ---\n${text}\n\n`;
        }

        await fs.writeFile('debug_output_utf8.txt', fullText, 'utf-8');
        console.log('Wrote debug_output_utf8.txt');

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
