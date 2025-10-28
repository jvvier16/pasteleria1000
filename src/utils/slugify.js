export function slugify(text) {
  if (!text) return "";
  // Normalizar acentos
  const from = "ÁÀÂÄáàâäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÖóòôöÚÙÛÜúùûüÑñÇç";
  const to = "AAAAaaaaEEEEeeeeIIIIiiiiOOOOooooUUUUuuuuNnCc";
  let s = text.split("").map((ch) => {
    const idx = from.indexOf(ch);
    return idx > -1 ? to[idx] : ch;
  }).join("");
  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9\s-]/g, "");
  s = s.trim().replace(/\s+/g, "-");
  s = s.replace(/-+/g, "-");
  return s;
}

export default slugify;
