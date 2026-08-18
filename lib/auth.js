export function isAdmin(req) {
  const c = req.cookies.get("kh_admin");
  return !!c && c.value === "true";
}
