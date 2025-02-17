import { readFileSync, promises as fs } from "fs";
import axios from "axios";
import { join, dirname } from "path";
import { parseXML } from "./parse_xml.js";
import { fileURLToPath } from "url";

const API_URL = "https://www.ecfr.gov/api/versioner/v1";

const checkFileExistsAndHasData = async (filename = "titles.json") => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const filePath = join(__dirname, "../data", filename);

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

const getTitles = async () => {
  const titleFileExists = await checkFileExistsAndHasData("titles.json");

  if (titleFileExists) {
    return JSON.parse(readFileSync("data/titles.json", "utf8"));
  }

  const response = await axios.get(`${VERSIONER_API_URL}/titles`);
  return JSON.parse(JSON.stringify(response.data, null, 2));
};

const fetchTitleContent = async (titleNumber, date = "2025-02-10") => {
  const url = `${API_URL}/full/${date}/title-${titleNumber}.xml`;
  console.log("FETCHING URL: " + url);
  const response = await axios.get(url);
  return response.data;
};

// Parse XML and Count Words
// const parseAndCountWords = (data) => {
//   const str = data.replace(/\n+/g, " ").replace("-", " ").replace(/\s+/g, " ");

//   return str.split(/\s+/).length;
// };

(async () => {
  try {
    console.log("Fetching titles...");

    const titleData = await getTitles();

    titleData.titles.forEach(async (title) => {
      const xmlData = await fetchTitleContent(
        title.number,
        title.up_to_date_as_of
      );
      const xmlPath = `data/ecfr/title-${title.number}.xml`;

      fs.writeFileSync(`data/ecfr/title-${title.number}.xml`, xmlData);
      parseXML(xmlPath, `data/ecfr/title-${title.number}.txt`);
    });
    // const firstTitle = titles[1];

    //     console.log(`Processing Title ${firstTitle.number}...`);

    //     const xmlData = await fetchTitleContent(firstTitle.number);
    //     const xmlPath = `data/title-${firstTitle.number}.xml`;

    //     fs.writeFileSync(`data/title-${firstTitle.number}.xml`, xmlData);

    //     parseXML(xmlPath, `data/title-${firstTitle.number}.txt`, (titleData) => {
    //       const wordCount = parseAndCountWords(titleData);
    //       const wordCounts = [
    //         {
    //           title: firstTitle.number,
    //           wordCount,
    //         },
    //       ];

    //       fs.writeFileSync(
    //         "data/word_counts.json",
    //         JSON.stringify(wordCounts, null, 4)
    //       );
    //       console.log("Word counts saved successfully for the first title.");
    //     });
  } catch (error) {
    console.error("Error fetching or processing eCFR data:", error);
  }
})();
