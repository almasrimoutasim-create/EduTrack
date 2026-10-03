/**
 * يجعل جداول المحتوى تظهر كبطاقات عمودية على الهواتف.
 * - يقرأ نصوص thead ويحقنها كـ data-label لكل خلية حسب العمود.
 * - يعمل فقط تحت 640px عبر CSS (الديسكتوب لا يتأثر).
 * - يستثنى جداول الشهادات المطبوعة بمقاسات A4 ثابتة.
 */

const EXCLUDED_SELECTOR = [
  ".sudan-subjects-table",
  ".sudan-mini-table",
  ".pro-horizontal-table",
  ".absence-mini-table",
  ".pro-cover-grid",
].join(",");

export function enhanceResponsiveTables(root = document) {
  if (typeof document === "undefined") return;
  const scope = root && root.querySelectorAll ? root : document;
  const tables = scope.querySelectorAll
    ? scope.querySelectorAll("main table")
    : document.querySelectorAll("main table");

  tables.forEach((table) => {
    if (table.matches(EXCLUDED_SELECTOR)) return;
    if (table.hasAttribute("data-no-cards")) return;

    const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
      (th.textContent || "").trim().replace(/\s+/g, " ")
    );
    if (headers.length === 0) return;

    const bodies = table.tBodies.length > 0 ? Array.from(table.tBodies) : [table];
    bodies.forEach((tbody) => {
      Array.from(tbody.rows).forEach((row) => {
        // تجاهل صفوف الهيدر المكررة داخل الجسم
        if (row.closest("thead")) return;
        Array.from(row.cells).forEach((cell, idx) => {
          if (!cell.getAttribute("data-label") && headers[idx]) {
            cell.setAttribute("data-label", headers[idx]);
          }
        });
      });
    });
  });
}

export default enhanceResponsiveTables;
