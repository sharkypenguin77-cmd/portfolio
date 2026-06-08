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
const uploadVideoButton = document.querySelector("#upload-video-button");
const uploadCoverButton = document.querySelector("#upload-cover-button");
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

function getYoutubeThumbnailUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let id = "";

    if (host === "youtu.be") {
      id = parsed.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const segments = parsed.pathname.split("/").filter(Boolean);
      id = parsed.searchParams.get("v") || segments.at(-1) || "";
    }

    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
  } catch (error) {
    return "";
  }
}

function isDirectVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
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
  fields.videoFile.value = "";
  fields.coverFile.value = "";
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

function applyFormToActiveWork() {
  const work = readForm();

  if (activeIndex === -1) {
    works.unshift(work);
    activeIndex = 0;
  } else {
    works[activeIndex] = work;
  }

  renderList();
}

fields.videoUrl.addEventListener("input", () => {
  const videoUrl = fields.videoUrl.value.trim();
  fields.embedUrl.value = isDirectVideoUrl(videoUrl) ? "" : getEmbedUrl(videoUrl);

  if (!fields.thumbnailUrl.value.trim()) {
    fields.thumbnailUrl.value = getYoutubeThumbnailUrl(videoUrl);
  }
});

fields.category.addEventListener("change", () => {
  const work = readForm();
  fields.embedUrl.value = work.embedUrl;
});

uploadVideoButton.addEventListener("click", async () => {
  const file = fields.videoFile.files[0];
  if (!file) {
    setStatus("請先選擇影片檔。");
    return;
  }

  if (file.size > 95 * 1024 * 1024) {
    setStatus("這支影片超過 95MB，建議改上傳到 YouTube 或 Vimeo，再貼網址。");
    return;
  }

  setStatus("影片上傳中，請稍候...");
  const response = await fetch("/api/upload-video", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name)
    },
    body: file
  });

  const text = await response.text();
  if (!response.ok) {
    setStatus(text);
    return;
  }

  const result = JSON.parse(text);
  fields.videoUrl.value = result.url;
  fields.embedUrl.value = "";
  applyFormToActiveWork();
  fields.videoFile.value = "";
  setStatus(`影片已上傳並套用到目前作品：${result.url}。記得按「儲存作品資料」。`);
});

uploadCoverButton.addEventListener("click", async () => {
  const file = fields.coverFile.files[0];
  if (!file) {
    setStatus("請先選擇封面圖。");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    setStatus("封面圖超過 10MB，請先壓縮後再上傳。");
    return;
  }

  setStatus("封面圖上傳中，請稍候...");
  const response = await fetch("/api/upload-cover", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name)
    },
    body: file
  });

  const text = await response.text();
  if (!response.ok) {
    setStatus(text);
    return;
  }

  const result = JSON.parse(text);
  fields.thumbnailUrl.value = result.url;
  applyFormToActiveWork();
  fields.coverFile.value = "";
  setStatus(`封面圖已上傳並套用到目前作品：${result.url}。記得按「儲存作品資料」。`);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFormToActiveWork();
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
