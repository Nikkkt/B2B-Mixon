// src/pages/ViewAvailability.jsx
// (Імпорти, API, стилі - все без змін)
import { useState, useEffect } from "react";
import HomeLayout from "../components/HomeLayout";
import Select from 'react-select'; 

// --- Імітація Аутентифікації ---
const userRole = 'user'; // 'user', 'manager', 'admin'
const userBranchId = 'br1'; 
// ---

// ... (Весь код API та стилів залишається тут) ...
const mockBranches = [
  { id: 'br1', name: '1 - Главный склад Одесса' },
  { id: 'br2', name: '2 - Филиал Киев' },
  { id: 'br3', name: '103 - Магазин на Ильфа и Петрова' },
];
const mockDirections = [
  { id: 'dir1', name: '02 - Decorative Coating - для строительства и рем', branchId: 'br1' },
  { id: 'dir2', name: '01 - Car Refinish', branchId: 'br1' },
  { id: 'dir3', name: '02 - Decorative Coating (Киев)', branchId: 'br2' },
  { id: 'dir4', name: '01 - Car Refinish (Киев)', branchId: 'br2' },
  { id: 'dir5', name: '02 - Decorative Coating (Магазин 103)', branchId: 'br3' },
];
const mockGroups = [
  { id: 'group1', name: '201 - MIXON - Деревозащитные средства NOVO', directionId: 'dir1' },
  { id: 'group2', name: '100 - MIXON - CAR REFINISH', directionId: 'dir2' },
  { id: 'group3', name: '201 - MIXON - Деревозащитные (Киев)', directionId: 'dir3' },
  { id: 'group4', name: '100 - MIXON - CAR REFINISH (Киев)', directionId: 'dir4' },
  { id: 'group5', name: '201 - MIXON - Деревозащитные (Магазин 103)', directionId: 'dir5' },
];
const mockAvailabilityData = {
  group1: [ 
    { id: 1, code: "701-01-1", name: "Деревозахист - грунтовка NOVOTEX BASE 1л", availability: "75.00" },
    { id: 2, code: "701-01-20", name: "Деревозахист - грунтовка NOVOTEX BASE 20л", availability: "0.00" },
    { id: 3, code: "702-00-1", name: "Деревозахист - засіб NOVOTEX ULTRA безбарвний 1л", availability: "18.00" },
    { id: 4, code: "702-00-3", name: "Деревозахист - засіб NOVOTEX ULTRA безбарвний 2.5л", availability: "21.00" },
    { id: 5, code: "702-01-1", name: "Деревозахист - засіб NOVOTEX ULTRA орігон 1л", availability: "68.00" },
  ],
  group2: [ { id: 6, code: "105-01-2", name: "Універсальна шпаклівка MIXON-UNI 2кг", availability: "300.00" } ],
  group3: [ { id: 7, code: "701-01-1K", name: "Деревозахист - грунтовка NOVOTEX BASE 1л (Киев)", availability: "10.00" } ],
  group4: [ { id: 8, code: "105-01-2K", name: "Універсальна шпаклівка MIXON-UNI 2кг (Киев)", availability: "42.00" } ],
  group5: [ { id: 9, code: "702-00-1M", name: "Деревозахист - засіб NOVOTEX ULTRA (Магазин)", availability: "5.00" } ],
};
const fakeApiCall = (data) => new Promise(resolve => {
  setTimeout(() => resolve(data), 500);
});
const customSelectStyles = {
  control: (provided, state) => ({ ...provided, backgroundColor: state.isDisabled ? 'rgb(229, 231, 235)' : 'rgb(249 250 251)', border: '1px solid rgb(209 213 219)', borderRadius: '0.375rem', padding: '0.3rem', boxShadow: state.isFocused ? '0 0 0 2px rgb(59 130 246)' : 'none', '&:hover': { borderColor: state.isDisabled ? 'rgb(209 213 219)' : 'rgb(156 163 175)', } }),
  option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? 'rgb(59 130 246)' : (state.isFocused ? 'rgb(243 244 246)' : 'white'), color: state.isSelected ? 'white' : 'rgb(17 24 39)', }),
  placeholder: (provided) => ({ ...provided, color: 'rgb(107 114 128)', }),
  singleValue: (provided) => ({ ...provided, color: 'rgb(17 24 39)', }),
};


export default function ViewAvailability() {
  // ... (Весь код станів та useEffect залишається без змін) ...
  const [branches, setBranches] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]); 
  const [lastUpdated, setLastUpdated] = useState(""); 
  const [selectedBranch, setSelectedBranch] = useState(null); 
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    if (userRole === 'user') {
      const userBranch = mockBranches.find(b => b.id === userBranchId);
      setBranches(userBranch ? [userBranch] : []);
      setSelectedBranch(userBranchId); 
    } else {
      fakeApiCall(mockBranches).then(data => {
        setBranches(data);
        if (data.length > 0) {
          setSelectedBranch(data[0].id);
        }
      });
    }
  }, [userRole, userBranchId]);
  useEffect(() => {
    if (selectedBranch) {
      setIsLoadingDirections(true);
      setDirections([]);
      setGroups([]);
      setProducts([]);
      setSelectedDirection(null); 
      setSelectedGroup(null);
      fakeApiCall(mockDirections.filter(d => d.branchId === selectedBranch))
        .then(data => {
          setDirections(data);
          setIsLoadingDirections(false);
        });
    } else {
      setDirections([]);
      setGroups([]);
      setProducts([]);
    }
  }, [selectedBranch]); 
  useEffect(() => {
    if (selectedDirection) {
      setIsLoadingGroups(true);
      setGroups([]);
      setProducts([]);
      setSelectedGroup(null);
      fakeApiCall(mockGroups.filter(g => g.directionId === selectedDirection))
        .then(data => {
          setGroups(data);
          setIsLoadingGroups(false);
        });
    } else {
      setGroups([]);
      setProducts([]);
    }
  }, [selectedDirection]);
  useEffect(() => {
    if (selectedGroup) {
      setIsLoadingProducts(true);
      fakeApiCall(mockAvailabilityData[selectedGroup] || [])
        .then(data => {
          setProducts(data);
          setLastUpdated(new Date().toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' }));
          setIsLoadingProducts(false);
        });
    } else {
      setProducts([]);
      setLastUpdated(""); 
    }
  }, [selectedGroup]);
  const formatOptions = (data) => {
    return data.map(item => ({
      value: item.id,
      label: item.name
    }));
  };

  return (
    <HomeLayout>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
        
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          {/* ... (хлібні крихти) ... */}
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center"><a href="/home" className="text-blue-600 hover:underline">Головна</a></li>
            <li className="flex items-center mx-2">/</li>
            <li className="flex items-center"><span className="text-gray-700">Просмотр наличия</span></li>
          </ol>
        </nav>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Просмотр наличия</h2>

        {/* --- 1. ОНОВЛЕНО: `max-w-lg` замінено на `w-full` --- */}
        <div className="w-full">
          {/* --- 2. ОНОВЛЕНО: Додано CSS Grid --- */}
          <form className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-6">
            
            {/* --- Колонка 1: Філіал --- */}
            <div className="mb-4 lg:mb-0">
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">Филиал*</label>
              <Select
                id="branch"
                styles={customSelectStyles}
                options={formatOptions(branches)}
                isSearchable
                placeholder="-- Оберіть филиал --"
                onChange={option => setSelectedBranch(option ? option.value : null)}
                value={formatOptions(branches).find(o => o.value === selectedBranch)}
                isDisabled={userRole === 'user'} 
              />
            </div>
            
            {/* --- Колонка 2: Направлення та Група --- */}
            <div className="space-y-4"> {/* `space-y-4` додає відступ між двома <Select> */}
              
              {/* 2.1 Товарне направлення */}
              <div>
                <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">Товарное направление*</label>
                <Select
                  id="direction"
                  styles={customSelectStyles}
                  options={formatOptions(directions)}
                  isClearable
                  isSearchable
                  placeholder={isLoadingDirections ? "Завантаження..." : (selectedBranch ? "-- Оберіть направлення --" : "-- Спочатку оберіть филиал --")}
                  onChange={option => setSelectedDirection(option ? option.value : null)}
                  value={formatOptions(directions).find(o => o.value === selectedDirection)}
                  isDisabled={!selectedBranch || isLoadingDirections}
                  isLoading={isLoadingDirections}
                />
              </div>

              {/* 2.2 Группа товара */}
              <div>
                <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">Группа товара*</label>
                <Select
                  id="group"
                  styles={customSelectStyles}
                  options={formatOptions(groups)}
                  isClearable
                  isSearchable
                  placeholder={isLoadingGroups ? "Завантаження..." : (selectedDirection ? "-- Оберіть групу --" : "-- Спочатку оберіть направлення --")}
                  onChange={option => setSelectedGroup(option ? option.value : null)}
                  value={formatOptions(groups).find(o => o.value === selectedGroup)}
                  isDisabled={!selectedDirection || isLoadingGroups}
                  isLoading={isLoadingGroups}
                />
              </div>
            </div>

          </form>
        </div>
        {/* --- 👆 КІНЕЦЬ ЗМІН 👆 --- */}


        {/* --- Секція результатів (без змін) --- */}
        {isLoadingProducts ? (
          <p className="mt-8 text-center text-gray-600">Завантаження наявності...</p>
        ) : products.length > 0 ? (
          <div className="mt-8">
            <p className="text-sm text-gray-700 font-semibold mb-2">Дата обновления данных - {lastUpdated}</p>
            
            <div className="hidden md:block overflow-y-auto border rounded" style={{ maxHeight: '28vh' }}>
              <table className="w-full text-sm align-middle">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50 rounded-lg">№</th>
                    <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">Код товара</th>
                    <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">Наименование</th>
                    <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Количество</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="p-2 border-b text-gray-700">{index + 1}</td>
                      <td className="p-2 border-b text-gray-700">{product.code}</td>
                      <td className="p-2 border-b text-gray-700">{product.name}</td>
                      <td className="p-2 border-b text-gray-700 text-right">{product.availability}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {products.map((product, index) => (
                <div key={product.id} className="bg-gray-50 p-4 rounded-lg shadow border">
                  <div className="flex justify-between">
                    <h3 className="font-bold text-base text-gray-900 flex-1">{product.name}</h3>
                    <span className="text-sm text-gray-600 ml-2">№ {index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Код: {product.code}</p>
                  <div>
                    <span className="font-semibold text-gray-700 block">Кількість:</span>
                    <span className="font-bold text-lg text-blue-600">{product.availability || '0.00'}</span>
                  </div>
                </div>
              ))}
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