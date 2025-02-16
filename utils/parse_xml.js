import fs from 'fs';
import xml2js from 'xml2js';

const extractText = (obj) => {
    if (typeof obj === 'string' || obj !== 'object') {
        return obj;
    }

    let text = '';

    for (const key in obj) {
        if (obj[key] instanceof Array) {
            text += obj[key].map(extractText).join('');
        } else {
            text += extractText(obj[key]);
        }
    }

    return text;
};

export const parseXML = (inputPath, outputPath, onComplete = () => {}) => {
    fs.readFile(inputPath, 'utf8', (_, xmlData) => {
        const parser = new xml2js.Parser();

        parser.parseString(xmlData, (_, result) => {
            const plainText = extractText(result);

            fs.writeFile(outputPath, plainText.trim(), 'utf8', (err) => {
                if (err) {
                    console.error('Error:', err);
                }
            });
            onComplete(plainText);
        });
    });
}