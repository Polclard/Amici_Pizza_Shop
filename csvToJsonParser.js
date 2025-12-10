import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = "result.csv";
const JSON_FILE = "menuData.json";

const HEADERS = [
  "ID",
  "Name",
  "CategoryTitle",
  "CategoryKey",
  "Price30cm",
  "Price40cm",
  "Price50cm",
  "Tag",
  "IsSpecial",
  "imageURL",
];

const categoryTitles = {
  classics: "Класични Пици",
  veggie: "Вегетаријански Пици",
  gourmet: "Гурмански Пици",
  premium: "Премиум Пици",
  others: "Пастрмалија",
  pizza_slices: "Пица на парче",
};

/**
 * Чита, парсира и трансформира CSV податоци во структуриран JSON формат на менито.
 */
function parseAndTransformCSV() {
  try {
    const csvPath = path.join(process.cwd(), CSV_FILE);
    const csvText = fs.readFileSync(csvPath, "utf8");

    const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
    const rawData = [];

    if (lines.length <= 1) {
      console.warn(
        `Влезната датотека ${CSV_FILE} е празна или содржи само наслови.`
      );
      const emptyOutput = { menuData: {} };
      fs.writeFileSync(
        path.join(process.cwd(), JSON_FILE),
        JSON.stringify(emptyOutput, null, 2),
        "utf8"
      );
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const valuesSimple = lines[i]
        .split(",")
        .map((v) => v.trim().replace(/^"|"$/g, ""));

      const item = {};

      const maxColumns = Math.min(valuesSimple.length, HEADERS.length);

      for (let j = 0; j < maxColumns; j++) {
        item[HEADERS[j]] = valuesSimple[j];
      }

      if (!item.ID || !item.CategoryKey) {
        console.warn(
          `[ПРЕСКОКНАТО] Ред ${i + 1}: Нема валиден ID или CategoryKey. Ред: ${
            lines[i]
          }`
        );
        continue;
      }

      rawData.push(item);
    }

    const transformedData = {};

    rawData.forEach((row) => {
      const categoryKey = row.CategoryKey;

      const p30 = parseInt(row.Price30cm);
      const p40 = parseInt(row.Price40cm);
      const p50 = parseInt(row.Price50cm);

      const item = {
        id: parseInt(row.ID),
        name: row.Name,
        imageURL: row.imageURL || "../images/pizza_placeholder.png",
      };

      if (p30 && p40 && p50) {
        item.prices = [p30, p40, p50];
      } else if (p30) {
        item.singlePrice = p30;
      } else {
        console.warn(
          `[ПРЕСКОКНАТО АРТИКАЛ] ID ${row.ID}: Нема дефинирана цена.`
        );
        return;
      }

      if (row.Tag) {
        item.tag = row.Tag;
      }
      if (row.IsSpecial && row.IsSpecial.toLowerCase() === "true") {
        item.isSpecial = true;
      }

      if (!transformedData[categoryKey]) {
        transformedData[categoryKey] = {
          title:
            row.CategoryTitle || categoryTitles[categoryKey] || categoryKey,
          items: [],
        };
      }
      transformedData[categoryKey].items.push(item);
    });

    const finalJsonOutput = {
      menuData: transformedData,
    };

    const jsonPath = path.join(process.cwd(), JSON_FILE);
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(finalJsonOutput, null, 2),
      "utf8"
    );

    console.log(
      `✅ Успешно генериран ${JSON_FILE}. Вкупно обработени ставки: ${rawData.length}`
    );
  } catch (error) {
    console.error(
      `❌ Фатална Грешка при извршување на парсерот: ${error.message}`
    );
    if (error.code === "ENOENT") {
      console.error(
        `Проверете дали датотеката ${CSV_FILE} постои во коренот на работниот директориум.`
      );
    }
  }
}

parseAndTransformCSV();
