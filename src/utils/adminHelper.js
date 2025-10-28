/**
 * Verifica si el usuario actual tiene permisos de administrador
 * @returns {boolean} true si es admin, false en caso contrario
 */
/**
 * Verifica si el usuario actual tiene permisos de administrador
 * @returns {boolean} true si es admin, false en caso contrario
 */
export function checkAdmin() {
  try {
    const sessionRaw = localStorage.getItem("session_user");
    if (!sessionRaw) {
      console.debug("No hay sesión");
      return false;
    }
    const session = JSON.parse(sessionRaw);
    const isAdmin = session.role === "admin";
    console.debug("¿Es admin?", isAdmin);
    return isAdmin;
  } catch (error) {
    console.error("Error al verificar permisos:", error);
    return false;
  }
}