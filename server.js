import express from "express";
// import fs from "fs";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getWordCountForTitleChapter } from "./utils/xml-utils.js";

const ADMIN_API_URL = "https://www.ecfr.gov/api/admin/v1";
const VERSIONER_API_URL = "https://www.ecfr.gov/api/versioner/v1";
const app = express();

app.use(cors());
app.use(express.json());

const getTitles = async () => {
  const titleFileExists = fs.existsSync("./data/titles.json");

  if (titleFileExists) {
    return JSON.parse(fs.readFileSync("data/titles.json", "utf8"));
  }

  const response = await axios.get(`${VERSIONER_API_URL}/titles`);
  return JSON.parse(JSON.stringify(response.data, null, 2));
};

const getAgency = async (slug) => {
  const agencyData = await getAgencies();
  return agencyData.agencies.find((agency) => agency.slug === slug);
};

const getAgencies = async () => {
  const agencyFileExists = await fs.existsSync("./data/agencies.json");

  if (agencyFileExists) {
    return JSON.parse(fs.readFileSync("data/agencies.json", "utf8"));
  }

  const response = await axios.get(`${ADMIN_API_URL}/agencies.json`);
  return JSON.parse(JSON.stringify(response.data, null, 2));
};

app.get("/api/agencies", async (_, res) => {
  const agencyData = await getAgencies();

  res.json(agencyData.agencies);
});

app.get("/api/agencies/:slug", async (req, res) => {
  const { slug } = req.params;
  const agencyData = await getAgencies();
  const targetAgency = agencyData.agencies.find(
    (agency) => agency.slug === slug
  );
  console.log("SLUG = " + slug);
  if (!targetAgency) {
    return res
      .status(404)
      .json({ error: "Agency with specified slug was Not Found!" });
  }

  res.json(targetAgency);
});

app.get("/api/titles", async (_, res) => {
  const titles = await getTitles();
  res.json(titles.titles);
});

const getCfrUsingAgency = async (agency) => {
  const agencyTitles = agency.cfr_references;
  const titleData = await getTitles();

  return agencyTitles.map((agencyTitle) => {
    const titleInfo = titleData.find(
      (title) => title.number === agencyTitle.title
    );

    if (titleInfo) {
      return {
        cfr_references: { ...agencyTitle },
        title: { ...titleInfo },
      };
    }
  });
};

const countWordsInTitleChapter = async (titleNumber, chapter) => {
  const countPath = `./data/word_count/title-${titleNumber}.txt`;

  if (fs.existsSync(countPath)) {
    return fs.readFileSync(countPath);
  }

  const xmlPath = `./data/ecfr/title-${titleNumber}.xml`;
  if (!fs.existsSync(xmlPath)) {
    console.log("File doesn't exist! File: " + xmlPath);
    return 0;
  }

  const totalCount = await getWordCountForTitleChapter(xmlPath, chapter);

  fs.writeFileSync(countPath, `${totalCount}`);

  return totalCount;
};

app.get("/api/word_counts/:agencySlug", async (req, res) => {
  const { agencySlug } = req.params;
  if (!agencySlug) {
    return res
      .status(400)
      .json({ error: "Bad Request: Please provide an Agency Slug" });
  }

  const agency = await getAgency(agencySlug);
  if (!agency) {
    return res.status(404).json({
      error: "Agency with Slug Not Found...",
    });
  }

  let totalWordCount = 0;

  for (const ref of agency.cfr_references) {
    if (ref && ref.title && ref.chapter) {
      totalWordCount += await countWordsInTitleChapter(ref.title, ref.chapter);
    }
  }

  res.json({
    wordCount: totalWordCount,
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
