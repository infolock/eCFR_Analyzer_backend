import fs from "fs";

export const findChapter = async (xmlFilePath, chapterNumber) => {
  const xmlData = fs.readFileSync(xmlFilePath, "utf8");
  const chapterRegex = new RegExp(
    `<DIV3 N="${chapterNumber}" TYPE="CHAPTER">([\s\S]*?)<\/DIV3>`,
    "g"
  );

  const match = chapterRegex.exec(xmlData);

  if (match) {
    return match[1];
  }
};

export const getWordCountForTitleChapter = async (
  xmlFilePath,
  chapterNumber
) => {
  let chapterText = await findChapter(xmlFilePath, chapterNumber);

  if (!chapterText) {
    return 0;
  }

  chapterText = chapterText.replace(/<[^>]+>/g, "");
  chapterText = chapterText.replace(/\n{2,}/g, "\n").trim();

  const wordCount = chapterText
    .split(/\s+/)
    .filter((word) => word.trim().length > 0).length;

  return wordCount;
};
