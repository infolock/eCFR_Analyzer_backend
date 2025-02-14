import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let titleData = JSON.parse(
    fs.readFileSync("data/titles.json", "utf8")
);

function analyzeWordCounts(data) {
    const wordCounts = {};

    for (const title of data.titles || []) {
        const agency = title.agencies?.[0] || "Unknown";
        const text = title.description || "";

        if (!wordCounts[agency]) {
            wordCounts[agency] = 0;
        }
        wordCounts[agency] += text.split(/\s+/).length;
    }

    return wordCounts;
}

app.get("/api/word_counts", (req, res) => {
    const wordCounts = analyzeWordCounts(titleData);
    res.json(wordCounts);
});

app.get("/api/ecfr", (req, res) => {
    res.json(titleData);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));