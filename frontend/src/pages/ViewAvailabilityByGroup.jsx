// src/pages/ViewAvailabilityByGroup.jsx

import { useState, useEffect } from "react";
import HomeLayout from "../components/HomeLayout";
import Select from 'react-select';
import { FaFilePdf, FaFileExcel } from "react-icons/fa";

// --- Імітація API / Бекенду ---

// 1. Направлення
const mockDirections = [
  { id: 'dir1', name: '01 - Car Refinish - для покраски авто' },
  { id: 'dir2', name: '02 - Decorative Coating - для строительства и рем' },
  { id: 'dir3', name: '03 - Industrial - промислові' }
];

// 2. Групи
const mockGroups = [
  { id: 'group1', name: '202 - MIXON - Антикоррозийные краски и грунты', directionId: 'dir2' }, // Прив'язано до dir2
  { id: 'group2', name: '101 - SOUDAL - CAR REFINISH', directionId: 'dir1' },
  { id: 'group3', name: '200 - CERESIT - BUILDING', directionId: 'dir2' },
];

// 3. Список Філіалів (для колонок таблиці) - взято зі скріншоту image_816c83.png
const mockBranches = [
  { id: '11', name: '11 - Главный склад Одесса' },
  { id: '103', name: '103 - Магазин на Ильфа и Петрова Одесса' },
  { id: '104', name: '104 - Магазин на Малиновского Одесса' },
  { id: '106', name: '106 - Магазин на Староконном Одесса' },
  { id: '107', name: '107 - Магазин на Староконном Одесса' }, // Дубль зі скріншоту, може бути помилка
  { id: '108', name: '108 - Магазин на Раскидайловской Одесса' },
  { id: '77', name: '77 - Склад Филиал Киев' },
  { id: '79', name: '79 - Склад Филиал Луцк' },
  { id: '301', name: '301 - Магазин на Ровенской Луцк' },
  { id: '302', name: '302 - Магазин на Порика Луцк' },
  { id: '88', name: '88 - Склад Филиал Ровно' },
  { id: '7', name: '7 - Склад Филиал Хмельницкий' },
];

// 4. Дані по групах (з PDF стор. 9 / скріншоту image_816c83.png)
const mockGroupAvailability = {
  'group1': [ // 202 - MIXON - Антикоррозийные краски и грунты
    {
      id: 1,
      code: '909-01-1',
      name: 'Антикорозійний грунт MIXON МІТАЛ БЕЙС сірий 1л',
      stock: { '11': 947, '103': 111, '104': 0, '106': 20, '107': 0, '108': 6, '77': 9, '79': 0, '301': 21, '302': 0, '88': 0, '7': 17 }
    },
    {
      id: 2,
      code: '909-02-1',
      name: 'Антикорозійний грунт MIXON МІТАЛ БЕЙС білий 1л',
      stock: { '11': 214, '103': 0, '104': 12, '106': 0, '107': 12, '108': 0, '77': 0, '79': 14, '301': 24, '302': 16, '88': 13, '7': 68 }
    },
    {
      id: 3,
      code: '909-03-1',
      name: 'Антикорозійний грунт MIXON МІТАЛ БЕЙС чорний 1л',
      stock: { '11': 45, '103': 0, '104': 0, '106': 1, '107': 0, '108': 10, '77': 0, '79': 11, '301': 0, '302': 3, '88': 0, '7': 2 }
    },
    {
      id: 4,
      code: '909-04-1',
      name: 'Антикорозійний грунт MIXON МІТАЛ БЕЙС жовтий 1л',
      stock: { '11': 281, '103': 20, '104': 0, '106': 1, '107': 0, '108': 0, '77': 4, '79': 10, '301': 6, '302': 7, '88': 0, '7': 4 }
    }
  ],
  'group2': [ // 101 - SOUDAL
     { id: 5, code: 'S-101-1', name: 'Піна монтажна SOUDAL', stock: { '11': 50, '77': 10, '79': 5, '103': 2 } }
  ],
  'group3': [ // 200 - CERESIT
     { id: 6, code: 'C-50-5', name: 'Клей для плитки CERESIT CM 11, 25кг', stock: { '11': 1000, '104': 50, '7': 20 } }
  ]
};


const fakeApiCall = (data) => new Promise(resolve => {
  setTimeout(() => resolve(data), 500);
});
// --- Кінець імітації API ---

const customSelectStyles = { /* ... (Стилі без змін) ... */
  control: (provided, state) => ({ ...provided, backgroundColor: 'rgb(249 250 251)', border: '1px solid rgb(209 213 219)', borderRadius: '0.375rem', padding: '0.3rem', boxShadow: state.isFocused ? '0 0 0 2px rgb(59 130 246)' : 'none', '&:hover': { borderColor: 'rgb(156 163 175)', } }),
  option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? 'rgb(59 130 246)' : (state.isFocused ? 'rgb(243 244 246)' : 'white'), color: state.isSelected ? 'white' : 'rgb(17 24 39)', }),
  placeholder: (provided) => ({ ...provided, color: 'rgb(107 114 128)', }),
  singleValue: (provided) => ({ ...provided, color: 'rgb(17 24 39)', }),
};


export default function ViewAvailabilityByGroup() {
  // --- (Стани та useEffect без змін) ---
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => { /* Завантаження directions та branches */
    fakeApiCall(mockDirections).then(data => { setDirections(data); });
    fakeApiCall(mockBranches).then(data => { setBranches(data); });
  }, []);
  useEffect(() => { /* Завантаження groups */
    if (selectedDirection) {
      setIsLoadingGroups(true); setProducts([]); setSelectedGroup(null);
      fakeApiCall(mockGroups.filter(g => g.directionId === selectedDirection))
        .then(data => { setGroups(data); setIsLoadingGroups(false); });
    } else { /* Скидання */ setGroups([]); setProducts([]); setSelectedGroup(null); }
  }, [selectedDirection]);
  useEffect(() => { /* Завантаження products */
    if (selectedGroup) {
      setIsLoadingProducts(true);
      fakeApiCall(mockGroupAvailability[selectedGroup] || [])
        .then(data => { setProducts(data); setIsLoadingProducts(false); });
    } else { setProducts([]); }
  }, [selectedGroup]);
  const handlePdfExport = () => { alert("PDF Export..."); };
  const handleExcelExport = () => { alert("Excel Export..."); };
  const formatOptions = (data) => { return data.map(item => ({ value: item.id, label: item.name })); };
  // --- (Кінець незмінної частини) ---

  return (
    <HomeLayout>
      {/* Головний контейнер - ПРОСТО блок з відступами */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full min-w-0">

        {/* --- Заголовок, Хлібні крихти, Фільтри (без змін) --- */}
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb"> {/* ... */}</nav>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Просмотр наличия по группам</h2>
        <div className="max-w-lg"> {/* ... (форма з Select'ами) ... */}
         <form>
             <div className="mb-4">
                <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">Товарное направление*</label>
                <Select id="direction" styles={customSelectStyles} options={formatOptions(directions)} isClearable isSearchable placeholder="-- Оберіть направлення --" onChange={option => setSelectedDirection(option ? option.value : null)} value={formatOptions(directions).find(o => o.value === selectedDirection)} />
             </div>
             <div className="mb-4">
                <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">Группы товара*</label>
                <Select id="group" styles={customSelectStyles} options={formatOptions(groups)} isClearable isSearchable placeholder={isLoadingGroups ? "Завантаження груп..." : (selectedDirection ? "-- Оберіть групу --" : "-- Спочатку оберіть направлення --")} onChange={option => setSelectedGroup(option ? option.value : null)} value={formatOptions(groups).find(o => o.value === selectedGroup)} isDisabled={!selectedDirection || isLoadingGroups} isLoading={isLoadingGroups} />
             </div>
          </form>
        </div>

        {/* --- Секція результатів --- */}
        {isLoadingProducts ? (
          <p className="mt-8 text-center text-gray-600">Завантаження товарів...</p>
        ) : products.length > 0 ? (
          <div className="mt-8 min-w-0">

            <div className="flex gap-2 mb-4">
              <button onClick={handleExcelExport} className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 flex items-center gap-2">
                <FaFileExcel /> Excel
              </button>
              <button onClick={handlePdfExport} className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 flex items-center gap-2">
                <FaFilePdf /> PDF
              </button>
            </div>

            {/* --- Таблиця для ПК --- */}
            {/* 1. overflow-auto ТУТ */}
            <div
              className="hidden md:block overflow-x-auto overflow-y-auto border rounded w-full max-w-full min-w-0"
              style={{ maxHeight: '28vh', minHeight: '16vh' }}
            >
              {/* `table-fixed` все ще потрібен для стабільності */}
              {/* ЗБІЛЬШИВ `min-w-[1500px]` - підбери це значення! */}
              <table className="text-sm align-middle table-fixed min-w-[1800px]">
                 <thead className="bg-gray-50">
                    <tr>
                      {/* Оновлені ширини перших колонок */}
                      <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50 z-10 w-16">№</th>
                      <th
                        className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50 z-10 w-72"
                        style={{ minWidth: '22rem' }}
                      >
                        Код товара
                      </th>
                      <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50 z-10 w-[360px]">Наименование</th>
                      <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50 z-10 w-36">Кількість (Загальна)</th>

                      {/* Філіали - ширші колонки, але в межах екрану */}
                      {branches.map(branch => (
                        <th key={branch.id} className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50 z-10 whitespace-nowrap w-28">
                          {branch.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => {
                      const total = Object.values(product.stock || {}).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="p-2 border-b text-gray-700">{index + 1}</td>
                          <td
                            className="p-2 border-b text-gray-700 w-72"
                            style={{ minWidth: '22rem' }}
                          >
                            {product.code}
                          </td>
                          <td className="p-2 border-b text-gray-700 truncate">{product.name}</td> {/* truncate залишається */}
                          <td className="p-2 border-b text-gray-700 text-right font-bold">{total.toFixed(2)}</td>
                          {branches.map(branch => (
                            <td key={branch.id} className="p-2 border-b text-gray-700 text-right">
                              {(product.stock && product.stock.hasOwnProperty(branch.id)) ? parseFloat(product.stock[branch.id]).toFixed(2) : '0.00'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
              </table>
            </div>

            {/* --- Картки для Мобільних (без змін) --- */}
            <div className="md:hidden space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {products.map((product, index) => {
                 const total = Object.values(product.stock || {}).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
                  return (
                    <div key={product.id} className="bg-gray-50 p-4 rounded-lg shadow border">
                      <div className="flex justify-between">
                        <h3 className="font-bold text-base text-gray-900 flex-1">{product.name}</h3>
                        <span className="text-sm text-gray-600 ml-2">№ {index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">Код: {product.code}</p>
                      <div>
                        <span className="font-semibold text-gray-700 block">Загальна кількість:</span>
                        <span className="font-bold text-lg text-blue-600">{total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
              })}
            </div>

          </div>
        ) : (
          selectedGroup && !isLoadingProducts && (
            <p className="mt-8 text-center text-gray-600">Для цієї групи товари не знайдені.</p>
          )
        )}
      </div>
    </HomeLayout>
  );
}