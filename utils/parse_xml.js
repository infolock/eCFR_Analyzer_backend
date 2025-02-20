import fs from "fs";
import xml2js from "xml2js";

const extractText = (obj) => {
  if (typeof obj === "string" || obj !== "object") {
    return obj;
  }

  let text = "";

  for (const key in obj) {
    if (obj[key] instanceof Array) {
      text += obj[key].map(extractText).join("");
    } else {
      text += extractText(obj[key]);
    }
  }

  return text;
};

export const parseXML = (inputPath, outputPath, onComplete = () => {}) => {
  fs.readFile(inputPath, "utf8", (_, xmlData) => {
    const parser = new xml2js.Parser();

    parser.parseString(xmlData, (_, result) => {
      const plainText = extractText(result);

      fs.writeFile(outputPath, plainText.trim(), "utf8", (err) => {
        if (err) {
          console.error("Error:", err);
        }
      });
      onComplete(plainText);
    });
  });
};

const romanToInteger = (roman) => {
  const romanMap = new Map([
    ["I", 1],
    ["V", 5],
    ["X", 10],
    ["L", 50],
    ["C", 100],
    ["D", 500],
    ["M", 1000],
  ]);

  let result = 0;
  let previousValue = 0;

  for (let i = roman.length - 1; i >= 0; i--) {
    const currentValue = romanMap.get(roman[i]);

    if (currentValue < previousValue) {
      result -= currentValue;
    } else {
      result += currentValue;
    }
    previousValue = currentValue;
  }
  return result;
};

export const parseChapterFromXML = (
  xmlData,
  chapter,
  onComplete = () => {}
) => {
  const OPENING_CHAPTER_REGEX = /<DIV3 N="[A-Z]+" TYPE="CHAPTER">/;
  const parseText = (obj) => {
    if (typeof obj === "string") {
      return obj;
    }

    let result = "";

    for (const key in obj) {
      if (obj[key] instanceof Array) {
        result += obj[key].map(parseText).join("");
      } else {
        result += parseText(obj[key]);
      }
    }

    return result;
  };

  const temp = xmlData.split(OPENING_CHAPTER_REGEX);
  const actualNum = romanToInteger(chapter);
  let computed = temp[0];
  computed += `<DIV3 N="${chapter}" TYPE="CHAPTER">`;
  computed += temp[actualNum];
  computed += `</DIV1></ECFR>`;

  const parser = new xml2js.Parser();

  parser.parseString(computed, (_, result) => {
    const xmlSection = extractText(result);

    onComplete(parseText(xmlSection));
  });
};
