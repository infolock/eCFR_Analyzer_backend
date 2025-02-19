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

  const extractText = (node) => {
    if (typeof node === "string") {
      totalWords += node.match(/\b\w+\b/g)?.length || 0;
    } else if (typeof node === "object") {
      Object.values(node).forEach(extractText);
    }
  };

  extractText(chapter);

  return totalWords;
};
