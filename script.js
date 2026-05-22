const worksGrid = document.querySelector("#works-grid");
const emptyState = document.querySelector("#empty-state");
const filterButtons = document.querySelectorAll(".filter-button");
const year = document.querySelector("#year");
const videoModal = document.querySelector("#video-modal");
const videoFrame = document.querySelector("#video-frame");
const videoModalTitle = document.querySelector("#video-modal-title");

year.textContent = new Date().getFullYear();

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
      const id = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }

    if (host === "player.vimeo.com") return url;
  } catch (error) {
    return "";
  }

  return "";
}

function openVideo(work) {
  const embedUrl = work.embedUrl || getEmbedUrl(work.videoUrl);
  if (!embedUrl) {
    window.open(work.videoUrl, "_blank", "noreferrer");
    return;
  }

  videoModalTitle.textContent = work.title;
  videoFrame.innerHTML = `<iframe src="${embedUrl}" title="${work.title}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  videoModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeVideo() {
  videoModal.hidden = true;
  videoFrame.innerHTML = "";
  document.body.style.overflow = "";
}

function renderWorks(filter = "all") {
  const works = window.portfolioWorks || [];
  const visibleWorks = filter === "all" ? works : works.filter((work) => work.category === filter);

  worksGrid.innerHTML = "";
  emptyState.hidden = visibleWorks.length > 0;

  visibleWorks.forEach((work) => {
    const card = document.createElement("article");
    card.className = "work-card";

    const thumb = document.createElement("div");
    thumb.className = "work-thumb";
    if (work.videoUrl || work.embedUrl) {
      thumb.classList.add("has-video");
    }
    if (work.thumbnailUrl) {
      thumb.style.backgroundImage = `url("${work.thumbnailUrl}")`;
      thumb.style.backgroundSize = "cover";
      thumb.style.backgroundPosition = "center";
    }

    const body = document.createElement("div");
    body.className = "work-body";

    if (work.isSample) {
      const tag = document.createElement("span");
      tag.className = "work-tag";
      tag.textContent = "範例";
      body.append(tag);
    }

    const meta = document.createElement("div");
    meta.className = "work-meta";
    meta.textContent = [work.categoryLabel, work.year, work.role].filter(Boolean).join(" / ");

    const title = document.createElement("h3");
    title.textContent = work.title;

    const description = document.createElement("p");
    description.textContent = work.description;

    body.append(meta, title, description);

    if (work.videoUrl) {
      const button = document.createElement("button");
      button.className = "work-link";
      button.type = "button";
      button.textContent = getEmbedUrl(work.videoUrl) || work.embedUrl ? "播放影片" : "開啟影片";
      button.addEventListener("click", () => openVideo(work));
      body.append(button);
    }

    card.append(thumb, body);
    worksGrid.append(card);
  });
}

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeVideo);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !videoModal.hidden) {
    closeVideo();
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderWorks(button.dataset.filter);
  });
});

renderWorks();
