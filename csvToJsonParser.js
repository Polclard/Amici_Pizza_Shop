// ===========================================
// ES Module Синтакса (Со import)
// ===========================================
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; // Потребно за работа со __dirname во ES Modules

// Добивање на еквивалентот на __filename и __dirname за ES модули
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Имиња на влезни и излезни датотеки
const CSV_FILE = "result.csv";
const JSON_FILE = "menuData.json";

// Дефинирање на очекуваните наслови (HEADERS) од CSV датотеката
const HEADERS = [
  "ID",
  "Name",
  "CategoryKey",
  "Price30cm",
  "Price40cm",
  "Price50cm",
  "Tag",
  "IsSpecial",
];

// Преводи за наслови на категориите
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
    // 1. Читање на CSV датотеката
    // Користиме path.join(process.cwd(), ...) за да биде компатибилно со GitHub Actions
    const csvPath = path.join(process.cwd(), CSV_FILE);
    const csvText = fs.readFileSync(csvPath, "utf8");

    // 2. Едноставен парсер за CSV
    const lines = csvText.split("\n").filter((line) => line.trim() !== "");
    const rawData = [];

    // Прескокни го првиот ред (насловите)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());

      if (values.length !== HEADERS.length) {
        console.warn(
          `[ПРЕСКОКНАТО] Ред ${i + 1} поради несовпаѓање на колони: ${lines[i]}`
        );
        continue;
      }

      const item = {};
      HEADERS.forEach((header, j) => {
        item[header] = values[j];
      });
      rawData.push(item);
    }

    // 3. Трансформирање во структуриран JSON формат
    const transformedData = {};

    rawData.forEach((row) => {
      const categoryKey = row.CategoryKey;
      if (!categoryKey) return;

      const p30 = parseInt(row.Price30cm);
      const p40 = parseInt(row.Price40cm);
      const p50 = parseInt(row.Price50cm);

      const item = {
        id: parseInt(row.ID),
        name: row.Name,
        imageURL: "../images/pizza_placeholder.png",
      };

      if (p30 && p40 && p50) {
        item.prices = [p30, p40, p50];
      } else if (p30) {
        item.singlePrice = p30;
      }

      if (row.Tag) {
        item.tag = row.Tag;
        if (row.IsSpecial && row.IsSpecial.toLowerCase() === "true") {
          item.isSpecial = true;
        }
      }

      // Групирање
      if (!transformedData[categoryKey]) {
        transformedData[categoryKey] = {
          title: categoryTitles[categoryKey] || categoryKey,
          items: [],
        };
      }
      transformedData[categoryKey].items.push(item);
    });

    // 4. Финална JSON структура
    const finalJsonOutput = {
      menuData: transformedData,
    };

    // 5. Запишување на JSON датотеката
    const jsonPath = path.join(process.cwd(), JSON_FILE);
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(finalJsonOutput, null, 2),
      "utf8"
    );

    console.log(
      `✅ Успешно генериран ${JSON_FILE}. Вкупно ставки: ${rawData.length}`
    );
  } catch (error) {
    console.error(`❌ Грешка при извршување на парсерот: ${error.message}`);
    if (error.code === "ENOENT") {
      console.error(
        `Проверете дали датотеката ${CSV_FILE} постои во коренот на работниот директориум.`
      );
    }
  }
}

// Извршување на функцијата кога фајлот се повикува директно како ES модул
parseAndTransformCSV();
