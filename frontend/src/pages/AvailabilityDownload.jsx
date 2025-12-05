import { useEffect, useMemo, useRef, useState } from "react";
import { FaFileExcel, FaInfoCircle, FaFileUpload, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt } from "react-icons/fa";
import HomeLayout from "../components/HomeLayout";
import { uploadAvailabilityFile } from "../api/availabilityApi";
import { useAuth } from "../context/AuthContext.jsx";
import { pickReadableValue } from "../utils/displayName";
import { fetchProfile } from "../api/profileApi";

const formatDepartmentLabel = (value, fallback = "—") => pickReadableValue([value], fallback);

export default function AvailabilityDownload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState("idle"); // idle | uploading | success | error
  const [message, setMessage] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [profileOverride, setProfileOverride] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const resolvedUser = profileOverride ?? user;

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user) {
        if (isMounted) {
          setProfileOverride(null);
          setProfileError(null);
          setProfileLoading(false);
        }
        return;
      }

      try {
        setProfileLoading(true);
        setProfileError(null);
        const freshProfile = await fetchProfile();
        if (isMounted) {
          setProfileOverride(freshProfile);
        }
      } catch (error) {
        if (isMounted) {
          const apiError =
            error?.response?.data?.error ??
            error?.message ??
            "Не вдалося оновити дані профілю.";
          setProfileError(apiError);
          setProfileOverride(null);
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const departmentDisplay = useMemo(() => {
    if (!resolvedUser) {
      return { title: "Підрозділ не налаштовано", badge: "—" };
    }

    if (resolvedUser.departmentShopName) {
      return { title: formatDepartmentLabel(resolvedUser.departmentShopName), badge: "Магазин" };
    }

    if (resolvedUser.defaultBranchName) {
      return { title: formatDepartmentLabel(resolvedUser.defaultBranchName), badge: "Філія" };
    }

    return { title: "Підрозділ не налаштовано", badge: "—" };
  }, [resolvedUser]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadState("idle");
    setMessage("");
    setUploadResult(null);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setMessage("Будь ласка, оберіть файл перед завантаженням.");
      setUploadState("error");
      return;
    }

    setUploadState("uploading");
    setMessage("Виконуємо завантаження...");
    setUploadResult(null);

    try {
      const result = await uploadAvailabilityFile(selectedFile);
      setUploadResult(result);
      setUploadState("success");
      const readableDepartment = formatDepartmentLabel(result.departmentDisplayName);
      setMessage(`Оновлено ${result.productsImported} товарів для ${readableDepartment}.`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const apiError = error?.response?.data?.error ?? error?.message ?? "Не вдалося завантажити файл.";
      setUploadState("error");
      setMessage(apiError);
      setUploadResult(null);
    }
  };

  const renderStatus = () => {
    if (uploadState === "idle" || !message) {
      return null;
    }

    const isSuccess = uploadState === "success";
    const Icon = isSuccess ? FaCheckCircle : FaTimesCircle;
    const colorClass = isSuccess
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-red-50 text-red-700 border-red-200";

    return (
      <div className={`flex items-center gap-3 rounded-2xl border px-4 py-2 text-sm font-semibold ${colorClass}`}>
        <Icon />
        <span>{message}</span>
      </div>
    );
  };

  const renderResultSummary = () => {
    if (!uploadResult || uploadState !== "success") {
      return null;
    }

    const processedAt = uploadResult.processedAt
      ? new Date(uploadResult.processedAt).toLocaleString("uk-UA")
      : "—";

    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Результат обробки</p>
          <p className="text-lg font-semibold text-emerald-900">{uploadResult.departmentDisplayName}</p>
          <p className="text-xs text-emerald-600">Час обробки: {processedAt}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-medium text-emerald-900">
          <div className="rounded-xl bg-white/80 border border-emerald-100 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-emerald-400">Рядків</p>
            <p className="text-2xl font-bold">{uploadResult.rowsProcessed}</p>
          </div>
          <div className="rounded-xl bg-white/80 border border-emerald-100 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-emerald-400">Імпортовано</p>
            <p className="text-2xl font-bold">{uploadResult.productsImported}</p>
          </div>
          <div className="rounded-xl bg-white/80 border border-emerald-100 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-emerald-400">Пропущено</p>
            <p className="text-2xl font-bold">{uploadResult.rowsSkipped}</p>
          </div>
        </div>

        {uploadResult.errors?.length > 0 && (
          <div className="rounded-xl bg-white border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold mb-2">Попередження</p>
            <ul className="list-disc pl-5 space-y-1">
              {uploadResult.errors.slice(0, 5).map((errorText, index) => (
                <li key={`${errorText}-${index}`}>{errorText}</li>
              ))}
              {uploadResult.errors.length > 5 && (
                <li>...та ще {uploadResult.errors.length - 5} рядків</li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <HomeLayout>
      <div className="bg-white p-4 sm:p-5 md:p-6 rounded-lg shadow-lg w-full min-w-0 max-w-6xl mx-auto">
        <nav className="text-xs sm:text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex flex-wrap items-center gap-2">
            <li className="flex items-center"><a href="/home" className="text-blue-600 hover:underline">Головна</a></li>
            <li className="flex items-center text-gray-400">/</li>
            <li className="flex items-center"><span className="text-gray-700">Завантаження наявності</span></li>
          </ol>
        </nav>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Завантаження наявності</h2>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr),minmax(280px,360px)] items-start min-w-0">
          <section className="space-y-6 min-w-0">
            <div className="border border-blue-100 rounded-xl p-5 bg-blue-50/60">
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <FaInfoCircle />
                <h3 className="text-lg font-semibold">Інструкція</h3>
              </div>
              <ul className="list-disc list-inside text-sm leading-relaxed text-gray-700 space-y-2">
                <li>Завантажте Excel-файл (.xlsx або .xls) із двома колонками: <strong>Код</strong> та <strong>Кількість</strong>.</li>
                <li>Використовуйте підрозділ, призначений у вашому профілі. Якщо його не налаштовано — зверніться до адміністратора.</li>
                <li>Файл повністю замінює попередні залишки. Перед завантаженням переконайтесь у правильності даних.</li>
                <li>Максимальний розмір файлу — 10 МБ.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Поточний підрозділ</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-blue-500" />
                      {departmentDisplay.title}
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                      {departmentDisplay.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Залишки будуть оновлені для цього магазину або філії.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-5 py-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-blue-700 font-semibold">
                    <FaFileExcel className="text-3xl" />
                    <div>
                      <p className="text-sm">Оберіть Excel-файл для завантаження</p>
                      <p className="text-xs text-blue-400">Підтримуються .xls та .xlsx, до 10 МБ</p>
                    </div>
                  </div>
                  <label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <span className="flex items-center justify-between rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 cursor-pointer hover:bg-blue-50">
                      {selectedFile ? selectedFile.name : "Обрати файл"}
                    </span>
                  </label>
                </div>

                {renderStatus()}
                {renderResultSummary()}

                <button
                  type="submit"
                  disabled={uploadState === "uploading"}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {uploadState === "uploading" ? "Завантаження..." : "Завантажити"}
                </button>
              </form>
            </div>
          </section>

          <section className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FaFileUpload className="text-blue-600" />
              Формат файлу
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>У таблиці повинні бути щонайменше такі колонки:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Код товару</strong> (артикул)</li>
                <li><strong>Кількість</strong> (ціле або дробове значення)</li>
              </ul>
              <p>Додаткові колонки ігноруються.</p>
            </div>
          </section>
        </div>
      </div>
    </HomeLayout>
  );
}
