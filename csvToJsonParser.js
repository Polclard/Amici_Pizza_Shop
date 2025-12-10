// ===========================================
// ES Module Синтакса (Со import)
// ===========================================
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Добивање на еквивалентот на __filename и __dirname за ES модули
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Имиња на влезни и излезни датотеки
const CSV_FILE = "result.csv";
const JSON_FILE = "menuData.json";

// ⚠️ КОРИГИРАНО: Ги вклучуваме сите 10 колони од вашиот CSV
const HEADERS = [
  "ID",
  "Name",
  "CategoryTitle", // Нова колона
  "CategoryKey",
  "Price30cm",
  "Price40cm",
  "Price50cm",
  "Tag",
  "IsSpecial",
  "imageURL", // Нова колона
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
 * Чита, парсира и трансформира CSV податоци во структуриран JSON формат на менито.
 */
function parseAndTransformCSV() {
  try {
    // 1. Читање на CSV датотеката
    const csvPath = path.join(process.cwd(), CSV_FILE);
    const csvText = fs.readFileSync(csvPath, "utf8");

    // 2. Едноставен парсер за CSV
    const lines = csvText.split("\n").filter((line) => line.trim() !== "");
    const rawData = [];

    // Прескокни го првиот ред (насловите)
    for (let i = 1; i < lines.length; i++) {
      // Користиме regex за да се справиме со запирките во податоци опкружени со наводници (како таговите)
      const values =
        lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || lines[i].split(",");

      // Понекогаш .match враќа +1 колона ако има празен стринг на крај.
      // Ќе се вратиме на поедноставна .split логика и ќе ја поправиме должината.

      const valuesSimple = lines[i]
        .split(",")
        .map((v) => v.trim().replace(/^"|"$/g, ""));

      if (valuesSimple.length !== HEADERS.length) {
        // Оваа порака сега треба да ви даде појасна слика ако некој ред е skip-нат
        console.warn(
          `[ПРЕСКОКНАТО] Ред ${i + 1} (${
            valuesSimple.length
          } колони). Очекувано: ${HEADERS.length}.`
        );
        continue;
      }

      const item = {};
      HEADERS.forEach((header, j) => {
        item[header] = valuesSimple[j];
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
        // Ја земаме патеката за слика директно од CSV-то
        imageURL: row.imageURL || "../images/pizza_placeholder.png",
      };

      // Проверка за цени
      if (p30 && p40 && p50) {
        item.prices = [p30, p40, p50];
      } else if (p30) {
        item.singlePrice = p30;
      }

      // Додавање на Tag и IsSpecial
      if (row.Tag) {
        item.tag = row.Tag;
        if (row.IsSpecial && row.IsSpecial.toLowerCase() === "true") {
          item.isSpecial = true;
        }
      }

      // Групирање
      if (!transformedData[categoryKey]) {
        transformedData[categoryKey] = {
          // Ја користиме CategoryTitle од CSV-то, но може да ја земеме и од categoryTitles мапата
          title:
            row.CategoryTitle || categoryTitles[categoryKey] || categoryKey,
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

// Извршување на функцијата
parseAndTransformCSV();
