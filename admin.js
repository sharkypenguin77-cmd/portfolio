const categoryLabels = {
  brand: "形象影片",
  short: "短影音",
  "social-ad": "社群廣告",
  youtube: "YT長片",
  nonprofit: "公益影片"
};

let works = structuredClone(window.portfolioWorks || []);
let activeIndex = works.length ? 0 : -1;

const form = document.querySelector("#work-form");
const list = document.querySelector("#work-list");
const statusBox = document.querySelector("#status");
const saveButton = document.querySelector("#save-button");
const deployButton = document.querySelector("#deploy-button");
const newButton = document.querySelector("#new-button");
const deleteButton = document.querySelector("#delete-button");
const fields = form.elements;

function setStatus(message) {
  statusBox.textContent = message;
}

function getEmbedUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const id = parsed.searchParams.get("v") || segments.at(-1);
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).at(-1);
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }

    if (host === "player.vimeo.com") return url;
  } catch (error) {
    return "";
  }

  return "";
}

function emptyWork() {
  const year = new Date().getFullYear().toString();
  return {
    title: "",
    year,
    category: "brand",
    categoryLabel: "形象影片",
    role: "",
    tools: "",
    description: "",
    videoUrl: "",
    embedUrl: "",
    thumbnailUrl: "",
    isSample: false
  };
}

function renderList() {
  list.innerHTML = "";

  works.forEach((work, index) => {
    const button = document.createElement("button");
    button.className = `work-item${index === activeIndex ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `<strong>${work.title || "未命名作品"}</strong><span>${work.categoryLabel || categoryLabels[work.category] || "未分類"} / ${work.year || ""}</span>`;
    button.addEventListener("click", () => {
      activeIndex = index;
      renderList();
      loadForm();
    });
    list.append(button);
  });
}

function loadForm() {
  const work = activeIndex >= 0 ? works[activeIndex] : emptyWork();
  fields.title.value = work.title || "";
  fields.year.value = work.year || "";
  fields.category.value = work.category || "brand";
  fields.role.value = work.role || "";
  fields.tools.value = work.tools || "";
  fields.videoUrl.value = work.videoUrl || "";
  fields.embedUrl.value = work.embedUrl || getEmbedUrl(work.videoUrl);
  fields.thumbnailUrl.value = work.thumbnailUrl || "";
  fields.description.value = work.description || "";
  fields.isSample.checked = Boolean(work.isSample);
}

function readForm() {
  const category = fields.category.value;
  const videoUrl = fields.videoUrl.value.trim();
  return {
    title: fields.title.value.trim(),
    year: fields.year.value.trim(),
    category,
    categoryLabel: categoryLabels[category],
    role: fields.role.value.trim(),
    tools: fields.tools.value.trim(),
    description: fields.description.value.trim(),
    videoUrl,
    embedUrl: getEmbedUrl(videoUrl),
    thumbnailUrl: fields.thumbnailUrl.value.trim(),
    isSample: fields.isSample.checked
  };
}

fields.videoUrl.addEventListener("input", () => {
  fields.embedUrl.value = getEmbedUrl(fields.videoUrl.value.trim());
});

fields.category.addEventListener("change", () => {
  const work = readForm();
  fields.embedUrl.value = work.embedUrl;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const work = readForm();

  if (activeIndex === -1) {
    works.unshift(work);
    activeIndex = 0;
  } else {
    works[activeIndex] = work;
  }

  renderList();
  loadForm();
  setStatus("已套用到清單。記得按「儲存作品資料」寫入 works.js。");
});

newButton.addEventListener("click", () => {
  works.unshift(emptyWork());
  activeIndex = 0;
  renderList();
  loadForm();
  setStatus("已建立新作品，填完後按「套用到清單」。");
});

deleteButton.addEventListener("click", () => {
  if (activeIndex < 0) return;
  const title = works[activeIndex].title || "未命名作品";
  const confirmed = window.confirm(`確定刪除「${title}」嗎？`);
  if (!confirmed) return;

  works.splice(activeIndex, 1);
  activeIndex = works.length ? Math.min(activeIndex, works.length - 1) : -1;
  renderList();
  loadForm();
  setStatus("已從清單刪除。記得按「儲存作品資料」寫入 works.js。");
});

saveButton.addEventListener("click", async () => {
  const response = await fetch("/api/works", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(works)
  });
  const text = await response.text();
  setStatus(text);
});

deployButton.addEventListener("click", async () => {
  const confirmed = window.confirm("部署會把 works.js commit 並 push 到 GitHub，確定要繼續嗎？");
  if (!confirmed) return;

  setStatus("部署中，請稍候...");
  const response = await fetch("/api/deploy", { method: "POST" });
  const text = await response.text();
  setStatus(text);
});

renderList();
loadForm();
