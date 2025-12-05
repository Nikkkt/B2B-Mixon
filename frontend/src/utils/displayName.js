const CODE_SEPARATOR_CANDIDATES = [" - ", " – ", " — ", "-", "–", "—"];
const PROGRAM_CODE_REGEX = /^[A-Za-zА-Яа-я]{2,6}[-_/]?\d{1,4}$/;

export const stripProgramCode = (value) => {
  if (value == null) {
    return "";
  }

  const text = String(value).trim();
  if (!text) {
    return "";
  }

  for (const separator of CODE_SEPARATOR_CANDIDATES) {
    const separatorIndex = text.indexOf(separator);
    if (separatorIndex === -1) {
      continue;
    }

    const codePart = text.slice(0, separatorIndex).trim();
    const namePart = text.slice(separatorIndex + separator.length).trim();

    if (!namePart) {
      continue;
    }

    if (PROGRAM_CODE_REGEX.test(codePart)) {
      return namePart;
    }
  }

  return text;
};

export const pickReadableValue = (candidates = [], fallback = "—") => {
  for (const candidate of candidates) {
    const cleanValue = stripProgramCode(candidate);
    if (cleanValue) {
      return cleanValue;
    }
  }
  return fallback;
};
