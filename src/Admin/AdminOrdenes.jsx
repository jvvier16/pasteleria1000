import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import boletasSeed from "../data/Boleta.json";

/**
 * AdminOrdenes
 * Muestra y administra las órdenes guardadas en localStorage (pedidos_local)
 */
export default function AdminOrdenes() {
	const [ordenes, setOrdenes] = useState([]);
	const [filtro, setFiltro] = useState("todos");
	const navigate = useNavigate();
	const location = useLocation();
	const [showOnlyMine, setShowOnlyMine] = useState(false);

	useEffect(() => {
		// proteger ruta: solo admin (intentar validar desde session_user)
		try {
			const raw = localStorage.getItem("session_user");
			if (!raw) return navigate("/");
			const s = JSON.parse(raw);
			const role = (s?.role || s?.rol || s?.roleName || "").toString().toLowerCase();
			if (role !== "admin" && role !== "tester") return navigate("/");
		} catch {
			navigate("/");
		}

			const load = () => {
				try {
					const raw = localStorage.getItem("pedidos_local");
					let arr = [];
					
					// Intentar cargar desde localStorage
					if (raw) {
						const parsed = JSON.parse(raw);
						if (Array.isArray(parsed)) {
							arr = parsed;
						}
					}
					
					// Si no hay datos en localStorage, usar datos de Boleta.json
					if (arr.length === 0 && Array.isArray(boletasSeed) && boletasSeed.length > 0) {
						arr = boletasSeed;
						// Guardar los datos semilla en localStorage para futuros accesos
						localStorage.setItem("pedidos_local", JSON.stringify(arr));
					}

					// Ordenar por fecha descendente (más reciente primero)
					arr.sort((a, b) => {
						const dateA = new Date(a.fecha || a.createdAt || 0);
						const dateB = new Date(b.fecha || b.createdAt || 0);
						return dateB - dateA;
					});

					setOrdenes(arr);
				} catch (error) {
					console.error("Error cargando órdenes:", error);
					setOrdenes([]);
				}
			};

		load();
			// si venimos desde Perfil, activar filtro "mis pedidos"
			if (location && location.state && location.state.fromPerfil) {
				setShowOnlyMine(true);
			}
		const onStorage = () => load();
		window.addEventListener("storage", onStorage);
		window.addEventListener("pedidos:updated", onStorage);
		return () => {
			window.removeEventListener("storage", onStorage);
			window.removeEventListener("pedidos:updated", onStorage);
		};
	}, [navigate]);

	const handleEliminar = (id) => {
		if (!window.confirm("Eliminar orden?")) return;
		try {
			const raw = localStorage.getItem("pedidos_local");
			const arr = raw ? JSON.parse(raw) : [];
			const next = arr.filter((o) => o.id !== id);
			localStorage.setItem("pedidos_local", JSON.stringify(next));
			setOrdenes(next.reverse());
			try { window.dispatchEvent(new Event("pedidos:updated")); } catch (e) {}
		} catch (err) {
			console.error(err);
		}
	};

	const handleChangeEstado = (id, nuevoEstado) => {
		try {
			const raw = localStorage.getItem("pedidos_local");
			const arr = raw ? JSON.parse(raw) : [];
			const next = arr.map((o) => (o.id === id ? { ...o, estado: nuevoEstado } : o));
			localStorage.setItem("pedidos_local", JSON.stringify(next));
			setOrdenes(next.reverse());
			try { window.dispatchEvent(new Event("pedidos:updated")); } catch (e) {}
		} catch (err) {
			console.error(err);
		}
	};

		let filteredOrdenes = ordenes.filter((o) => {
			if (filtro === "todos") return true;
			return (o.estado || "pendiente") === filtro;
		});

		// Si se solicitó ver solo los pedidos del usuario actual (desde perfil), filtrar por userId
		if (showOnlyMine) {
			try {
				const raw = localStorage.getItem('session_user');
				const u = raw ? JSON.parse(raw) : null;
				if (u && u.id) {
					filteredOrdenes = filteredOrdenes.filter((o) => String(o.userId) === String(u.id) || (o.cliente && (o.cliente.correo === u.correo || o.cliente.nombre === u.nombre)));
				}
			} catch (e) {
				// ignore
			}
		}

	return (
		<div className="container py-4">
					<div className="d-flex align-items-center justify-content-between mb-3">
						<h3>Órdenes <small className="text-muted">({ordenes.length})</small></h3>
						<div className="d-flex gap-2 align-items-center">
							<div className="d-flex align-items-center">
								<label className="mb-0 small text-muted me-2">Filtrar:</label>
								<select className="form-select form-select-sm" style={{ width: 160 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
									<option value="todos">Todos</option>
									<option value="pendiente">Pendientes</option>
									<option value="procesado">Procesados</option>
									<option value="enviado">Enviados</option>
								</select>
							</div>
							<div>
								<button className="btn btn-sm btn-outline-secondary" onClick={() => setShowOnlyMine((s) => !s)}>
									{showOnlyMine ? 'Ver todos' : 'Ver solo mis pedidos'}
								</button>
							</div>
						</div>
					</div>

			{filteredOrdenes.length === 0 ? (
				<div className="alert alert-info">No hay órdenes registradas.</div>
			) : (
				filteredOrdenes.map((o) => (
					<div key={o.id} className="card mb-3">
						<div className="card-body">
							<div className="d-flex justify-content-between align-items-start">
								<div>
									<h5>Pedido {o.id}</h5>
									<small className="text-muted">{new Date(o.fecha || o.createdAt || Date.now()).toLocaleString()}</small>
									<div>
										<strong>Cliente:</strong> {o.cliente?.nombre || "-"} {o.cliente?.correo ? `— ${o.cliente.correo}` : ""}
									</div>
									<div className="mt-1">
										<span className={`badge ${ (o.estado === 'pendiente' && 'bg-warning text-dark') || (o.estado === 'procesado' && 'bg-primary') || (o.estado === 'enviado' && 'bg-success') || 'bg-secondary' }`}>
											{(o.estado || 'pendiente').toUpperCase()}
										</span>
									</div>
								</div>
								<div className="text-end">
									<h6>Total: ${Number(o.total || 0).toLocaleString("es-CL")}</h6>
								</div>
							</div>

							<hr />
							<ul>
								{(o.items || []).map((it, i) => (
									<li key={i}>{it.nombre || it.id} x {it.cantidad} — ${Number(it.precio || 0).toLocaleString("es-CL")}</li>
								))}
							</ul>

							<div className="d-flex justify-content-end gap-2">
								<div className="btn-group" role="group">
									{o.estado !== "procesado" && (
										<button className="btn btn-sm btn-outline-primary" onClick={() => handleChangeEstado(o.id, "procesado")}>Marcar procesado</button>
									)}
									{o.estado !== "enviado" && (
										<button className="btn btn-sm btn-outline-success" onClick={() => handleChangeEstado(o.id, "enviado")}>Marcar enviado</button>
									)}
									<button className="btn btn-sm btn-outline-danger" onClick={() => handleEliminar(o.id)}>Eliminar</button>
								</div>
							</div>
						</div>
					</div>
				))
			)}
		</div>
	);
}

