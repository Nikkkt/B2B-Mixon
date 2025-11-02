// src/pages/Orders.jsx

import { useState, useEffect } from "react";
import { FaShoppingCart } from "react-icons/fa"; 
import HomeLayout from "../components/HomeLayout";
import Select from 'react-select'; 
import { useCart } from "../context/CartContext.jsx";

// --- Імітація API / Бекенду (без змін) ---
const mockDirections = [
  { id: 'dir1', name: '01 - Car Refinish - для покраски авто' },
  { id: 'dir2', name: '02 - Building Materials - будівельні' },
  { id: 'dir3', name: '03 - Industrial - промислові' }
];
const mockGroups = [
  { id: 'group1', name: '100 - MIXON - CAR REFINISH', directionId: 'dir1' },
  { id: 'group2', name: '101 - SOUDAL - CAR REFINISH', directionId: 'dir1' },
  { id: 'group3', name: '200 - CERESIT - BUILDING', directionId: 'dir2' },
  { id: 'group4', name: '201 - KNAUF - BUILDING', directionId: 'dir2' },
  { id: 'group5', name: '300 - TIKKURILA - INDUSTRIAL', directionId: 'dir3' },
];
const moreProductsForGroup1 = [
  { id: 1, code: "105-01-2", name: "Універсальна шпаклівка MIXON-UNI 2кг", availability: "300.00", order: "0", price: "300.00", discount: 0, priceWithDiscount: "300.00", weight: "2.185", volume: "3.000" },
  { id: 2, code: "3000-01-2", name: "Універсальна шпаклівка MIXON-3000 2кг", availability: "", order: "0", price: "233.10", discount: 0, priceWithDiscount: "233.10", weight: "2.185", volume: "3.000" },
  { id: 3, code: "106-01-2", name: "Шпаклівка алюмінієва MIXON-ALU 1,8кг", availability: "", order: "0", price: "296.00", discount: 0, priceWithDiscount: "296.00", weight: "1.985", volume: "3.000" },
  { id: 4, code: "107-01-2", name: "Шпаклівка со стекловолокном MIXON-FIBER 1,8кг", availability: "", order: "0", price: "259.00", discount: 0, priceWithDiscount: "259.00", weight: "1.905", volume: "3.000" },
  { id: 5, code: "301-01-1", name: "Акриловий грунт MIXON 3+1 сірий 1л", availability: "", order: "0", price: "299.70", discount: 0, priceWithDiscount: "299.70", weight: "1.770", volume: "3.000" },
  { id: 6, code: "301-02-1", name: "Акриловий грунт MIXON 3+1 білий 1л", availability: "", order: "0", price: "299.70", discount: 0, priceWithDiscount: "299.70", weight: "1.770", volume: "3.000" },
  { id: 7, code: "301-03-1", name: "Акриловий грунт MIXON 3+1 чорний 1л", availability: "2.00", order: "0", price: "299.70", discount: 0, priceWithDiscount: "299.70", weight: "1.770", volume: "3.000" },
  { id: 8, code: "301-04-1", name: "Акриловий грунт MIXON 3+1 жовтий 1л", availability: "4.00", order: "0", price: "299.70", discount: 0, priceWithDiscount: "299.70", weight: "1.770", volume: "3.000" },
  { id: 9, code: "301-05-1", name: "Акриловий грунт MIXON 3+1 красный 1л", availability: "", order: "0", price: "299.70", discount: 0, priceWithDiscount: "299.70", weight: "1.770", volume: "3.000" },
  { id: 10, code: "311-01-03", name: "Затверджувач MIXON 3+1 330мл", availability: "0.00", order: "0", price: "118.40", discount: 0, priceWithDiscount: "118.40", weight: "0.393", volume: "3.000" },
  { id: 11, code: "105-01-3", name: "Універсальна шпаклівка MIXON-UNI 2кг (Copy)", availability: "300.00", order: "0", price: "300.00", discount: 0, priceWithDiscount: "300.00", weight: "2.185", volume: "3.000" },
  { id: 12, code: "3000-01-3", name: "Універсальна шпаклівка MIXON-3000 2кг (Copy)", availability: "", order: "0", price: "233.10", discount: 0, priceWithDiscount: "233.10", weight: "2.185", volume: "3.000" },
  { id: 13, code: "106-01-3", name: "Шпаклівка алюмінієва MIXON-ALU 1,8кг (Copy)", availability: "", order: "0", price: "296.00", discount: 0, priceWithDiscount: "296.00", weight: "1.985", volume: "3.000" },
  { id: 14, code: "107-01-3", name: "Шпаклівка со стекловолокном MIXON-FIBER 1,8кг (Copy)", availability: "", order: "0", price: "259.00", discount: 0, priceWithDiscount: "259.00", weight: "1.905", volume: "3.000" },
  { id: 15, code: "301-01-2", name: "Акриловий грунт MIXON 3+1 сірий 1л (Copy)", availability: "", order: "0", price: "299.70", discount: 0, priceWithDiscount: "299.70", weight: "1.770", volume: "3.000" },
  { id: 16, code: "301-02-2", name: "Акриловий грунт MIXON 3+1 білий 1л (Copy)", availability: "", order: "0", price: "299.70", discount: 0, priceWithDiscount: "299.70", weight: "1.770", volume: "3.000" },
  { id: 17, code: "301-03-2", name: "Акриловий грунт MIXON 3+1 чорний 1л (Copy)", availability: "2.00", order: "0", price: "299.70", discount: 0, priceWithDiscount: "299.70", weight: "1.770", volume: "3.000" },
  { id: 18, code: "301-04-2", name: "Акриловий грунт MIXON 3+1 жовтий 1л (Copy)", availability: "4.00", order: "0", price: "299.70", discount: 0, priceWithDiscount: "299.70", weight: "1.770", volume: "3.000" },
  { id: 19, code: "301-05-2", name: "Акриловий грунт MIXON 3+1 красный 1л (Copy)", availability: "", order: "0", price: "299.70", discount: 0, priceWithDiscount: "299.70", weight: "1.770", volume: "3.000" },
  { id: 20, code: "311-01-04", name: "Затверджувач MIXON 3+1 330мл (Copy)", availability: "0.00", order: "0", price: "118.40", discount: 0, priceWithDiscount: "118.40", weight: "0.393", volume: "3.000" },
];
const mockProducts = {
  group1: moreProductsForGroup1, 
  group2: [ { id: 21, code: "S-101-1", name: "Піна монтажна SOUDAL", availability: "50.00", order: "0", price: "150.00", discount: 0, priceWithDiscount: "150.00", weight: "0.800", volume: "1.000" } ],
  group3: [ { id: 22, code: "C-50-5", name: "Клей для плитки CERESIT CM 11, 25кг", availability: "1000.00", order: "0", price: "350.00", discount: 0, priceWithDiscount: "350.00", weight: "25.000", volume: "20.000" } ],
  group4: [],
  group5: [ { id: 23, code: "T-99-1", name: "Фарба промислова TIKKURILA, 20л", availability: "40.00", order: "0", price: "5500.00", discount: 0, priceWithDiscount: "5500.00", weight: "30.000", volume: "20.000" } ]
};
const fakeApiCall = (data) => new Promise(resolve => {
  setTimeout(() => resolve(data), 500);
});
// --- Кінець імітації API ---

const customSelectStyles = {
  control: (provided, state) => ({ ...provided, backgroundColor: 'rgb(249 250 251)', border: '1px solid rgb(209 213 219)', borderRadius: '0.375rem', padding: '0.3rem', boxShadow: state.isFocused ? '0 0 0 2px rgb(59 130 246)' : 'none', '&:hover': { borderColor: 'rgb(156 163 175)', } }),
  option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? 'rgb(59 130 246)' : (state.isFocused ? 'rgb(243 244 246)' : 'white'), color: state.isSelected ? 'white' : 'rgb(17 24 39)', }),
  placeholder: (provided) => ({ ...provided, color: 'rgb(107 114 128)', }),
  singleValue: (provided) => ({ ...provided, color: 'rgb(17 24 39)', }),
};


export default function Orders() {
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null); 
  const [selectedGroup, setSelectedGroup] = useState(null);       
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [orderQuantities, setOrderQuantities] = useState({});
  const { addItem, openDrawer } = useCart();

  useEffect(() => {
    fakeApiCall(mockDirections).then(data => {
      setDirections(data);
    });
  }, []);

  useEffect(() => {
    if (selectedDirection) {
      setIsLoadingGroups(true);
      setProducts([]);
      setSelectedGroup(null); 
      setOrderQuantities({});
      fakeApiCall(mockGroups.filter(g => g.directionId === selectedDirection))
        .then(data => {
          setGroups(data);
          setIsLoadingGroups(false);
        });
    } else {
      setGroups([]);
      setProducts([]);
      setSelectedGroup(null);
      setOrderQuantities({});
    }
  }, [selectedDirection]);

  useEffect(() => {
    if (selectedGroup) {
      setIsLoadingProducts(true);
      fakeApiCall(mockProducts[selectedGroup] || [])
        .then(data => {
          setProducts(data);
          const initialQuantities = {};
          data.forEach(product => {
            initialQuantities[product.id] = product.order;
          });
          setOrderQuantities(initialQuantities);
          setIsLoadingProducts(false);
        });
    } else {
      setProducts([]);
      setOrderQuantities({});
    }
  }, [selectedGroup]);

  const handleQuantityChange = (productId, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setOrderQuantities(prev => ({
        ...prev,
        [productId]: value
      }));
    }
  };

  const handleAddToCart = (productId) => {
    const quantity = orderQuantities[productId] || 0;
    const product = products.find(p => p.id === productId);
    const numQuantity = parseFloat(quantity);
    if (!numQuantity || numQuantity <= 0) {
      alert("Будь ласка, введіть кількість для замовлення");
      return;
    }
    addItem(product, numQuantity);
    openDrawer();
    alert(`Додано в корзину: ${product.name}, Кількість: ${quantity}`);
  };

  const formatOptions = (data) => {
    return data.map(item => ({
      value: item.id,
      label: item.name
    }));
  };

  return (
    <HomeLayout>
      {/* Оновлено батьківський div:
        - `flex-1` та `flex-col` дозволяють йому заповнити простір,
          який надає `main` з HomeLayout.
        - `overflow-hidden` запобігає дивному подвійному скролу.
      */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden">
        
        {/* --- Секція фільтрів (без змін) --- */}
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          {/* ... хлібні крихти ... */}
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <a href="/home" className="text-blue-600 hover:underline">Головна</a>
            </li>
            <li className="flex items-center mx-2">/</li>
            <li className="flex items-center">
              <span className="text-gray-700">Заказ товарів</span> 
            </li>
          </ol>
        </nav>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Заказ товарів
        </h2>
        <div className="max-w-lg">
          <form>
            <div className="mb-4">
              <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-1">Товарное направление*</label>
              <Select
                id="direction"
                styles={customSelectStyles}
                options={formatOptions(directions)}
                isClearable isSearchable
                placeholder="-- Оберіть направлення --"
                onChange={option => setSelectedDirection(option ? option.value : null)}
                value={formatOptions(directions).find(o => o.value === selectedDirection)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">Группы товара*</label>
              <Select
                id="group"
                styles={customSelectStyles}
                options={formatOptions(groups)}
                isClearable isSearchable
                placeholder={isLoadingGroups ? "Завантаження груп..." : (selectedDirection ? "-- Оберіть групу --" : "-- Спочатку оберіть направлення --")}
                onChange={option => setSelectedGroup(option ? option.value : null)}
                value={formatOptions(groups).find(o => o.value === selectedGroup)}
                isDisabled={!selectedDirection || isLoadingGroups}
                isLoading={isLoadingGroups}
              />
            </div>
          </form>
        </div>
        {/* --- Секція з контентом (оновлена) --- */}
        {isLoadingProducts ? (
          <p className="mt-8 text-center text-gray-600">Завантаження товарів...</p>
        ) : products.length > 0 ? (
          // flex-1 та overflow-auto тепер тут, щоб скрол був всередині
          <div className="mt-8 flex-1 overflow-auto"> 
            
            {/* --- 1. Таблиця для ПК та Планшетів --- */}
            {/* `hidden md:block` - приховує на мобілках, показує на середніх екранах і вище */}
            <div className="hidden md:block rounded-lg" style={{ maxHeight: '30vh' }}>
              <table className="w-full text-sm align-middle">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">№</th>
                    <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">Код товара</th>
                    <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">Наименование</th>
                    <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Наличие</th>
                    <th className="sticky top-0 p-2 border-b text-center font-semibold text-gray-600 bg-gray-50">Заказ</th>
                    <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Цена</th>
                    <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">% скидки</th>
                    <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Цена со скидкой</th>
                    <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Вес (брутто)</th>
                    <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Объем</th>
                    <th className="sticky top-0 p-2 border-b text-center font-semibold text-gray-600 bg-gray-50">В корзину</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="p-2 border-b text-gray-700">{index + 1}</td>
                      <td className="p-2 border-b text-gray-700">{product.code}</td>
                      <td className="p-2 border-b text-gray-700">{product.name}</td>
                      <td className="p-2 border-b text-gray-700 text-right">{product.availability}</td>
                      <td className="p-2 border-b text-center">
                        <input 
                          type="number"
                          value={orderQuantities[product.id] || ''}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-20 text-center border rounded p-1 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2 border-b text-gray-700 text-right">{product.price}</td>
                      <td className="p-2 border-b text-gray-700 text-right">{product.discount}</td>
                      <td className="p-2 border-b text-gray-700 text-right">{product.priceWithDiscount}</td>
                      <td className="p-2 border-b text-gray-700 text-right">{product.weight}</td>
                      <td className="p-2 border-b text-gray-700 text-right">{product.volume}</td>
                      <td className="p-2 border-b text-gray-700 text-center">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product.id)}
                          className="text-blue-600 hover:text-blue-800 text-lg"
                          title="Додати в корзину"
                        >
                          <FaShoppingCart />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- 2. Новий Список Карток для Мобільних --- */}
            {/* `md:hidden` - показує на мобілках, приховує на середніх екранах і вище */}
            <div className="md:hidden space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-gray-50 p-4 rounded-lg shadow border">
                  
                  {/* Назва та Код */}
                  <h3 className="font-bold text-base text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">Код: {product.code}</p>

                  {/* Деталі */}
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div>
                      <span className="font-semibold text-gray-700 block">Ціна:</span>
                      <span className="text-gray-900">{product.price}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700 block">Наявність:</span>
                      <span className="text-gray-900">{product.availability || '---'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700 block">Вага (брутто):</span>
                      <span className="text-gray-900">{product.weight}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700 block">Об'єм:</span>
                      <span className="text-gray-900">{product.volume}</span>
                    </div>
                  </div>

                  {/* Поле вводу та Кнопка */}
                  <div className="flex items-center gap-3">
                    <input 
                      type="text"
                      value={orderQuantities[product.id] || ''}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      className="w-24 text-center border rounded-md p-2 shadow-sm"
                      placeholder="0"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product.id)}
                      className="flex-1 bg-blue-600 text-white rounded-md p-2 flex items-center justify-center gap-2 text-sm"
                      title="Додати в корзину"
                    >
                      <FaShoppingCart />
                      <span>В корзину</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        ) : (
          // Повідомлення "не знайдено" (залишається без змін)
          selectedGroup && !isLoadingProducts && (
            <p className="mt-8 text-center text-gray-600">Для цієї групи товари не знайдені.</p>
          )
        )}
      </div>
    </HomeLayout>
  );
}