import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import HomeLayout from "../components/HomeLayout";
import {
  FaBell,
  FaUserPlus,
  FaSearch,
  FaUserShield,
  FaTruck,
  FaPercent,
  FaLayerGroup,
  FaEye,
  FaTimes,
  FaSave,
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import Select from "react-select";
import {
  fetchAdminUsersDashboard,
  updateAdminUser,
  createAdminUser,
  deleteAdminUser,
} from "../api/adminUsersApi";

const buildProductGroupLabel = (groupNumber, groupName) => {
  if (groupNumber && groupName) {
    return `${groupNumber} - ${groupName}`;
  }
  return groupName || groupNumber || "";
};

const mapBranchToOption = (branch) => ({
  id: branch.id != null ? String(branch.id) : "",
  name:
    branch.displayName ||
    branch.name ||
    (branch.code ? `${branch.code}` : "Без назви"),
  code: branch.code || "",
});

const mapProductGroupToOption = (group) => ({
  id: group.id != null ? String(group.id) : "",
  groupNumber: group.groupNumber || "",
  name: group.name || "",
  label:
    group.displayName || buildProductGroupLabel(group.groupNumber, group.name),
});

const DISCOUNT_PROFILE_PRIORITY = {
  none: 0,
  "small-wholesale": 1,
  wholesale: 2,
  "large-wholesale": 3,
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const mapDiscountProfileToOption = (profile) => ({
  id: profile.id != null ? String(profile.id) : "",
  code: profile.code || "",
  label: profile.name || profile.code || "Без назви",
  description: profile.description || "",
  defaultDiscounts: (profile.defaultDiscounts ?? []).map((discount) => ({
    groupId: String(discount.productGroupId),
    percent: discount.percent,
    label: buildProductGroupLabel(
      discount.productGroupNumber,
      discount.productGroupName
    ),
  })),
});

const mapManagerOption = (option) => ({
  id: option?.id ? String(option.id) : null,
  displayName: option?.displayName || option?.email || "—",
  email: option?.email || "",
  roles: option?.roles ?? [],
});

const formatUserId = (id) => {
  if (!id) return "—";
  return id.slice(0, 8).toUpperCase();
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("uk-UA");
  } catch (error) {
    return value;
  }
};

const normalizeRoles = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return ["user"];
  }
  const normalized = roles
    .map((role) => (role || "").toString().toLowerCase())
    .filter(Boolean);
  return normalized.length > 0 ? normalized : ["user"];
};

const mapUserToViewModel = (user) => {
  const defaultDiscounts = (user.defaultDiscounts ?? []).map((discount) => ({
    groupId: String(discount.productGroupId),
    percent: discount.percent,
    label: buildProductGroupLabel(
      discount.productGroupNumber,
      discount.productGroupName
    ),
  }));

  const specialDiscounts = (user.specialDiscounts ?? []).map((discount) => ({
    id: discount.id,
    groupId: String(discount.productGroupId),
    percent: discount.percent,
    label: buildProductGroupLabel(
      discount.productGroupNumber,
      discount.productGroupName
    ),
  }));

  const productGroupAccessIds = (user.productGroupAccessIds ?? []).map((id) =>
    String(id)
  );

  const accessCategories = user.hasFullAccess ? ["all"] : productGroupAccessIds;

  const normalizedRoles = normalizeRoles(user.roles ?? user.role);

  return {
    id: user.id,
    name:
      user.displayName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email,
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    company: user.company || "",
    companyCode: user.companyCode || "",
    country: user.country || "",
    city: user.city || "",
    address: user.address || "",
    phone: user.phone || "",
    fax: user.fax || "",
    location: user.location || "",
    roles: normalizedRoles,
    shippingPoint: user.shippingPointId ? String(user.shippingPointId) : null,
    shippingPointName: user.shippingPointName || "",
    departmentShop: user.departmentShopId ? String(user.departmentShopId) : null,
    departmentShopName: user.departmentShopName || "",
    discountType: user.discountProfileId ? String(user.discountProfileId) : null,
    discountProfileCode: user.discountProfileCode || "",
    managerId: user.managerUserId ? String(user.managerUserId) : null,
    managerDisplayName: user.managerDisplayName || "",
    managerEmail: user.managerEmail || "",
    defaultDiscounts,
    specialDiscounts,
    accessCategories,
    productGroupAccessIds,
    registrationDate: user.createdAt,
    lastContact: user.lastContact || "",
    isNew: Boolean(user.isNew),
    hasFullAccess: Boolean(user.hasFullAccess),
    isConfirmed: Boolean(user.isConfirmed),
    confirmedAt: user.confirmedAt,
    lastLoginAt: user.lastLoginAt,
  };
};

const createUpdatePayload = (formState) => {
  const hasFullAccess = formState.accessCategories.includes("all");
  const productGroupAccessIds = hasFullAccess
    ? []
    : formState.accessCategories.filter((id) => id && id !== "all");

  const payload = {
    email: formState.email?.trim() ?? "",
    firstName: formState.firstName?.trim() ?? "",
    lastName: formState.lastName?.trim() ?? "",
    company: formState.company?.trim() ?? "",
    companyCode: formState.companyCode?.trim() ?? "",
    country: formState.country?.trim() ?? "",
    city: formState.city?.trim() ?? "",
    address: formState.address?.trim() ?? "",
    phone: formState.phone?.trim() ?? "",
    fax: formState.fax?.trim() ?? "",
    roles: normalizeRoles(formState.roles),
    shippingPointId: formState.shippingPoint || null,
    departmentShopId: formState.departmentShop || null,
    discountProfileId: formState.discountType || null,
    managerUserId: formState.managerId || null,
    hasFullAccess,
    productGroupAccessIds,
    specialDiscounts: (formState.specialDiscounts ?? [])
      .filter((discount) => discount.groupId && discount.percent !== "")
      .map((discount) => ({
        productGroupId: discount.groupId,
        percent: Number(discount.percent),
      })),
    lastContact: formState.lastContact?.trim() || null,
    isConfirmed: Boolean(formState.isConfirmed),
  };

  if (formState.password && formState.password.trim().length > 0) {
    payload.password = formState.password.trim();
  }

  return payload;
};

const createCreatePayload = (formState) => {
  const hasFullAccess = formState.accessCategories.includes("all");
  const productGroupAccessIds = hasFullAccess
    ? []
    : formState.accessCategories.filter((id) => id && id !== "all");

  return {
    email: formState.email.trim(),
    firstName: formState.firstName.trim(),
    lastName: formState.lastName.trim(),
    company: formState.company?.trim() ?? "",
    companyCode: formState.companyCode?.trim() ?? "",
    country: formState.country?.trim() ?? "",
    city: formState.city?.trim() ?? "",
    address: formState.address?.trim() ?? "",
    phone: formState.phone?.trim() ?? "",
    fax: formState.fax?.trim() ?? "",
    roles: normalizeRoles(formState.roles),
    shippingPointId: formState.shippingPoint || null,
    departmentShopId: formState.departmentShop || null,
    discountProfileId: formState.discountType || null,
    managerUserId: formState.managerId || null,
    hasFullAccess,
    productGroupAccessIds,
    specialDiscounts: (formState.specialDiscounts ?? [])
      .filter((discount) => discount.groupId && discount.percent !== "")
      .map((discount) => ({
        productGroupId: discount.groupId,
        percent: Number(discount.percent),
      })),
    lastContact: formState.lastContact?.trim() || null,
    password: formState.password.trim(),
  };
};


const createFormTemplate = {
  email: "",
  firstName: "",
  lastName: "",
  company: "",
  companyCode: "",
  country: "Україна",
  city: "",
  address: "",
  phone: "",
  fax: "",
  roles: ["user"],
  shippingPoint: null,
  departmentShop: null,
  discountType: null,
  managerId: null,
  accessCategories: [],
  specialDiscounts: [],
  defaultDiscounts: [],
  lastContact: "",
  password: "",
  confirmPassword: "",
};

const buildCreateFormState = () => ({
  ...createFormTemplate,
  accessCategories: [...createFormTemplate.accessCategories],
  specialDiscounts: [],
  defaultDiscounts: [],
});

const roleOptions = [
  { value: "user", label: "Користувач" },
  { value: "manager", label: "Менеджер" },
  { value: "department", label: "Підрозділ" },
  { value: "admin", label: "Адміністратор" },
];

const countryOptions = [
  "Україна",
  "Польща",
  "Німеччина",
  "Франція",
  "Італія",
  "Іспанія",
  "Нідерланди",
  "Бельгія",
  "Чехія",
  "Словаччина",
  "Австрія",
  "Угорщина",
  "Румунія",
  "Болгарія",
  "Литва",
  "Латвія",
  "Естонія",
  "Велика Британія",
  "США",
  "Канада",
  "Інше",
];

const ALL_ACCESS_OPTION = { value: "all", label: "Всі групи" };

const normalizeAccessCategoriesSelection = (selectedOptions, actionMeta) => {
  const values = Array.isArray(selectedOptions)
    ? selectedOptions.map((option) => option.value)
    : [];

  if (!values.includes("all")) {
    return values.filter(Boolean);
  }

  if (actionMeta?.action === "select-option") {
    const selectedValue = actionMeta?.option?.value;
    if (selectedValue === "all") {
      return ["all"];
    }
    if (selectedValue) {
      return values.filter((value) => value !== "all");
    }
  }

  if (
    actionMeta?.action === "remove-value" &&
    actionMeta?.removedValue?.value === "all"
  ) {
    return values.filter((value) => value !== "all");
  }

  return ["all"];
};

const accessCategorySelectStyles = {
  container: (provided) => ({
    ...provided,
    width: "100%",
    minWidth: 0,
  }),
  control: (provided, state) => ({
    ...provided,
    minHeight: "44px",
    borderRadius: "0.75rem",
    borderColor: state.isFocused ? "rgb(99 102 241)" : "rgb(229 231 235)",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(99,102,241,0.22)" : "none",
    "&:hover": {
      borderColor: "rgb(99 102 241)",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0.25rem 0.75rem",
    minWidth: 0,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "rgb(107 114 128)",
    fontSize: "0.875rem",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "rgba(99,102,241,0.14)"
      : state.isFocused
        ? "rgba(99,102,241,0.08)"
        : "white",
    color: "rgb(15 23 42)",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.75rem",
    overflow: "hidden",
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderRadius: "0.5rem",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "rgb(67 56 202)",
    fontWeight: 600,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "rgb(67 56 202)",
    ":hover": {
      backgroundColor: "rgba(99,102,241,0.22)",
      color: "rgb(49 46 129)",
    },
  }),
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [shippingPoints, setShippingPoints] = useState([]);
  const [shops, setShops] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [discountProfiles, setDiscountProfiles] = useState([]);
  const [managers, setManagers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [formState, setFormState] = useState(null);
  const [specialDraft, setSpecialDraft] = useState({ groupId: "", percent: "" });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState(() => buildCreateFormState());
  const [createDraftSpecial, setCreateDraftSpecial] = useState({ groupId: "", percent: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [copiedIds, setCopiedIds] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const createEmailRef = useRef(null);

  const normalizeAccessCategories = useCallback((hasFullAccess, accessIds) => {
    if (hasFullAccess) {
      return ["all"];
    }
    const ids = Array.isArray(accessIds) ? accessIds : [];
    return ids.map((id) => String(id));
  }, []);

  const syncFormState = useCallback((user) => {
    const accessCategories = normalizeAccessCategories(
      user.hasFullAccess,
      user.productGroupAccessIds
    );

    setFormState({
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      company: user.company || "",
      companyCode: user.companyCode || "",
      country: user.country || "",
      city: user.city || "",
      address: user.address || "",
      phone: user.phone || "",
      fax: user.fax || "",
      roles: normalizeRoles(user.roles ?? user.role),
      shippingPoint: user.shippingPoint || null,
      departmentShop: user.departmentShop || null,
      discountType: user.discountType || null,
      defaultDiscounts: user.defaultDiscounts || [],
      specialDiscounts: user.specialDiscounts?.map((discount) => ({
        id: discount.id,
        groupId: String(discount.groupId),
        percent: discount.percent,
      })) || [],
      accessCategories,
      managerId: user.managerId ? String(user.managerId) : null,
      lastContact: user.lastContact || "",
      isConfirmed: Boolean(user.isConfirmed),
      password: "",
    });
  }, [normalizeAccessCategories]);

  const resetCreateDialog = useCallback(() => {
    setCreateForm(buildCreateFormState());
    setCreateDraftSpecial({ groupId: "", percent: "" });
  }, []);

  const handleCopyId = useCallback((id) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(id);
    setCopiedIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 2000);
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  useEffect(() => {
    if (selectedUser) {
      syncFormState(selectedUser);
      setSpecialDraft({ groupId: "", percent: "" });
    }
  }, [selectedUser, syncFormState]);

  useEffect(() => {
    if (isCreateDialogOpen && createEmailRef.current) {
      createEmailRef.current.focus();
    }
  }, [isCreateDialogOpen]);

  const handleOpenCreateDialog = () => {
    resetCreateDialog();
    setCreateError(null);
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    resetCreateDialog();
    setCreateError(null);
  };

  const handleCreateFieldChange = (field) => (event) => {
    const value = event.target.value;
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateRoleToggle = (role) => {
    setCreateForm((prev) => {
      const current = new Set(prev.roles);
      if (current.has(role)) {
        current.delete(role);
      } else {
        current.add(role);
      }
      if (current.size === 0) {
        current.add("user");
      }
      return { ...prev, roles: Array.from(current) };
    });
  };

  const handleCreateShippingPoint = (value) => {
    const normalized =
      typeof value === "string" ? value : value?.value ? String(value.value) : null;
    setCreateForm((prev) => ({ ...prev, shippingPoint: normalized }));
  };

  const handleCreateDepartmentShop = (value) => {
    const normalized =
      typeof value === "string" ? value : value?.value ? String(value.value) : null;
    setCreateForm((prev) => ({ ...prev, departmentShop: normalized }));
  };

  const handleCreateDiscountProfile = (value) => {
    const profile = resolveDiscountProfile(value);
    setCreateForm((prev) => ({
      ...prev,
      discountType: value,
      defaultDiscounts: profile ? profile.defaultDiscounts : [],
    }));
  };

  const handleCreateManagerChange = (value) => {
    setCreateForm((prev) => ({ ...prev, managerId: value || null }));
  };

  const handleCreateAccessCategoriesChange = (selectedOptions, actionMeta) => {
    const normalized = normalizeAccessCategoriesSelection(selectedOptions, actionMeta);
    setCreateForm((prev) => ({ ...prev, accessCategories: normalized }));
  };

  const handleCreateDraftChange = (field, value) => {
    setCreateDraftSpecial((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAddSpecial = () => {
    if (!createDraftSpecial.groupId || createDraftSpecial.percent === "") return;
    const percentValue = Number(createDraftSpecial.percent);
    if (Number.isNaN(percentValue)) return;

    setCreateForm((prev) => {
      const existingIndex = prev.specialDiscounts.findIndex(
        (entry) => entry.groupId === createDraftSpecial.groupId
      );
      let nextSpecials;
      if (existingIndex >= 0) {
        nextSpecials = [...prev.specialDiscounts];
        nextSpecials[existingIndex] = {
          groupId: createDraftSpecial.groupId,
          percent: percentValue,
        };
      } else {
        nextSpecials = [
          ...prev.specialDiscounts,
          { groupId: createDraftSpecial.groupId, percent: percentValue },
        ];
      }
      return { ...prev, specialDiscounts: nextSpecials };
    });

    setCreateDraftSpecial({ groupId: "", percent: "" });
  };

  const handleCreateRemoveSpecial = (groupId) => {
    setCreateForm((prev) => ({
      ...prev,
      specialDiscounts: prev.specialDiscounts.filter((item) => item.groupId !== groupId),
    }));
  };

  const validateCreateForm = () => {
    if (!createForm.email.trim() || !createForm.firstName.trim() || !createForm.lastName.trim()) {
      return "Заповніть e-mail, ім'я та прізвище";
    }

    if (!createForm.password.trim()) {
      return "Вкажіть пароль для нового користувача";
    }

    if (createForm.password !== createForm.confirmPassword) {
      return "Паролі не співпадають";
    }

    return null;
  };

  const handleCreateSubmit = async () => {
    const validationError = validateCreateForm();
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const payload = createCreatePayload(createForm);
      await createAdminUser(payload);
      await loadDashboard();
      handleCloseCreateDialog();
    } catch (caught) {
      const message =
        caught?.response?.data?.error ?? caught?.message ?? "Не вдалося створити користувача";
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleFieldChange = useCallback(
    (field) => (event) => {
      const value = event.target.value;
      setFormState((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    []
  );

  
  const handleToggleConfirmed = useCallback(() => {
    setFormState((prev) => {
      if (!prev) {
        return prev;
      }
      return { ...prev, isConfirmed: !prev.isConfirmed };
    });
  }, []);

  const handlePasswordChange = useCallback((event) => {
    const value = event.target.value;
    setFormState((prev) => (prev ? { ...prev, password: value } : prev));
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setPage(1);

    try {
      const data = await fetchAdminUsersDashboard();
      const rawUsers = data?.users ?? data?.Users ?? [];
      const rawBranches = data?.branches ?? data?.Branches ?? [];
      const rawShops = data?.shops ?? data?.Shops ?? [];
      const rawProductGroups =
        data?.productGroups ?? data?.ProductGroups ?? [];
      const rawDiscountProfiles =
        data?.discountProfiles ?? data?.DiscountProfiles ?? [];
      const rawManagers = data?.managers ?? data?.Managers ?? [];

      setUsers(rawUsers.map(mapUserToViewModel));
      setShippingPoints(rawBranches.map(mapBranchToOption));
      setShops(rawShops.map(mapBranchToOption));
      setProductGroups(rawProductGroups.map(mapProductGroupToOption));
      const orderedProfiles = rawDiscountProfiles
        .map(mapDiscountProfileToOption)
        .sort((a, b) => {
          const left = DISCOUNT_PROFILE_PRIORITY[a.code] ?? 99;
          const right = DISCOUNT_PROFILE_PRIORITY[b.code] ?? 99;
          return left - right;
        });

      setDiscountProfiles(orderedProfiles);
      setManagers(rawManagers.map(mapManagerOption));
    } catch (caught) {
      const message =
        caught?.response?.data?.error ??
        caught?.message ??
        "Не вдалося завантажити користувачів";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleDeleteUser = useCallback(async () => {
    if (!selectedUserId) return;
    const confirmation = window.confirm(
      "Ви впевнені, що хочете видалити цього користувача? Дію не можна скасувати."
    );
    if (!confirmation) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAdminUser(selectedUserId);
      setIsPanelOpen(false);
      setSelectedUserId(null);
      setFormState(null);
      await loadDashboard();
    } catch (caught) {
      const message =
        caught?.response?.data?.error ??
        caught?.message ??
        "Не вдалося видалити користувача";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedUserId, loadDashboard]);

  const discountProfileMap = useMemo(() => {
    const map = {};
    discountProfiles.forEach((profile) => {
      if (profile.id) {
        map[profile.id] = profile;
      }
    });
    return map;
  }, [discountProfiles]);

  const productGroupMap = useMemo(() => {
    const map = {};
    productGroups.forEach((group) => {
      if (group.id) {
        map[group.id] = group;
      }
    });
    return map;
  }, [productGroups]);

  const availabilityUploadLocations = useMemo(() => {
    const seen = new Set();
    const locations = [];

    shops.forEach((shop) => {
      if (!shop.id || seen.has(shop.id)) {
        return;
      }
      seen.add(shop.id);
      locations.push({ ...shop, type: "shop" });
    });

    shippingPoints.forEach((branch) => {
      if (!branch.id || seen.has(branch.id)) {
        return;
      }
      seen.add(branch.id);
      locations.push({ ...branch, type: "branch" });
    });

    return locations;
  }, [shops, shippingPoints]);

  const shippingPointOptions = useMemo(() => {
    const seen = new Set();
    const options = [];

    shippingPoints.forEach((branch) => {
      if (!branch.id || seen.has(branch.id)) {
        return;
      }
      seen.add(branch.id);
      options.push({ ...branch, type: "branch" });
    });

    shops.forEach((shop) => {
      if (!shop.id || seen.has(shop.id)) {
        return;
      }
      seen.add(shop.id);
      options.push({ ...shop, type: "shop" });
    });

    return options;
  }, [shops, shippingPoints]);

  const locationSelectOptions = useMemo(
    () =>
      shippingPointOptions.map((point) => ({
        value: point.id,
        label: point.name,
        type: point.type,
      })),
    [shippingPointOptions]
  );

  const locationOptionMap = useMemo(() => {
    const map = {};
    locationSelectOptions.forEach((option) => {
      if (option?.value != null) {
        map[String(option.value)] = option;
      }
    });
    return map;
  }, [locationSelectOptions]);

  const availabilityLocationSelectOptions = useMemo(
    () =>
      availabilityUploadLocations.map((location) => ({
        value: location.id,
        label: location.name,
        type: location.type,
      })),
    [availabilityUploadLocations]
  );

  const availabilityLocationOptionMap = useMemo(() => {
    const map = {};
    availabilityLocationSelectOptions.forEach((option) => {
      if (option?.value != null) {
        map[String(option.value)] = option;
      }
    });
    return map;
  }, [availabilityLocationSelectOptions]);

  const resolveDiscountProfile = useCallback(
    (id) => {
      if (!id) {
        return null;
      }
      return discountProfileMap[id] ?? null;
    },
    [discountProfileMap]
  );

  const resolveGroupName = useCallback(
    (id) => {
      if (!id) {
        return "—";
      }
      if (id === "all") {
        return "Всі групи";
      }
      const group = productGroupMap[id];
      return group?.label || group?.name || id;
    },
    [productGroupMap]
  );

  const accessCategoryOptions = useMemo(() => {
    const groupOptions = productGroups
      .filter((group) => group.id)
      .map((group) => ({
        value: group.id,
        label: group.label || group.name || group.id,
      }));

    return [ALL_ACCESS_OPTION, ...groupOptions];
  }, [productGroups]);

  const accessCategoryOptionMap = useMemo(() => {
    const map = {};
    accessCategoryOptions.forEach((option) => {
      map[option.value] = option;
    });
    return map;
  }, [accessCategoryOptions]);

  const createAccessCategoryValue = useMemo(() => {
    const selected = createForm.accessCategories ?? [];
    const normalized = selected.includes("all") ? ["all"] : selected.filter(Boolean);

    return normalized
      .map(
        (value) =>
          accessCategoryOptionMap[value] || {
            value,
            label: resolveGroupName(value),
          }
      )
      .filter(Boolean);
  }, [createForm.accessCategories, accessCategoryOptionMap, resolveGroupName]);

  const accessCategoryValue = useMemo(() => {
    const selected = formState?.accessCategories ?? [];
    const normalized = selected.includes("all") ? ["all"] : selected.filter(Boolean);

    return normalized
      .map(
        (value) =>
          accessCategoryOptionMap[value] || {
            value,
            label: resolveGroupName(value),
          }
      )
      .filter(Boolean);
  }, [formState, accessCategoryOptionMap, resolveGroupName]);

  const createShippingPointValue = useMemo(() => {
    const id = createForm.shippingPoint;
    if (!id) return null;
    return locationOptionMap[String(id)] || { value: String(id), label: String(id) };
  }, [createForm.shippingPoint, locationOptionMap]);

  const shippingPointValue = useMemo(() => {
    const id = formState?.shippingPoint;
    if (!id) return null;
    return locationOptionMap[String(id)] || { value: String(id), label: String(id) };
  }, [formState?.shippingPoint, locationOptionMap]);

  const createAvailabilityLocationValue = useMemo(() => {
    const id = createForm.departmentShop;
    if (!id) return null;
    return (
      availabilityLocationOptionMap[String(id)] || {
        value: String(id),
        label: String(id),
      }
    );
  }, [createForm.departmentShop, availabilityLocationOptionMap]);

  const availabilityLocationValue = useMemo(() => {
    const id = formState?.departmentShop;
    if (!id) return null;
    return (
      availabilityLocationOptionMap[String(id)] || {
        value: String(id),
        label: String(id),
      }
    );
  }, [formState?.departmentShop, availabilityLocationOptionMap]);

  const formatLocationOptionLabel = useCallback(
    (option) => (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-900">{option.label}</span>
        {option.type && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gray-500">
            {option.type === "shop" ? "Магазин" : "Філія"}
          </span>
        )}
      </div>
    ),
    []
  );

  const newRegistrations = useMemo(
    () => users.filter((user) => user.isNew).length,
    [users]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(lower) ||
        user.email.toLowerCase().includes(lower) ||
        (user.company && user.company.toLowerCase().includes(lower)) ||
        String(user.id).includes(lower)
      );
    });
  }, [users, searchTerm]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  }, [filteredUsers.length, pageSize]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, page, pageSize]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const openUserPanel = (userId) => {
    setSelectedUserId(userId);
    setIsPanelOpen(true);
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isNew: false } : user
      )
    );
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedUserId(null);
    setFormState(null);
  };

  const handleRoleToggle = (value) => {
    setFormState((prev) => {
      const current = new Set(prev.roles ?? []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      if (current.size === 0) {
        current.add("user");
      }
      return { ...prev, roles: Array.from(current) };
    });
  };

  const handleShippingPointChange = (value) => {
    const normalized =
      typeof value === "string" ? value : value?.value ? String(value.value) : null;
    setFormState((prev) => (prev ? { ...prev, shippingPoint: normalized } : prev));
  };

  const handleDepartmentShopChange = (value) => {
    const normalized =
      typeof value === "string" ? value : value?.value ? String(value.value) : null;
    setFormState((prev) => (prev ? { ...prev, departmentShop: normalized } : prev));
  };

  const handleDiscountTypeChange = (value) => {
    const profile = resolveDiscountProfile(value);
    setFormState((prev) => ({
      ...prev,
      discountType: value,
      defaultDiscounts: profile ? profile.defaultDiscounts : [],
    }));
  };

  const handleManagerChange = (value) => {
    setFormState((prev) => (prev ? { ...prev, managerId: value || null } : prev));
  };

  const handleAccessCategoriesChange = (selectedOptions, actionMeta) => {
    const normalized = normalizeAccessCategoriesSelection(selectedOptions, actionMeta);
    setFormState((prev) => (prev ? { ...prev, accessCategories: normalized } : prev));
  };

  const handleSpecialDraftChange = (field, value) => {
    setSpecialDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSpecialDiscount = () => {
    if (!specialDraft.groupId || specialDraft.percent === "") return;
    const percentValue = Number(specialDraft.percent);
    if (Number.isNaN(percentValue)) return;

    setFormState((prev) => {
      if (!prev) return prev;
      const existingIndex = prev.specialDiscounts.findIndex(
        (item) => item.groupId === specialDraft.groupId
      );
      let updatedSpecials;
      if (existingIndex >= 0) {
        updatedSpecials = [...prev.specialDiscounts];
        updatedSpecials[existingIndex] = {
          groupId: specialDraft.groupId,
          percent: percentValue,
        };
      } else {
        updatedSpecials = [
          ...prev.specialDiscounts,
          { groupId: specialDraft.groupId, percent: percentValue },
        ];
      }
      return { ...prev, specialDiscounts: updatedSpecials };
    });

    setSpecialDraft({ groupId: "", percent: "" });
  };

  const handleRemoveSpecialDiscount = (groupId) => {
    setFormState((prev) => ({
      ...prev,
      specialDiscounts: prev.specialDiscounts.filter(
        (item) => item.groupId !== groupId
      ),
    }));
  };

  const handleLastContactChange = (value) => {
    setFormState((prev) => ({ ...prev, lastContact: value }));
  };

  const handleSave = async () => {
    if (!selectedUserId || !formState) return;
    setIsSaving(true);
    setError(null);

    try {
      const payload = createUpdatePayload(formState);
      await updateAdminUser(selectedUserId, payload);
      await loadDashboard();
      setIsPanelOpen(false);
    } catch (caught) {
      const message =
        caught?.response?.data?.error ??
        caught?.message ??
        "Не вдалося зберегти зміни користувача";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <HomeLayout
      children={
        <div className="flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {isLoading && users.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow p-6 text-center text-sm text-gray-500">
              Завантаження даних користувачів...
            </div>
          )}

          <section className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <FaUserShield className="text-indigo-500" />
                  Управління користувачами
                </h2>
                <p className="text-sm text-gray-500 mt-1 max-w-3xl">
                  Перегляд реєстрацій, призначення ролей, торгових точок,
                  знижок та доступів до категорій. Після контакту з клієнтом
                  оновіть дані, аби команда бачила поточний статус.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg">
                  <FaUserShield />
                  <div>
                    <p className="text-xs uppercase tracking-wide">Активні записи</p>
                    <p className="text-lg font-bold">
                      {filteredUsers.length}
                      <span className="text-sm font-medium text-indigo-500 ml-1">користувачі</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleOpenCreateDialog}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  <FaUserPlus />
                  Додати вручну
                </button>
              </div>
            </div>

          </section>

          <section className="bg-white rounded-xl shadow border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1 w-full">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                  type="search"
                  placeholder="Пошук за ім'ям, e-mail, компанією або номером ID"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-500 w-full md:w-auto md:items-end">
                {filteredUsers.length > 0 && (
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} на стор.
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="p-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">
                  Немає користувачів за вашим запитом.
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                          <tr>
                            <th className="px-4 py-3 text-left">ID</th>
                            <th className="px-4 py-3 text-left">Ім'я</th>
                            <th className="px-4 py-3 text-left">Пошта</th>
                            <th className="px-4 py-3 text-left">Компанія</th>
                            <th className="px-4 py-3 text-left">Місце</th>
                            <th className="px-4 py-3 text-left w-44">Телефон</th>
                            <th className="px-4 py-3 text-left">Роль</th>
                            <th className="px-4 py-3 text-left">Точка відвантаження</th>
                            <th className="px-4 py-3 text-left">Тип знижок</th>
                            <th className="px-4 py-3 text-left">Менеджер</th>
                            <th className="px-4 py-3 text-left">Дії</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedUsers.map((user) => {
                            const shippingPoint = shippingPoints.find(
                              (point) => point.id === user.shippingPoint
                            );
                            const discountProfile = resolveDiscountProfile(
                              user.discountType
                            );
                            const roleLabels = normalizeRoles(user.roles ?? user.role).map((roleValue) =>
                              roleOptions.find((role) => role.value === roleValue)?.label || roleValue
                            );

                            return (
                              <tr key={user.id} className="hover:bg-indigo-50/40 transition">
                                <td className="px-4 py-3 text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-semibold">
                                      {formatUserId(user.id)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyId(user.id)}
                                      className="text-indigo-500 hover:text-indigo-700"
                                      aria-label="Скопіювати ID"
                                    >
                                      {copiedIds[user.id] ? <FaCheck /> : <FaCopy />}
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-500 break-words">
                                    {user.id}
                                  </p>
                                  {user.isNew && (
                                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full">
                                      <FaBell className="text-xs" />
                                      New
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-gray-900">{user.name}</div>
                                  <p className="text-xs text-gray-500">
                                    Зареєстровано {new Date(user.registrationDate).toLocaleDateString("uk-UA")}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                <td className="px-4 py-3 text-gray-600">{user.company || "—"}</td>
                                <td className="px-4 py-3 text-gray-600">{user.location || "—"}</td>
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap min-w-[11rem]">
                                  {user.phone || "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    {roleLabels.map((label) => (
                                      <span
                                        key={`${user.id}-${label}`}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full"
                                      >
                                        <FaUserShield />
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {shippingPoint ? shippingPoint.name : "Не призначено"}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {discountProfile ? discountProfile.label : "Не призначено"}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {user.managerDisplayName ? (
                                    <div>
                                      <p className="font-medium text-gray-900">{user.managerDisplayName}</p>
                                      <p className="text-xs text-gray-500">{user.managerEmail}</p>
                                    </div>
                                  ) : (
                                    "Не призначено"
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => openUserPanel(user.id)}
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                                  >
                                    Керувати
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="md:hidden">
                    <div className="grid gap-4">
                      {paginatedUsers.map((user) => {
                        const shippingPoint = shippingPoints.find(
                          (point) => point.id === user.shippingPoint
                        );
                        const discountProfile = resolveDiscountProfile(
                          user.discountType
                        );
                        const roleLabels = normalizeRoles(user.roles ?? user.role).map((roleValue) =>
                          roleOptions.find((role) => role.value === roleValue)?.label || roleValue
                        );
                        const accessLabels = user.accessCategories.includes("all")
                          ? ["Всі групи"]
                          : user.accessCategories.map((categoryId) =>
                              resolveGroupName(categoryId)
                            );

                        return (
                          <article
                            key={`${user.id}-mobile`}
                            className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition flex flex-col gap-4 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">ID</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900 font-mono">
                                    {formatUserId(user.id)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyId(user.id)}
                                    className="text-indigo-500 hover:text-indigo-700"
                                    aria-label="Скопіювати ID"
                                  >
                                    {copiedIds[user.id] ? <FaCheck /> : <FaCopy />}
                                  </button>
                                  {user.isNew && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full">
                                      <FaBell className="text-xs" />
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 break-words">
                                  {user.id}
                                </p>
                              </div>
                              <button
                                onClick={() => openUserPanel(user.id)}
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                              >
                                Керувати
                              </button>
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                Зареєстровано {new Date(user.registrationDate).toLocaleDateString("uk-UA")}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Пошта</p>
                                <p className="text-gray-900 break-words">{user.email}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Компанія</p>
                                <p className="text-gray-900">{user.company || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide текст-gray-500">Місце</p>
                                <p className="text-gray-900">{user.location || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Телефон</p>
                                <p className="text-gray-900">{user.phone || "—"}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs">
                              {roleLabels.map((label) => (
                                <span
                                  key={`${user.id}-mobile-${label}`}
                                  className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full"
                                >
                                  <FaUserShield />
                                  {label}
                                </span>
                              ))}
                              <span className="inline-flex items-center gap-1 font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                                <FaTruck className="text-gray-500" />
                                {shippingPoint ? shippingPoint.name : "Точка не призначена"}
                              </span>
                              <span className="inline-flex items-center gap-1 font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                                <FaPercent className="text-gray-500" />
                                {discountProfile ? discountProfile.label : "Знижки не призначено"}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Останній контакт</p>
                                <p className="text-gray-900">{user.lastContact || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Доступ до категорій</p>
                                {accessLabels.length === 0 ? (
                                  <p className="text-gray-900">—</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {accessLabels.map((label) => (
                                      <span
                                        key={label}
                                        className="inline-flex items-center text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full"
                                      >
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Менеджер</p>
                                {user.managerDisplayName ? (
                                  <div>
                                    <p className="text-gray-900">{user.managerDisplayName}</p>
                                    <p className="text-xs text-gray-500">{user.managerEmail}</p>
                                  </div>
                                ) : (
                                  <p className="text-gray-900">—</p>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={page === 1}
                      >
                        Назад
                      </button>
                      <span className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700">
                        {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={page === totalPages}
                      >
                        Вперед
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {isCreateDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/40" onClick={handleCloseCreateDialog} />
              <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Додати нового користувача</h3>
                    <p className="text-sm text-gray-500">
                      Користувач отримає постійно верифікований акаунт і зможе одразу увійти.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseCreateDialog}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Закрити"
                  >
                    <FaTimes size={18} />
                  </button>
                </header>

                <div className="px-6 py-6 space-y-6">
                  {createError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                      {createError}
                    </div>
                  )}

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">E-mail</label>
                      <input
                        ref={createEmailRef}
                        type="email"
                        value={createForm.email}
                        onChange={handleCreateFieldChange("email")}
                        placeholder="email@example.com"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Пароль</label>
                      <input
                        type="password"
                        value={createForm.password}
                        onChange={handleCreateFieldChange("password")}
                        placeholder="********"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Підтвердження паролю</label>
                      <input
                        type="password"
                        value={createForm.confirmPassword}
                        onChange={handleCreateFieldChange("confirmPassword")}
                        placeholder="********"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-semibold text-gray-800">Персональний менеджер</h4>
                    <select
                      value={formState?.managerId ?? ""}
                      onChange={(event) => handleManagerChange(event.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Без менеджера</option>
                      {managers.map((manager) => (
                        <option key={`edit-manager-${manager.id ?? "none"}`} value={manager.id ?? ""}>
                          {manager.displayName}
                          {manager.email ? ` (${manager.email})` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      Менеджер може переглядати клієнта та замовлення, якщо має відповідні ролі.
                    </p>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Ім'я</label>
                      <input
                        value={createForm.firstName}
                        onChange={handleCreateFieldChange("firstName")}
                        placeholder="Ім'я"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Прізвище</label>
                      <input
                        value={createForm.lastName}
                        onChange={handleCreateFieldChange("lastName")}
                        placeholder="Прізвище"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Компанія</label>
                      <input
                        value={createForm.company}
                        onChange={handleCreateFieldChange("company")}
                        placeholder="Назва підприємства"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Код ЄДРПОУ</label>
                      <input
                        value={createForm.companyCode}
                        onChange={handleCreateFieldChange("companyCode")}
                        placeholder="00000000"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Країна</label>
                      <select
                        value={createForm.country}
                        onChange={handleCreateFieldChange("country")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Оберіть країну</option>
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Місто</label>
                      <input
                        value={createForm.city}
                        onChange={handleCreateFieldChange("city")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Адреса</label>
                      <input
                        value={createForm.address}
                        onChange={handleCreateFieldChange("address")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Телефон</label>
                      <input
                        value={createForm.phone}
                        onChange={handleCreateFieldChange("phone")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Факс</label>
                      <input
                        value={createForm.fax}
                        onChange={handleCreateFieldChange("fax")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaUserShield className="text-indigo-500" />
                      Ролі користувача
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {roleOptions.map((option) => {
                        const isSelected = createForm.roles.includes(option.value);
                        return (
                          <button
                            key={`create-role-${option.value}`}
                            onClick={() => handleCreateRoleToggle(option.value)}
                            type="button"
                            className={`border rounded-lg px-3 py-2 text-sm font-medium flex flex-col gap-1 transition ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                            }`}
                          >
                            <span>{option.label}</span>
                            <span className="text-xs text-gray-500 font-normal">
                              {option.value === "user" && "Бачить лише власну точку"}
                              {option.value === "manager" && "Доступ до менеджерських функцій"}
                              {option.value === "department" && "Доступ до завантаження залишків"}
                              {option.value === "admin" && "Повний доступ до адмінки"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-semibold text-gray-800">Персональний менеджер</h4>
                    <select
                      value={createForm.managerId ?? ""}
                      onChange={(event) => handleCreateManagerChange(event.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Без менеджера</option>
                      {managers.map((manager) => (
                        <option key={`create-manager-${manager.id ?? "none"}`} value={manager.id ?? ""}>
                          {manager.displayName}
                          {manager.email ? ` (${manager.email})` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      Оберіть менеджера з числа користувачів з ролями менеджер або адміністратор.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaTruck className="text-indigo-500" />
                      Точка відвантаження
                    </h4>
                    <div className="space-y-2">
                      <Select
                        isSearchable
                        isClearable
                        options={locationSelectOptions}
                        value={createShippingPointValue}
                        onChange={handleCreateShippingPoint}
                        styles={accessCategorySelectStyles}
                        placeholder="Оберіть точку..."
                        formatOptionLabel={formatLocationOptionLabel}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                      <p className="text-xs text-gray-500">
                        Клієнт бачитиме залишки саме для цієї точки
                      </p>
                    </div>
                  </section>

                  {createForm.roles.includes("department") && (
                    <section className="space-y-3">
                      <h4 className="font-semibold text-gray-800">
                        Магазин / філія підрозділу (для завантаження залишків)
                      </h4>
                      <div className="space-y-3">
                        {availabilityUploadLocations.length === 0 && (
                          <p className="text-sm text-gray-500">
                            Немає доступних магазинів чи філій. Спершу додайте точку відвантаження або магазин.
                          </p>
                        )}

                        {availabilityUploadLocations.length > 0 && (
                          <Select
                            isSearchable
                            isClearable
                            options={availabilityLocationSelectOptions}
                            value={createAvailabilityLocationValue}
                            onChange={handleCreateDepartmentShop}
                            styles={accessCategorySelectStyles}
                            placeholder="Оберіть магазин / філію..."
                            formatOptionLabel={formatLocationOptionLabel}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        )}
                      </div>
                    </section>
                  )}

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaPercent className="text-indigo-500" />
                      Тип знижок
                    </h4>
                    <div className="space-y-3">
                      {discountProfiles.map((profile) => (
                        <label
                          key={`create-discount-${profile.id}`}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                            createForm.discountType === profile.id
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="createDiscountProfile"
                            value={profile.id}
                            checked={createForm.discountType === profile.id}
                            onChange={() => handleCreateDiscountProfile(profile.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{profile.label}</p>
                            <p className="text-xs text-gray-500">{profile.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaPercent className="text-indigo-500" />
                      Спеціальні знижки за категоріями
                    </h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={createDraftSpecial.groupId}
                          onChange={(event) => handleCreateDraftChange("groupId", event.target.value)}
                          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Оберіть групу товарів</option>
                          {productGroups.map((group) => (
                            <option key={`create-special-option-${group.id}`} value={group.id}>
                              {group.label}
                            </option>
                          ))}
                        </select>
                        <input
                          value={createDraftSpecial.percent}
                          onChange={(event) => handleCreateDraftChange("percent", event.target.value)}
                          type="number"
                          min="0"
                          max="100"
                          placeholder="%"
                          className="w-full sm:w-24 shrink-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleCreateAddSpecial}
                          type="button"
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shrink-0"
                        >
                          Додати
                        </button>
                      </div>

                      <div className="space-y-2">
                        {createForm.specialDiscounts.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Спеціальні знижки відсутні. Додайте їх, щоб перевизначити базовий профіль.
                          </p>
                        ) : (
                          createForm.specialDiscounts.map((entry) => (
                            <div
                              key={`create-special-${entry.groupId}`}
                              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{resolveGroupName(entry.groupId)}</p>
                                <p className="text-xs text-gray-500">Нова знижка: {entry.percent}%</p>
                              </div>
                              <button
                                onClick={() => handleCreateRemoveSpecial(entry.groupId)}
                                type="button"
                                className="text-sm text-red-500 hover:text-red-600 font-semibold"
                              >
                                Видалити
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaEye className="text-indigo-500" />
                      Доступ до залишків за категоріями
                    </h4>
                    <Select
                      isMulti
                      isSearchable
                      options={accessCategoryOptions}
                      value={createAccessCategoryValue}
                      onChange={handleCreateAccessCategoriesChange}
                      styles={accessCategorySelectStyles}
                      placeholder="Оберіть категорії..."
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-semibold text-gray-800">Нотатка про статус комунікації</h4>
                    <textarea
                      value={createForm.lastContact}
                      onChange={handleCreateFieldChange("lastContact")}
                      rows={3}
                      placeholder="Опишіть коротко контекст нового клієнта"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </section>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50 rounded-b-xl">
                  <button
                    onClick={handleCloseCreateDialog}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                    disabled={isCreating}
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleCreateSubmit}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                    disabled={isCreating}
                  >
                    {isCreating ? "Створення..." : "Створити"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isPanelOpen && selectedUser && formState && (
            <div className="fixed inset-0 z-40 flex items-end md:items-stretch justify-end">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={closePanel}
                aria-hidden="true"
              />
              <div className="relative w-full md:max-w-2xl bg-white h-full md:h-auto md:min-h-full shadow-2xl overflow-y-auto">
                <header className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <FaUserShield className="text-indigo-500" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Картка клієнта #{formatUserId(selectedUser.id)}</h3>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            ID:
                            <span className="font-mono text-sm text-gray-900">{selectedUser.id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(selectedUser.id)}
                              className="text-indigo-500 hover:text-indigo-700"
                              aria-label="Скопіювати ID"
                            >
                              {copiedIds[selectedUser.id] ? <FaCheck /> : <FaCopy />}
                            </button>
                          </span>
                          <span>Створено: {formatDateTime(selectedUser.registrationDate)}</span>
                          <span>Підтверджено: {formatDateTime(selectedUser.confirmedAt)}</span>
                          <span>Останній вхід: {formatDateTime(selectedUser.lastLoginAt)}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Останній контакт: {selectedUser.lastContact || "не вказано"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closePanel}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Закрити"
                  >
                    <FaTimes size={18} />
                  </button>
                </header>

                <div className="px-6 py-6 space-y-6">
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">E-mail</label>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={handleFieldChange("email")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Телефон</label>
                      <input
                        type="tel"
                        value={formState.phone}
                        onChange={handleFieldChange("phone")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Ім'я</label>
                      <input
                        value={formState.firstName}
                        onChange={handleFieldChange("firstName")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Прізвище</label>
                      <input
                        value={formState.lastName}
                        onChange={handleFieldChange("lastName")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Компанія</label>
                      <input
                        value={formState.company}
                        onChange={handleFieldChange("company")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Код ЄДРПОУ</label>
                      <input
                        value={formState.companyCode}
                        onChange={handleFieldChange("companyCode")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Країна</label>
                      <select
                        value={formState.country}
                        onChange={handleFieldChange("country")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Оберіть країну</option>
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Місто</label>
                      <input
                        value={formState.city}
                        onChange={handleFieldChange("city")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Адреса</label>
                      <input
                        value={formState.address}
                        onChange={handleFieldChange("address")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Факс</label>
                      <input
                        value={formState.fax}
                        onChange={handleFieldChange("fax")}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Статус акаунта</label>
                      <button
                        type="button"
                        onClick={handleToggleConfirmed}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                          formState.isConfirmed
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        }`}
                      >
                        {formState.isConfirmed ? "Підтверджено" : "Не підтверджено"}
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Скинути пароль</label>
                      <input
                        type="password"
                        value={formState.password}
                        onChange={handlePasswordChange}
                        placeholder="Задати новий пароль"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Залиште поле пустим, щоб не змінювати пароль користувача.
                      </p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaUserShield className="text-indigo-500" />
                      Ролі користувача
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {roleOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleRoleToggle(option.value)}
                          type="button"
                          className={`border rounded-lg px-3 py-2 text-sm font-medium flex flex-col gap-1 transition ${
                            (formState.roles ?? []).includes(option.value)
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                          }`}
                        >
                          <span>{option.label}</span>
                          <span className="text-xs text-gray-500 font-normal">
                            {option.value === "user" && "Бачить лише власну точку"}
                            {option.value === "manager" && "Доступ до менеджерських функцій"}
                            {option.value === "department" && "Доступ до завантаження залишків"}
                            {option.value === "admin" && "Повний доступ до адмінки"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaUserShield className="text-indigo-500" />
                      Персональний менеджер
                    </h4>
                    <select
                      value={formState.managerId ?? ""}
                      onChange={(event) => handleManagerChange(event.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Без менеджера</option>
                      {managers.map((manager) => (
                        <option key={`edit-manager-${manager.id ?? "none"}`} value={manager.id ?? ""}>
                          {manager.displayName}
                          {manager.email ? ` (${manager.email})` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      Менеджер може переглядати клієнта та замовлення, якщо має відповідні ролі.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaTruck className="text-indigo-500" />
                      Точка відвантаження
                    </h4>
                    <div className="space-y-2">
                      <Select
                        isSearchable
                        isClearable
                        options={locationSelectOptions}
                        value={shippingPointValue}
                        onChange={handleShippingPointChange}
                        styles={accessCategorySelectStyles}
                        placeholder="Оберіть точку..."
                        formatOptionLabel={formatLocationOptionLabel}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                      <p className="text-xs text-gray-500">
                        Клієнт бачитиме залишки саме для цієї точки
                      </p>
                    </div>
                  </section>

                  {formState.roles.includes("department") && (
                    <section className="space-y-3">
                      <h4 className="font-semibold text-gray-800">
                        Магазин / філія для завантаження залишків
                      </h4>
                      <div className="space-y-3">
                        {availabilityUploadLocations.length === 0 && (
                          <p className="text-sm text-gray-500">
                            Немає доступних магазинів чи філій. Спершу додайте точку відвантаження або магазин.
                          </p>
                        )}

                        {availabilityUploadLocations.length > 0 && (
                          <Select
                            isSearchable
                            isClearable
                            options={availabilityLocationSelectOptions}
                            value={availabilityLocationValue}
                            onChange={handleDepartmentShopChange}
                            styles={accessCategorySelectStyles}
                            placeholder="Оберіть магазин / філію..."
                            formatOptionLabel={formatLocationOptionLabel}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        )}
                      </div>
                    </section>
                  )}

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaPercent className="text-indigo-500" />
                      Тип знижок
                    </h4>
                    <div className="space-y-3">
                      {discountProfiles.map((profile) => (
                        <label
                          key={profile.id}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                            formState.discountType === profile.id
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="discountProfile"
                            value={profile.id}
                            checked={formState.discountType === profile.id}
                            onChange={() => handleDiscountTypeChange(profile.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{profile.label}</p>
                            <p className="text-xs text-gray-500">{profile.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaPercent className="text-indigo-500" />
                      Спеціальні знижки за категоріями
                    </h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <select
                          value={specialDraft.groupId}
                          onChange={(event) =>
                            handleSpecialDraftChange("groupId", event.target.value)
                          }
                          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Оберіть групу товарів</option>
                          {productGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                        <input
                          value={specialDraft.percent}
                          onChange={(event) =>
                            handleSpecialDraftChange("percent", event.target.value)
                          }
                          type="number"
                          min="0"
                          max="100"
                          placeholder="%"
                          className="w-full sm:w-24 shrink-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleAddSpecialDiscount}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shrink-0"
                        >
                          Додати
                        </button>
                      </div>

                      <div className="space-y-2">
                        {formState.specialDiscounts.length === 0 && (
                          <p className="text-sm text-gray-500">
                            Поки що спеціальних знижок немає. Додайте першу, щоб
                            перевизначити значення з обраного типу оптової знижки.
                          </p>
                        )}
                        {formState.specialDiscounts.map((entry) => (
                          <div
                            key={entry.groupId}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {resolveGroupName(entry.groupId)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Нова знижка: {entry.percent}%
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveSpecialDiscount(entry.groupId)}
                              className="text-sm text-red-500 hover:text-red-600 font-semibold"
                            >
                              Видалити
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <FaEye className="text-indigo-500" />
                      Доступ до залишків за категоріями
                    </h4>
                    <Select
                      isMulti
                      isSearchable
                      options={accessCategoryOptions}
                      value={accessCategoryValue}
                      onChange={handleAccessCategoriesChange}
                      styles={accessCategorySelectStyles}
                      placeholder="Оберіть категорії..."
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-semibold text-gray-800">
                      Нотатка про статус комунікації
                    </h4>
                    <textarea
                      value={formState.lastContact}
                      onChange={(event) => handleLastContactChange(event.target.value)}
                      rows={3}
                      placeholder="Опишіть результати останньої розмови, що потрібно зробити далі, хто відповідальний"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </section>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button
                    onClick={handleDeleteUser}
                    className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    disabled={isSaving || isDeleting}
                  >
                    {isDeleting ? "Видалення..." : "Видалити"}
                  </button>
                  <button
                    onClick={closePanel}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    disabled={isSaving || isDeleting}
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                    disabled={isSaving || isDeleting}
                  >
                    <FaSave />
                    {isSaving ? "Збереження..." : "Зберегти"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
