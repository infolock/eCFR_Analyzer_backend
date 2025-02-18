import fs from "fs";
import { parseStringPromise } from "xml2js";

export const findChapter = async (xmlFilePath, chapterNumber) => {
  try {
    const xmlData = fs.readFileSync(xmlFilePath, "utf8");
    const jsonData = await parseStringPromise(xmlData);
    const chapters = jsonData?.ECFR?.DIV1?.[0]?.DIV3 || [];
    const matchingChapter = chapters.find((ch) => ch["$"].N === chapterNumber);

    return matchingChapter;
  } catch (error) {
    console.error("Error searching for chapter:", error);
  }
};
