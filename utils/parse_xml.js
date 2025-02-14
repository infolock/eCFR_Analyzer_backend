import fs from 'fs';
import xml2js from 'xml2js';

const extractText = (obj) => {
    if (typeof obj === 'string') {
        return obj;
    }

    let text = '';

    if (typeof obj === 'object') {
        for (const key in obj) {
            if (obj[key] instanceof Array) {
                obj[key].forEach(item => {
                    text += extractText(item);
                });
            } else {
                text += extractText(obj[key]);
            }
        }
    }

    return text;
};

export const parseXML = (inputPath, outputPath, onComplete = () => {}) => {
    const xmlFilePath = inputPath;
    const outputFilePath = outputPath;

    fs.readFile(xmlFilePath, 'utf8', (_, xmlData) => {
        const parser = new xml2js.Parser();
        parser.parseString(xmlData, (_, result) => {
            const plainText = extractText(result);

            fs.writeFile(outputFilePath, plainText.trim(), 'utf8', (err) => {
                if (err) {
                    console.error('Error:', err);
                }
            });
            onComplete(plainText);
        });
    });
}