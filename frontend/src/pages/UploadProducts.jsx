import { useState } from "react";
import { FaFileExcel, FaInfoCircle } from "react-icons/fa";
import HomeLayout from "../components/HomeLayout";
import { uploadProducts } from "../api/productsApi";

const allowedExtensions = [".xls", ".xlsx"];

const sampleRows = [
  ["MS481", ".Авто краска MIXON СИНТЕТИК синя 481 1л", "460,00", "3", "1,250", "101", "41"],
  ["MS1115", ".Авто краска MIXON СИНТЕТИК синя 1115 1л", "460,00", "3", "1,250", "101", "42"],
  ["MS403", ".Авто краска MIXON СИНТЕТИК монте карло 403 1л", "460,00", "3", "1,250", "101", "43"],
  ["MS420", ".Авто краска MIXON СИНТЕТИК балтика 420 1л", "460,00", "3", "1,250", "101", "44"],
];

function getFileExtension(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex !== -1 ? fileName.substring(dotIndex).toLowerCase() : "";
}

export default function UploadProducts() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("Файл не вибрано");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setStatusMessage("");
    if (!file) {
      setSelectedFile(null);
      setFileName("Файл не вибрано");
      setError("");
      return;
    }

    const extension = getFileExtension(file.name);
    if (!allowedExtensions.includes(extension)) {
      setError("Допускаються лише файли Excel (.xls, .xlsx)");
      setSelectedFile(null);
      setFileName("Файл не вибрано");
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Оберіть файл Excel для завантаження");
      return;
    }

    setIsUploading(true);
    setError("");
    setStatusMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const data = await uploadProducts(formData);

      if (data) {
        setStatusMessage(`Файл «${selectedFile.name}» успішно завантажено. ${data.message ?? ""}`.trim());

        if (Array.isArray(data.errorMessages) && data.errorMessages.length > 0) {
          setError(`Оброблено з ${data.errorMessages.length} помилками. Перевірте консоль для деталей.`);
          console.error("Помилки під час обробки файлу:", data.errorMessages);
        } else {
          setError("");
        }
      } else {
        setStatusMessage(`Файл «${selectedFile.name}» завантажено, але відповідь сервера порожня.`);
      }

      setSelectedFile(null);
      setFileName("Файл не вибрано");
    } catch (error) {
      console.error("Помилка під час завантаження файлу:", error);
      const message = error instanceof Error ? error.message : "Сталася помилка під час завантаження файлу";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <HomeLayout>
      <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow-lg w-full min-w-0 max-w-6xl mx-auto">
        <nav className="text-xs sm:text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex flex-wrap items-center gap-2">
            <li className="flex items-center"><a href="/home" className="text-blue-600 hover:underline">Головна</a></li>
            <li className="flex items-center text-gray-400">/</li>
            <li className="flex items-center"><span className="text-gray-700">Завантаження товарів</span></li>
          </ol>
        </nav>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Завантаження товарів</h2>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr),minmax(280px,360px)] items-start min-w-0">
          <section className="space-y-6 min-w-0">
            <div className="border border-blue-100 rounded-xl p-5 bg-blue-50/60">
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <FaInfoCircle />
                <h3 className="text-lg font-semibold">Правила завантаження</h3>
              </div>
              <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 space-y-2">
                <li>Завантажуйте таблицю Excel зі списком товарів у форматі <strong>.xls</strong> або <strong>.xlsx</strong>.</li>
                <li>Основний параметр — <strong>артикул товару</strong>. До нього прив'язуються всі інші дані.</li>
                <li>Кожен рядок таблиці має містити дані про одну позицію.</li>
                <li>Не змінюйте порядок колонок і залишайте заголовки без змін.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaFileExcel className="text-green-600" />
                Шаблон стовпців
              </h3>
              <div className="w-full max-w-full overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-[640px] md:min-w-full md:w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-yellow-300 text-gray-900">
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Артикул</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Найменування</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Ціна</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Об’єм</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Вага</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Номер групи товару</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Номер всередині групи товару</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-2 border-t border-gray-200 text-gray-700 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">Із цієї таблиці система отримує повну інформацію про товар. Заповнюйте значення так само, як в обліковій системі.</p>
            </div>
          </section>

          <section className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Файл для завантаження</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="product-file" className="block text-sm font-medium text-gray-700 mb-1">Excel-файл</label>
                <label
                  htmlFor="product-file"
                  className="flex flex-wrap items-center justify-between gap-3 w-full cursor-pointer border border-dashed border-blue-400 rounded-lg px-4 py-3 bg-white text-sm text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <span className="truncate max-w-full sm:max-w-[60%]">{fileName}</span>
                  <span className="ml-auto sm:ml-3 text-blue-600 font-medium">Обрати</span>
                </label>
                <input
                  id="product-file"
                  type="file"
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="mt-2 text-xs text-gray-500">Максимальний розмір файлу — 10 МБ. Допускаються лише таблиці Excel.</p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {statusMessage && <p className="text-sm text-green-600">{statusMessage}</p>}

              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {isUploading ? "Завантаження..." : "Завантажити"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </HomeLayout>
  );
}
