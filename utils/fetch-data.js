import fs from "fs";
import axios from "axios";
import { parseXML } from './parse_xml.js';

const API_URL = 'https://www.ecfr.gov/api/versioner/v1';

const fetchTitles = async () => {
    const response = await axios.get(`${API_URL}/titles`);
    return response.data.titles;
};

const fetchTitleContent = async (titleNumber, date = '2025-02-10') => {
    const response = await axios.get(`${API_URL}/full/${date}/title-${titleNumber}.xml`);
    return response.data;
};

// Parse XML and Count Words
const parseAndCountWords = (data) => {
    const str = data.replace(/\n+/g, ' ').replace('-', ' ').replace(/\s+/g, ' ');

    return str.split(/\s+/).length;
};

(async () => {
    try {
        console.log("Fetching titles...");

        const titles = await fetchTitles();
        const firstTitle = titles[1];

        console.log(`Processing Title ${firstTitle.number}...`);

        const xmlData = await fetchTitleContent(firstTitle.number);
        const xmlPath = `data/title-${firstTitle.number}.xml`;

        fs.writeFileSync(`data/title-${firstTitle.number}.xml`, xmlData);

        parseXML(xmlPath, `data/title-${firstTitle.number}.txt`, (titleData) => {
            const wordCount = parseAndCountWords(titleData);
            const wordCounts = [{
                title: firstTitle.number,
                wordCount
            }];

            fs.writeFileSync("data/word_counts.json", JSON.stringify(wordCounts, null, 4));
            console.log("Word counts saved successfully for the first title.");
        });
    } catch (error) {
        console.error("Error fetching or processing eCFR data:", error);
    }
})();
