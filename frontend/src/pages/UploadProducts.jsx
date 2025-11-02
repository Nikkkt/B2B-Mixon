import { useState } from "react";
import { FaFileExcel, FaInfoCircle } from "react-icons/fa";
import HomeLayout from "../components/HomeLayout";

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
  const [fileName, setFileName] = useState("Файл не выбран");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setStatusMessage("");
    if (!file) {
      setSelectedFile(null);
      setFileName("Файл не выбран");
      setError("");
      return;
    }

    const extension = getFileExtension(file.name);
    if (!allowedExtensions.includes(extension)) {
      setError("Допускаются только файлы Excel (.xls, .xlsx)");
      setSelectedFile(null);
      setFileName("Файл не выбран");
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Выберите файл Excel для загрузки");
      return;
    }

    setIsUploading(true);
    setError("");
    setStatusMessage("");

    // Имитация загрузки на сервер
    setTimeout(() => {
      setStatusMessage(`Файл «${selectedFile.name}» успешно загружен (демо).`);
      setSelectedFile(null);
      setFileName("Файл не выбран");
      setIsUploading(false);
    }, 1200);
  };

  return (
    <HomeLayout>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full min-w-0">
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center"><a href="/home" className="text-blue-600 hover:underline">Главная</a></li>
            <li className="flex items-center mx-2 text-gray-400">/</li>
            <li className="flex items-center"><span className="text-gray-700">Загрузка товаров</span></li>
          </ol>
        </nav>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Загрузка товаров</h2>

        <div className="grid gap-8 lg:grid-cols-[1fr,minmax(280px,360px)] items-start">
          <section className="space-y-6">
            <div className="border border-blue-100 rounded-xl p-5 bg-blue-50/60">
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <FaInfoCircle />
                <h3 className="text-lg font-semibold">Правила загрузки</h3>
              </div>
              <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 space-y-2">
                <li>Загружайте таблицу Excel с перечнем товаров в формате <strong>.xls</strong> или <strong>.xlsx</strong>.</li>
                <li>Основной параметр — <strong>артикул товара</strong>. На него привязываются все остальные данные.</li>
                <li>Каждая строка таблицы должна содержать данные по одной позиции товара.</li>
                <li>Не изменяйте порядок колонок и оставьте заголовки без изменений.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaFileExcel className="text-green-600" />
                Шаблон столбцов
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-xs md:text-sm">
                  <thead>
                    <tr className="bg-yellow-300 text-gray-900">
                      <th className="px-3 py-2 font-semibold">Артикул</th>
                      <th className="px-3 py-2 font-semibold">Наименование</th>
                      <th className="px-3 py-2 font-semibold">Цена</th>
                      <th className="px-3 py-2 font-semibold">Объём</th>
                      <th className="px-3 py-2 font-semibold">Вес</th>
                      <th className="px-3 py-2 font-semibold">Номер группы товара</th>
                      <th className="px-3 py-2 font-semibold">Номер внутри группы товара</th>
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
              <p className="mt-3 text-sm text-gray-600">Из таблицы выше система получает полную информацию о товаре. Заполняйте значения так, как в учётной системе.</p>
            </div>
          </section>

          <section className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Файл для загрузки</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="product-file" className="block text-sm font-medium text-gray-700 mb-1">Excel-файл</label>
                <label
                  htmlFor="product-file"
                  className="flex items-center justify-between w-full cursor-pointer border border-dashed border-blue-400 rounded-lg px-4 py-3 bg-white text-sm text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <span className="truncate">{fileName}</span>
                  <span className="ml-3 text-blue-600 font-medium">Выбрать</span>
                </label>
                <input
                  id="product-file"
                  type="file"
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="mt-2 text-xs text-gray-500">Максимальный размер файла — 10 МБ. Допускаются только таблицы Excel.</p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {statusMessage && <p className="text-sm text-green-600">{statusMessage}</p>}

              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {isUploading ? "Загрузка..." : "Загрузить"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </HomeLayout>
  );
}
