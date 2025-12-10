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

// ⚠️ ФИНАЛИЗИРАНИ HEADERS: Ги вклучува сите 10 колони од вашиот CSV
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
    const csvPath = path.join(process.cwd(), CSV_FILE);
    const csvText = fs.readFileSync(csvPath, "utf8");

    // Голем проблем кај CSV-то од GitHub е што има празни редови и празен знак на крај
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
    const rawData = [];

    // Ако има само еден ред (наслови), заврши
    if (lines.length <= 1) {
      console.warn(
        `Влезната датотека ${CSV_FILE} е празна или содржи само наслови.`
      );
      // Направи празен JSON и продолжи
      const emptyOutput = { menuData: {} };
      fs.writeFileSync(
        path.join(process.cwd(), JSON_FILE),
        JSON.stringify(emptyOutput, null, 2),
        "utf8"
      );
      return;
    }

    // Прескокни го првиот ред (насловите)
    for (let i = 1; i < lines.length; i++) {
      // Користиме поедноставна split логика и ги чистиме наводниците околу вредностите
      const valuesSimple = lines[i]
        .split(",")
        .map((v) => v.trim().replace(/^"|"$/g, ""));

      // ⚠️ КОМПЕНЗАЦИЈА ЗА РАЗЛИЧНА ДОЛЖИНА: Ги вчитуваме сите податоци до 10-тата колона.
      // Не ја прекинуваме обработката ако должината не е точна.

      const item = {};

      // Мапирање на вредностите: користиме Math.min за да не одиме надвор од границите на низата
      const maxColumns = Math.min(valuesSimple.length, HEADERS.length);

      for (let j = 0; j < maxColumns; j++) {
        item[HEADERS[j]] = valuesSimple[j];
      }

      // Клучна проверка: мора да има ID и CategoryKey за да се обработи ставката
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

    // 3. Трансформирање во структуриран JSON формат
    const transformedData = {};

    rawData.forEach((row) => {
      const categoryKey = row.CategoryKey;

      const p30 = parseInt(row.Price30cm);
      const p40 = parseInt(row.Price40cm);
      const p50 = parseInt(row.Price50cm);

      const item = {
        id: parseInt(row.ID),
        name: row.Name,
        // Ја земаме патеката за слика од CSV-то
        imageURL: row.imageURL || "../images/pizza_placeholder.png",
      };

      // Проверка за цени
      if (p30 && p40 && p50) {
        item.prices = [p30, p40, p50];
      } else if (p30) {
        // За Пастрмалија и Парче Пица
        item.singlePrice = p30;
      } else {
        // Ако нема ниту една цена, прескокни ја ставката
        console.warn(
          `[ПРЕСКОКНАТО АРТИКАЛ] ID ${row.ID}: Нема дефинирана цена.`
        );
        return;
      }

      // Додавање на Tag и IsSpecial
      if (row.Tag) {
        item.tag = row.Tag;
      }
      if (row.IsSpecial && row.IsSpecial.toLowerCase() === "true") {
        item.isSpecial = true;
      }

      // 4. Групирање
      if (!transformedData[categoryKey]) {
        transformedData[categoryKey] = {
          title:
            row.CategoryTitle || categoryTitles[categoryKey] || categoryKey,
          items: [],
        };
      }
      transformedData[categoryKey].items.push(item);
    });

    // 5. Финална JSON структура
    const finalJsonOutput = {
      menuData: transformedData,
    };

    // 6. Запишување на JSON датотеката (презапишува цела содржина)
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

// Извршување на функцијата
parseAndTransformCSV();
