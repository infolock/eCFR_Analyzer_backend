import express from "express";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import { getWordCountForTitleChapter } from "./utils/xml-utils.js";

const ADMIN_API_URL = "https://www.ecfr.gov/api/admin/v1";
const VERSIONER_API_URL = "https://www.ecfr.gov/api/versioner/v1";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://ecfranalyzerfrontend-production.up.railway.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
      let count = await countWordsInTitleChapter(ref.title, ref.chapter);
      console.log("Count = " + count);
      console.log("Typeof Count = " + typeof count);
      totalWordCount += parseInt(count, 10);
    }
  }

  res.json({
    wordCount: totalWordCount,
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
