// Користење на вградениот File System модул
const fs = require("fs");
const path = require("path");

const CSV_FILE = "result.csv";
const JSON_FILE = "menuData.json";

// Дефинирајте ги имињата на колоните од CSV датотеката
const HEADERS = [
  "ID",
  "Name",
  "Price30cm",
  "Price40cm",
  "Price50cm",
  "CategoryKey",
  "Tag",
  "IsSpecial",
];

// Преводи за наслови на категориите (за потребите на JSON структурата)
const categoryTitles = {
  classics: "Класични Пици",
  veggie: "Вегетаријански Пици",
  gourmet: "Гурмански Пици",
  premium: "Премиум Пици",
  others: "Пастрмалија",
  pizza_slices: "Пица на парче",
};

/**
 * Чита, парсира и трансформира CSV податоци во JSON формат на менито.
 */
export function parseAndTransformCSV() {
  try {
    // 1. Читање на CSV датотеката
    const csvPath = path.resolve(__dirname, CSV_FILE);
    const csvText = fs.readFileSync(csvPath, "utf8");

    // 2. Едноставен парсер за CSV (прескокнување на првиот ред со наслови)
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

      // Конвертирање на цени и ID во броеви
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
        // Во JSON-от ги зачувуваме директните вредности од тагот
        item.tag = row.Tag;
        if (row.IsSpecial === "true") {
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

    // 4. Структурата на менито да биде објект со клуч "menuData"
    const finalJsonOutput = {
      menuData: transformedData,
    };

    // 5. Запишување на JSON датотеката (презапишување ако постои)
    const jsonPath = path.resolve(__dirname, JSON_FILE);
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(finalJsonOutput, null, 2),
      "utf8"
    );

    console.log(
      `✅ Успешно генериран ${JSON_FILE}. Број на ставки: ${rawData.length}`
    );
  } catch (error) {
    console.error(`❌ Грешка при извршување на парсерот: ${error.message}`);
    if (error.code === "ENOENT") {
      console.error(`Проверете дали датотеката ${CSV_FILE} постои.`);
    }
  }
}
