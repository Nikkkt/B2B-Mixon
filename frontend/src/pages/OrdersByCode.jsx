import { useState } from "react";
import HomeLayout from "../components/HomeLayout";
import { FaShoppingCart, FaUpload } from "react-icons/fa";
import * as XLSX from 'xlsx';
import { useCart } from "../context/CartContext.jsx";

const mockProductDatabase = {
  "105-01-2": { id: 1, code: "105-01-2", name: "Універсальна шпаклівка MIXON-UNI 2кг", availability: "300.00", price: "300.00", discount: 0, priceWithDiscount: "300.00", weight: "2.185", volume: "3.000" },
  "3000-01-2": { id: 2, code: "3000-01-2", name: "Універсальна шпаклівка MIXON-3000 2кг", availability: "100.00", price: "233.10", discount: 0, priceWithDiscount: "233.10", weight: "2.185", volume: "3.000" },
  "106-01-2": { id: 3, code: "106-01-2", name: "Шпаклівка алюмінієва MIXON-ALU 1,8кг", availability: "50.00", price: "296.00", discount: 0, priceWithDiscount: "296.00", weight: "1.985", volume: "3.000" },
  "M40-01-04-N": { id: 25, code: "M40-01-04-N", name: "Якийсь товар з файлу 1", availability: "10000.00", price: "50.00", discount: 0, priceWithDiscount: "50.00", weight: "1.0", volume: "1.0" },
  "M40-01-04": { id: 26, code: "M40-01-04", name: "Якийсь товар з файлу 2", availability: "100.00", price: "45.00", discount: 0, priceWithDiscount: "45.00", weight: "1.0", volume: "1.0" },
  "793-01-04": { id: 27, code: "793-01-04", name: "Якийсь товар з файлу 3", availability: "2000.00", price: "120.00", discount: 0, priceWithDiscount: "120.00", weight: "1.0", volume: "1.0" },
  "794-01-04": { id: 28, code: "794-01-04", name: "Якийсь товар з файлу 4", availability: "1000.00", price: "110.00", discount: 0, priceWithDiscount: "110.00", weight: "1.0", volume: "1.0" },
};

const fakeApiFindBySkus = (items) => new Promise(resolve => {
  setTimeout(() => {
    const foundProducts = items.map(item => {
      const product = mockProductDatabase[item.sku.trim()];
      if (product) {
        return {
          ...product,
          requestedQuantity: item.quantity
        };
      }
      return {
        id: item.sku,
        code: item.sku,
        name: "!!! ТОВАР НЕ ЗНАЙДЕНО !!!",
        availability: "0",
        price: "0",
        discount: 0,
        priceWithDiscount: "0",
        weight: "0",
        volume: "0",
        requestedQuantity: item.quantity,
        isError: true
      };
    });
    resolve(foundProducts);
  }, 1000);
});

export default function OrdersByCode() {
  const [skuList, setSkuList] = useState("");
  const [quantityList, setQuantityList] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("Файл не обрано");

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [orderQuantities, setOrderQuantities] = useState({});
  const { addItem, openDrawer } = useCart();

  const handleQuantityChange = (productId, value) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setOrderQuantities(prev => ({
        ...prev,
        [productId]: value
      }));
    }
  };

  const processFoundProducts = (foundProducts) => {
    setProducts(foundProducts);
    const initialQuantities = {};
    foundProducts.forEach(product => {
      initialQuantities[product.id] = product.requestedQuantity;
    });
    setOrderQuantities(initialQuantities);
    setIsLoading(false);
  };

  const handleTextareaSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProducts([]);
    const skus = skuList.split('\n').filter(s => s.trim() !== "");
    const quantities = quantityList.split('\n').filter(q => q.trim() !== "");
    const itemsToFind = skus.map((sku, index) => ({
      sku: sku.trim(),
      quantity: quantities[index] ? quantities[index].trim() : "0"
    }));
    const foundProducts = await fakeApiFindBySkus(itemsToFind);
    processFoundProducts(foundProducts);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    } else {
      setSelectedFile(null);
      setFileName("Файл не обрано");
    }
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Будь ласка, спочатку оберіть файл");
      return;
    }
    setIsLoading(true);
    setProducts([]);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const itemsToFind = json
        .filter(row => row[0] && row[1]) 
        .map(row => ({
          sku: String(row[0]).trim(),
          quantity: String(row[1]).trim()
        }));
      const foundProducts = await fakeApiFindBySkus(itemsToFind);
      processFoundProducts(foundProducts);
    };
    reader.onerror = () => {
      alert("Не вдалося прочитати файл");
      setIsLoading(false);
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleFinalAddToCart = () => {
    const itemsForCart = products
      .map(product => ({
        ...product,
        quantity: parseFloat(orderQuantities[product.id] || 0)
      }))
      .filter(product => !product.isError && product.quantity > 0);
    if (itemsForCart.length === 0) {
      alert("Немає товарів для додавання (кількість повинна бути > 0)");
      return;
    }
    itemsForCart.forEach((entry) => {
      addItem(entry, entry.quantity);
    });
    openDrawer();
    alert(`Додано ${itemsForCart.length} позицій у корзину`);
    setProducts([]);
    setOrderQuantities({});
    setSkuList("");
    setQuantityList("");
    setSelectedFile(null);
    setFileName("Файл не обрано");
  };


  return (
    <HomeLayout>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden">
        <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center"><a href="/home" className="text-blue-600 hover:underline">Головна</a></li>
            <li className="flex items-center mx-2">/</li>
            <li className="flex items-center"><span className="text-gray-700">Замовлення по кодах</span></li>
          </ol>
        </nav>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Замовлення по кодах</h2>
        <form onSubmit={handleFileUpload} className="max-w-lg mb-6">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">Файл</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <label htmlFor="file-upload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md border text-sm">Обрати файл</label>
            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".xls, .xlsx"/>
            <span className="text-sm text-gray-500 self-center truncate">{fileName}</span>
          </div>
          <button type="submit" disabled={isLoading} className="mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {isLoading ? "Завантаження..." : "Завантажити"}
          </button>
        </form>
        <hr className="my-4"/>
        <form onSubmit={handleTextareaSubmit} className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sku-list" className="block text-sm font-medium text-gray-700 mb-1">Товары</label>
              <textarea id="sku-list" rows="6" className="w-full p-2 border rounded-md shadow-sm" value={skuList} onChange={e => setSkuList(e.target.value)}></textarea>
            </div>
            <div>
              <label htmlFor="quantity-list" className="block text-sm font-medium text-gray-700 mb-1">Количества</label>
              <textarea id="quantity-list" rows="6" className="w-full p-2 border rounded-md shadow-sm" value={quantityList} onChange={e => setQuantityList(e.target.value)}></textarea>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 self-end">
            {isLoading ? "Завантаження..." : "Показати"}
          </button>
        </form>
        
        {isLoading && (
          <p className="mt-8 text-center text-gray-600">Пошук товарів...</p>
        )}

        {products.length > 0 && (
          <div className="mt-8 flex-1 flex flex-col overflow-hidden min-h-0">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Результат пошуку</h3>
            
            <div className="flex-1 overflow-auto min-h-0">
              <div className="hidden md:block rounded border">
                <table className="w-full text-sm align-middle rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50 rounded">№</th>
                      <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">Код товара</th>
                      <th className="sticky top-0 p-2 border-b text-left font-semibold text-gray-600 bg-gray-50">Наименование</th>
                      <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Наличие</th>
                      <th className="sticky top-0 p-2 border-b text-center font-semibold text-gray-600 bg-gray-50">Заказ</th>
                      <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Цена</th>
                      <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">% скидки</th>
                      <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Цена со скидкой</th>
                      <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50">Вес (брутто)</th>
                      <th className="sticky top-0 p-2 border-b text-right font-semibold text-gray-600 bg-gray-50 rounded">Объем</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={product.id} className={product.isError ? "bg-red-100 hover:bg-red-200" : "hover:bg-gray-50"}>
                        <td className="p-2 border-b text-gray-700">{index + 1}</td>
                        <td className="p-2 border-b text-gray-700">{product.code}</td>
                        <td className="p-2 border-b text-gray-700">{product.name}</td>
                        <td className="p-2 border-b text-gray-700 text-right">{product.availability}</td>
                        <td className="p-2 border-b text-center">
                          <input 
                            type="text"
                            value={orderQuantities[product.id] || ''}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            className={`w-20 text-center border rounded p-1 shadow-sm ${product.isError ? 'bg-red-50' : ''}`}
                            placeholder="0.00"
                            disabled={product.isError}
                          />
                        </td>
                        <td className="p-2 border-b text-gray-700 text-right">{product.price}</td>
                        <td className="p-2 border-b text-gray-700 text-right">{product.discount}</td>
                        <td className="p-2 border-b text-gray-700 text-right">{product.priceWithDiscount}</td>
                        <td className="p-2 border-b text-gray-700 text-right">{product.weight}</td>
                        <td className="p-2 border-b text-gray-700 text-right">{product.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {products.map((product) => (
                  <div key={product.id} className={`p-4 rounded-lg shadow border ${product.isError ? 'bg-red-100' : 'bg-gray-50'}`}>
                    <h3 className={`font-bold text-base ${product.isError ? 'text-red-700' : 'text-gray-900'}`}>{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">Код: {product.code}</p>
                    
                    {!product.isError && (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div><span className="font-semibold text-gray-700 block">Ціна:</span><span className="text-gray-900">{product.price}</span></div>
                          <div><span className="font-semibold text-gray-700 block">Наявність:</span><span className="text-gray-900">{product.availability || '---'}</span></div>
                          <div><span className="font-semibold text-gray-700 block">Вага:</span><span className="text-gray-900">{product.weight}</span></div>
                          <div><span className="font-semibold text-gray-700 block">Об'єм:</span><span className="text-gray-900">{product.volume}</span></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium">Заказ:</label>
                          <input 
                            type="text"
                            value={orderQuantities[product.id] || ''}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            className="w-24 text-center border rounded-md p-2 shadow-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                type="button"
                onClick={handleFinalAddToCart}
                className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center gap-2"
              >
                <FaShoppingCart />
                Додати до замовлення
              </button>
            </div>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}