// Fictional manual fixture. No network requests or form submission.
let clicks = 0,
  drags = 0;
const show = () => {
  document.getElementById("events").textContent =
    `サイト側のクリック ${clicks} 回 / ドラッグ ${drags} 回`;
};
for (const el of document.querySelectorAll("[data-action]")) {
  el.addEventListener("click", () => {
    clicks++;
    show();
  });
  el.addEventListener("dragstart", () => {
    drags++;
    show();
  });
}
const ctx = document.querySelector("canvas").getContext("2d");
ctx.fillStyle = "#e1e7df";
ctx.fillRect(0, 0, 230, 90);
ctx.fillStyle = "#292b2d";
ctx.font = "18px sans-serif";
ctx.fillText("Canvasの文字", 16, 52);
