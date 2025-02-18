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

export const getWordCountForTitleChapter = async (
  xmlFilePath,
  chapterNumber
) => {
  const chapter = await findChapter(xmlFilePath, chapterNumber);

  if (!chapter) {
    return 0;
  }

  let totalWords = 0;

  const extractText = (element) => {
    if (typeof element === "string") {
      totalWords += element.split(/\s+/).length;
    } else if (Array.isArray(element)) {
      element.forEach(extractText);
    }
  };

  if (chapter.HEAD) {
    extractText(chapter.HEAD);
  }

  if (chapter.P) {
    extractText(chapter.P);
  }

  return totalWords;
};
