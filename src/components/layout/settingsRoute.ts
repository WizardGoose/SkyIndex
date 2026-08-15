export const SETTINGS_PARAM = "settings";
export const SETTINGS_SECTION_PARAM = "settingsSection";

export interface SettingsLocation {
  pathname: string;
  search: string;
  hash: string;
}

const searchWithSettings = (search: string, section?: string): string => {
  const params = new URLSearchParams(search);
  params.set(SETTINGS_PARAM, "1");
  if (section) params.set(SETTINGS_SECTION_PARAM, section);
  else params.delete(SETTINGS_SECTION_PARAM);
  return `?${params.toString()}`;
};

export const closeSettingsSearch = (search: string): string => {
  const params = new URLSearchParams(search);
  params.delete(SETTINGS_PARAM);
  params.delete(SETTINGS_SECTION_PARAM);
  const next = params.toString();
  return next ? `?${next}` : "";
};

export const closeSettingsLocation = (location: SettingsLocation): SettingsLocation => ({
  pathname: location.pathname,
  search: closeSettingsSearch(location.search),
  hash: location.hash,
});

export const settingsLocation = (
  location: SettingsLocation,
  section?: string,
): SettingsLocation => ({
  pathname: location.pathname,
  search: searchWithSettings(location.search, section),
  hash: location.hash,
});

export const legacySettingsLocation = (location: SettingsLocation): SettingsLocation => {
  const section = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
  return {
    pathname: "/",
    search: searchWithSettings(location.search, section || undefined),
    hash: "",
  };
};
