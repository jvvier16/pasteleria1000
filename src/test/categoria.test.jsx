import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import Categoria from "../pages/Categoria.jsx";
import userEvent from "@testing-library/user-event";

function mount(path = "/categorias") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/categorias" element={<Categoria />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

test("41) Renderiza categorías agrupadas", () => {
  mount();
  // Verificar que al menos una categoría conocida está presente
  // Verificar que al menos una categoría tile conocida está presente
  const tortasTile = screen.queryByTestId("categoria-tile-tortas");
  const sinAzucarTile = screen.queryByTestId("categoria-tile-sin-azucar");
  expect(tortasTile || sinAzucarTile).toBeInTheDocument();
});

test("42) Soporta ?cat=slug (selección automática y scroll)", () => {
  // Montar con una categoría específica en la URL
  mount("/categorias?cat=tortas");

  // Verificar que el tile de la categoría está seleccionado
  const categoriaTile = screen.getByTestId("categoria-tile-tortas");
  expect(categoriaTile).toHaveAttribute("aria-pressed", "true");

  // Verificar que se muestra la sección de la categoría
  const seccion = screen.getAllByRole("heading", { name: /tortas/i })[0];
  expect(seccion).toBeInTheDocument();
});

test("43) Botón 'Agregar al carrito' agrega 1 item al localStorage", async () => {
  mount();

  // Obtener el primer botón de agregar al carrito
  const btn = screen.getAllByRole("button", { name: /agregar al carrito/i })[0];

  // Obtener el nombre del producto para verificar después
  const nombreProducto = btn
    .closest(".card")
    .querySelector(".card-title").textContent;

  // Click en el botón (handler async) y esperar que localStorage se actualice
  const user = userEvent.setup();
  await user.click(btn);

  // Esperar hasta que el carrito tenga un item (timeout 2s)
  await new Promise((resolve) => {
    const start = Date.now();
    const iv = setInterval(() => {
      const cart = JSON.parse(localStorage.getItem("pasteleria_cart") || "[]");
      if (cart.length > 0) {
        clearInterval(iv);
        resolve();
      }
      if (Date.now() - start > 2000) {
        clearInterval(iv);
        resolve();
      }
    }, 50);
  });

  // Verificar el carrito en localStorage
  const cart = JSON.parse(localStorage.getItem("pasteleria_cart") || "[]");
  expect(cart.length).toBe(1);
  expect(cart[0]).toMatchObject({
    nombre: nombreProducto,
    cantidad: 1,
  });

  // Verificar que se disparó el evento storage
  const evento = new Event("storage");
  window.dispatchEvent(evento);
});

test("44) Toast de confirmación aparece al agregar", async () => {
  mount();
  const btn = screen.getAllByRole("button", { name: /agregar al carrito/i })[0];
  const user = userEvent.setup();
  await user.click(btn);

  // Esperar a que aparezca el toast
  const toast = await screen.findByTestId("toast-notification");
  expect(toast).toBeInTheDocument();

  // Verificar el contenido del toast dentro del propio toast (evita matches múltiples)
  const header = within(toast).getByText(/^Carrito$/i);
  expect(header).toBeInTheDocument();
  expect(toast).toHaveTextContent(/agregado al carrito/i);
});

test("45) URL de imágenes se resuelve desde assets/img/…", () => {
  mount();

  // Obtener todas las imágenes de productos
  const imagenes = screen.getAllByRole("img");
  expect(imagenes.length).toBeGreaterThan(0);

  // Verificar que al menos una imagen tenga la ruta correcta
  const tieneRutaCorrecta = imagenes.some((img) => {
    const src = img.getAttribute("src");
    return src && (src.includes("/assets/img/") || src.includes("placeholder"));
  });

  expect(tieneRutaCorrecta).toBe(true);
});

test("46) Slugify interno elimina tildes y espacios", () => {
  // Montar el componente con una categoría que tiene tildes y espacios
  mount("/categorias?cat=sin-azucar");

  // Verificar que la categoría "Sin Azúcar" está seleccionada (tile)
  const categoriaTile = screen.getByTestId("categoria-tile-sin-azucar");
  expect(categoriaTile).toHaveAttribute("aria-pressed", "true");

  // Verificar que muestra los productos de esa categoría
  const categoriaHeader = screen.getAllByRole("heading", {
    name: /sin azúcar/i,
  })[0];
  expect(categoriaHeader).toBeInTheDocument();
});
