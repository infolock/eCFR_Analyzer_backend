import express from "express";
// import fs from "fs";
import cors from "cors";
import axios from "axios";
import { readFileSync, writeFileSync, promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ADMIN_API_URL = 'https://www.ecfr.gov/api/admin/v1';
const VERSIONER_API_URL = 'https://www.ecfr.gov/api/versioner/v1';
const app = express();

app.use(cors());
app.use(express.json());

// let titleData = JSON.parse(
//     fs.readFileSync("data/titles.json", "utf8")
// );

// function analyzeWordCounts(data) {
//     const wordCounts = {};

//     for (const title of data.titles || []) {
//         const agency = title.agencies?.[0] || "Unknown";
//         const text = title.description || "";

//         if (!wordCounts[agency]) {
//             wordCounts[agency] = 0;
//         }
//         wordCounts[agency] += text.split(/\s+/).length;
//     }

//     return wordCounts;
// }

const checkFileExistsAndHasData = async (filename = 'titles.json') => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = join(__dirname, 'data', filename);

    try {
        const data = await fs.readFile(filePath, 'utf8');
        
        if (data.trim().length === 0) {
            console.log('File exists but is empty.');
            return false;
        }

        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('File does not exist.');
        } else {
            console.error('Error reading file:', error);
        }

        return false;
    }
};

app.get("/api/agencies", async (_, res) => {
    const fileExists = await checkFileExistsAndHasData('agencies.json');
    if (fileExists) {
        const data = JSON.parse(readFileSync("data/agencies.json", "utf8"));
        return res.json(data.agencies);
    }

    const response = await axios.get(`${ ADMIN_API_URL }/agencies.json`);
    const jsonData = JSON.stringify(response.data, null, 2); // Convert object to JSON string with indentation

    writeFileSync(`data/agencies.json`, jsonData);
    res.json(response.data.agencies);
});

app.get("/api/titles", async (_, res) => {
    const fileExists = await checkFileExistsAndHasData('titles.json');
    if (fileExists) {
        const data = JSON.parse(readFileSync("data/titles.json", "utf8"));
        return res.json(data.titles);
    }

    const response = await axios.get(`${ VERSIONER_API_URL }/titles`);
    const jsonData = JSON.stringify(response.data, null, 2); // Convert object to JSON string with indentation

    writeFileSync(`data/titles.json`, jsonData);
    res.json(response.data.titles);
});

app.get("/api/word_counts/:id?", (_, res) => {
    const { id } = req.params;

    if (id) {
        const title = titleData.find(title => title.id === Number(id)); 
        if (!title) {
            return res.status(404).json({ error: "Title not found" });
        }

        return res.json(analyzeWordCounts(title));
    }

    const wordCounts = analyzeWordCounts(titleData);
    res.json(wordCounts);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));