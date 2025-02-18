import express from "express";
// import fs from "fs";
import cors from "cors";
import axios from "axios";
import { readFileSync, writeFileSync, promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { findChapter } from "./utils/find_chapter_in_xml";

const ADMIN_API_URL = "https://www.ecfr.gov/api/admin/v1";
const VERSIONER_API_URL = "https://www.ecfr.gov/api/versioner/v1";
const app = express();

app.use(cors());
app.use(express.json());

const getTitles = async () => {
  const titleFileExists = checkFileExistsAndHasData("titles.json");

  if (titleFileExists) {
    return JSON.parse(readFileSync("data/titles.json", "utf8"));
  }

  const response = await axios.get(`${VERSIONER_API_URL}/titles`);
  return JSON.parse(JSON.stringify(response.data, null, 2));
};

const getAgency = async (name) => {
  const agencyData = await getAgencies();
  return agencyData.agencies.find((agency) => agency.name === name);
};

const getAgencies = async () => {
  const agencyFileExists = await checkFileExistsAndHasData("agencies.json");

  if (agencyFileExists) {
    return JSON.parse(readFileSync("data/agencies.json", "utf8"));
  }

  const response = await axios.get(`${ADMIN_API_URL}/agencies.json`);
  return JSON.parse(JSON.stringify(response.data, null, 2));
};

const checkFileExistsAndHasData = (filename = "titles.json") => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const filePath = join(__dirname, "data", filename);
  return fs.existsSync(filePath);
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

const getWordCountForTitle = (title, chapter) => {
  const titleXML = `ecfr/title-${title.number}`;
  if (!checkFileExistsAndHasData(titleXML)) {
    return 0;
  }

  const xmlPath = `data/ecfr/title-${title.number}.xml`;

  return findChapter(xmlPath, chapter);
};

app.get("/api/word_counts/:agency", async (req, res) => {
  const { agencyName } = req.params;
  if (!agencyName) {
    return res
      .status(400)
      .json({ error: "Bad Request: Please provide an Agency name" });
  }

  const agency = await getAgency(agencyName);
  if (!agency) {
    return res.status(404).json({
      error: "Agency Not Found",
    });
  }

  const agencyCFRList = await getCfrUsingAgency(agency);

  let totalWordCount = 0;

  res.json({
    agency: { ...agency },
    cfr: { ...agencyCFRList },
    wordCount: totalWordCount,
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
