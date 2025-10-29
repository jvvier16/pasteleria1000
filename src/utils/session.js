export function getSessionUser() {
  try {
    const raw = localStorage.getItem("session_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
export function setSessionUser(u) {
  try {
    localStorage.setItem("session_user", JSON.stringify(u));
  } catch (e) {}
}
export function clearSessionUser() {
  try {
    localStorage.removeItem("session_user");
  } catch (e) {}
}

export default { getSessionUser, setSessionUser, clearSessionUser };
