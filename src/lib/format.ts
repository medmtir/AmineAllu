export const formatDT = (n: number | string | null | undefined) => {
  const num = Number(n ?? 0);
  return num.toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " DT";
};

export const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR");
};

export const COMPANY = {
  name: "ALU MED AMINE",
  tagline: "Spécialiste Aluminium",
  owner: "Med Amine",
  address: "Route El Borjin, Ouerdanine, Monastir",
  phone: "24 587 206",
  facebook: "Amine Alu",
  email: "contact@alumedamine.tn",
};
