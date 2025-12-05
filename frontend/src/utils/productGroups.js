const parseNumericGroupNumber = (value) => {
  if (value == null) {
    return { numeric: null, text: "" };
  }

  const text = String(value).trim();
  if (!text) {
    return { numeric: null, text: "" };
  }

  const numericPart = text
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");

  const numeric = numericPart ? Number(numericPart) : null;
  return {
    numeric: Number.isFinite(numeric) ? numeric : null,
    text
  };
};

export const sortGroupsByNumber = (groups = []) => {
  return [...groups].sort((a, b) => {
    const groupA = parseNumericGroupNumber(a?.groupNumber);
    const groupB = parseNumericGroupNumber(b?.groupNumber);

    if (groupA.numeric != null && groupB.numeric != null && groupA.numeric !== groupB.numeric) {
      return groupA.numeric - groupB.numeric;
    }

    if (groupA.text || groupB.text) {
      const textCompare = (groupA.text || "").localeCompare(groupB.text || "", undefined, {
        numeric: true,
        sensitivity: "base"
      });
      if (textCompare !== 0) {
        return textCompare;
      }
    }

    return (a?.name || "").localeCompare(b?.name || "", undefined, { sensitivity: "base" });
  });
};
