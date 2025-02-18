import express from "express";
// import fs from "fs";
import cors from "cors";
import axios from "axios";
import { readFileSync, writeFileSync, promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ADMIN_API_URL = "https://www.ecfr.gov/api/admin/v1";
const VERSIONER_API_URL = "https://www.ecfr.gov/api/versioner/v1";
const app = express();

app.use(cors());
app.use(express.json());

const getTitles = async () => {
  const titleFileExists = await checkFileExistsAndHasData("titles.json");

  if (titleFileExists) {
    return JSON.parse(readFileSync("data/titles.json", "utf8"));
  }

  const response = await axios.get(`${VERSIONER_API_URL}/titles`);
  return JSON.parse(JSON.stringify(response.data, null, 2));
};

const getAgencies = async () => {
  const agencyFileExists = await checkFileExistsAndHasData("agencies.json");

  if (agencyFileExists) {
    return JSON.parse(readFileSync("data/agencies.json", "utf8"));
  }

  const response = await axios.get(`${ADMIN_API_URL}/agencies.json`);
  return JSON.parse(JSON.stringify(response.data, null, 2));
};

const checkFileExistsAndHasData = async (filename = "titles.json") => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const filePath = join(__dirname, "data", filename);

  try {
    const data = await fs.readFile(filePath, "utf8");

    if (data.trim().length === 0) {
      console.log("File exists but is empty.");
      return false;
    }

    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("File does not exist.");
    } else {
      console.error("Error reading file:", error);
    }

    return false;
  }
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

app.get("/api/word_counts/:agency", async (req, res) => {
  const { agencyName } = req.params;
  if (!agencyName) {
    return res
      .status(400)
      .json({ error: "Bad Request: Please provide an Agency name" });
  }

  const agencyData = await getAgencies();
  const agency = agencyData.agencies.find(
    (agency) => agency.name === agencyName
  );

  if (!agency) {
    return res.status(404).json({ error: "Agency Not Found" });
  }

  const agencyTitles = agency.cfr_references;

  if (!agencyTitles.lengh) {
    return res.status(200).json({});
  }

  const titleData = await getTitles();

  const agencyTitleNames = agencyTitles.map((agencyTitle) => {
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

  res.json({
    agency: { ...agency },
    titles: { ...agencyTitleNames },
  });
});

app.get("/api/word_counts/:id?", (_, res) => {
  const { id } = req.params;

  if (id) {
    const title = titleData.find((title) => title.id === Number(id));
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
