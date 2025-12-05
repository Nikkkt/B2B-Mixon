const CODE_SEPARATOR_CANDIDATES = [" - ", " – ", " — ", "-", "–", "—"];
const PROGRAM_CODE_CHARS_REGEX = /^[A-Za-zА-Яа-я0-9._/-]+$/;

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

    if (looksLikeProgramCode(codePart)) {
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

const looksLikeProgramCode = (value) => {
  if (!value) {
    return false;
  }

  const candidate = String(value).trim();
  if (!candidate) {
    return false;
  }

  if (!PROGRAM_CODE_CHARS_REGEX.test(candidate)) {
    return false;
  }

  return /[0-9]/.test(candidate);
};
