// Pedidos: muestra las órdenes guardadas en `pedidos_local` para el usuario autenticado.
import React, { useEffect, useState } from "react";

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("session_user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      setUser(u);
    } catch (err) {
      setUser(null);
    }

    try {
      const raw = localStorage.getItem("pedidos_local");
      const all = raw ? JSON.parse(raw) : [];
      setPedidos(all);
    } catch (err) {
      setPedidos([]);
    }
  }, []);

  if (!user) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          Necesitas iniciar sesión para ver tus pedidos.
        </div>
      </div>
    );
  }

  const userPedidos = pedidos.filter((p) => p.userId === user.id);

  return (
    <div className="container py-5">
      <h3>Mis Pedidos</h3>
      {userPedidos.length === 0 ? (
        <p className="text-muted">No tienes pedidos registrados.</p>
      ) : (
        userPedidos.map((p) => (
          <div key={p.id} className="card mb-3">
            <div className="card-body">
              <h5>
                Pedido #{p.id} - {new Date(p.createdAt).toLocaleString()}
              </h5>
              <p>Total: ${Number(p.total).toLocaleString("es-CL")}</p>
              <ul>
                {p.items.map((it) => (
                  <li key={it.id}>
                    {it.nombre} x {it.cantidad} — $
                    {Number(it.precio).toLocaleString("es-CL")}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Pedidos;
