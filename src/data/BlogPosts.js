// Centraliza los posts del blog para poder reutilizarlos en la UI (Navbar, índice, etc.)
const img = (path) => new URL(path, import.meta.url).href;

const posts = [
  {
    slug: "/blog/uno",
    title: "7 trucos para un bizcocho ultra esponjoso",
    excerpt:
      "Temperatura ambiente, emulsión correcta y horneado sin sobresaltos: te cuento los secretos que usamos en la pastelería para lograr migas perfectas.",
    image: img("../assets/img/torta circular de vainilla.jpeg"),
    tag: "Técnica",
    readTime: "5 min",
    date: "2025-10-12",
  },
  {
    slug: "/blog/dos",
    title: "Ganache de chocolate perfecto (y 3 usos irresistibles)",
    excerpt:
      "Proporciones exactas para distintos cacaos, cómo evitar que se corte y tres aplicaciones fáciles: cobertura brillante, relleno montado y drip.",
    image: img("../assets/img/Torta Cuadrada de Chocolate.webp"),
    tag: "Chocolate",
    readTime: "6 min",
    date: "2025-10-18",
  },
];

export default posts;
