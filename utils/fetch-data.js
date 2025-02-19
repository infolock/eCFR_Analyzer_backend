import fs from "fs";
import axios from "axios";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const API_URL = "https://www.ecfr.gov/api/versioner/v1";
const VERSIONER_API_URL = "https://www.ecfr.gov/api/versioner/v1";

const checkFileExistsAndHasData = (filename = "titles.json") => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const filePath = join(__dirname, "../data", filename);
  return fs.existsSync(filePath);
};

const getTitles = async () => {
  try {
    const titleFileExists = checkFileExistsAndHasData("titles.json");
    if (titleFileExists) {
      return await JSON.parse(fs.readFileSync("data/titles.json", "utf8"));
    }
  } catch (error) {
    console.log("Error checkFileExistsAndHasData!");
    console.log(error);
  }

  try {
    const response = await axios.get(`${VERSIONER_API_URL}/titles`);
    return JSON.parse(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("Error fetching list of titles!");
    console.log(error);
  }
};

const fetchTitleContent = async (titleNumber, date = "2025-02-10") => {
  const url = `${API_URL}/full/${date}/title-${titleNumber}.xml`;
  const response = await axios.get(url);
  return response.data;
};

const fetchData = async () => {
  const retryQueue = [];

  console.log("Fetching titles...");
  const titleData = await getTitles();

  for (const title of titleData.titles) {
    // reserved titles aren't allowed...
    if (
      title.reserved ||
      checkFileExistsAndHasData(`ecfr/title-${title.number}.xml`)
    ) {
      console.log(
        "Skipping fetch for " + title.number + " (" + title.name + ")"
      );
      continue;
    }
    const xmlPath = `data/ecfr/title-${title.number}.xml`;
    try {
      const xmlData = await fetchTitleContent(
        title.number,
        title.up_to_date_as_of
      );
      if (!xmlData) {
        console.log(
          "FAILED to fetch data for: " + title.number + " (" + title.name + ")"
        );
        continue;
      }

      fs.writeFileSync(xmlPath, xmlData);
    } catch (error) {
      console.log(
        "Failed to fetch title: " + title.number + " (" + title.name + ")"
      );
      retryQueue.push(title);
    }
  }
  return retryQueue;
};

const MAX_RETRIES = 100;
const download = async (currentRetry = 0) => {
  if (currentRetry === MAX_RETRIES) {
    return;
  }

  const retryQueue = await fetchData();
  if (!retryQueue || !retryQueue.length) {
    return;
  }

  // if we have retries, wait 5 seconds before we try again...

  console.log("Throttle prevented all files from being download immediately.");
  console.log("waiting 5 seconds and retrying for remaining items...");

  setTimeout(async () => {
    await download(currentRetry + 1);
  }, 5000);
};

download();
