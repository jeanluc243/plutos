import type { DashboardLanguage } from "../language";

export const countries = [
  { code: "CD", en: "Democratic Republic of the Congo", fr: "République démocratique du Congo" },
  { code: "ZA", en: "South Africa", fr: "Afrique du Sud" },
  { code: "AO", en: "Angola", fr: "Angola" },
  { code: "ZM", en: "Zambia", fr: "Zambie" },
  { code: "TZ", en: "Tanzania", fr: "Tanzanie" },
  { code: "KE", en: "Kenya", fr: "Kenya" },
  { code: "RW", en: "Rwanda", fr: "Rwanda" },
  { code: "UG", en: "Uganda", fr: "Ouganda" },
  { code: "CN", en: "China", fr: "Chine" },
  { code: "IN", en: "India", fr: "Inde" },
  { code: "ID", en: "Indonesia", fr: "Indonésie" },
  { code: "MY", en: "Malaysia", fr: "Malaisie" },
  { code: "SG", en: "Singapore", fr: "Singapour" },
  { code: "TH", en: "Thailand", fr: "Thaïlande" },
  { code: "TR", en: "Türkiye", fr: "Turquie" },
  { code: "AE", en: "United Arab Emirates", fr: "Émirats arabes unis" },
  { code: "BE", en: "Belgium", fr: "Belgique" },
  { code: "FR", en: "France", fr: "France" },
  { code: "DE", en: "Germany", fr: "Allemagne" },
  { code: "GB", en: "United Kingdom", fr: "Royaume-Uni" },
  { code: "US", en: "United States", fr: "États-Unis" },
] as const;

export type CountryCode = (typeof countries)[number]["code"];

const citiesByCountry = {
  CN: [
    { value: "Beijing", en: "Beijing", fr: "Pékin" },
    { value: "Shanghai", en: "Shanghai", fr: "Shanghai" },
    { value: "Guangzhou", en: "Guangzhou", fr: "Guangzhou" },
    { value: "Shenzhen", en: "Shenzhen", fr: "Shenzhen" },
    { value: "Yiwu", en: "Yiwu", fr: "Yiwu" },
    { value: "Ningbo", en: "Ningbo", fr: "Ningbo" },
    { value: "Qingdao", en: "Qingdao", fr: "Qingdao" },
    { value: "Xiamen", en: "Xiamen", fr: "Xiamen" },
  ],
  CD: [
    { value: "Kinshasa", en: "Kinshasa", fr: "Kinshasa" },
    { value: "Lubumbashi", en: "Lubumbashi", fr: "Lubumbashi" },
    { value: "Kolwezi", en: "Kolwezi", fr: "Kolwezi" },
    { value: "Goma", en: "Goma", fr: "Goma" },
    { value: "Matadi", en: "Matadi", fr: "Matadi" },
    { value: "Kisangani", en: "Kisangani", fr: "Kisangani" },
    { value: "Bukavu", en: "Bukavu", fr: "Bukavu" },
  ],
} as const;

export function citiesForCountry(code: string) {
  return citiesByCountry[code as keyof typeof citiesByCountry];
}

export function findCountry(code: string) {
  return countries.find((country) => country.code === code);
}

export function countryName(code: string, language: DashboardLanguage) {
  const country = findCountry(code);
  return country?.[language] ?? code;
}
