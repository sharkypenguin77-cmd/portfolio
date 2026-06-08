const worksGrid = document.querySelector("#works-grid");
const emptyState = document.querySelector("#empty-state");
const filterButtons = document.querySelectorAll(".filter-button");
const year = document.querySelector("#year");
const videoModal = document.querySelector("#video-modal");
const videoModalPanel = document.querySelector(".video-modal-panel");
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

function isDirectVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

function isInstagramUrl(url) {
  if (!url) return false;

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "instagram.com";
  } catch (error) {
    return false;
  }
}

function loadInstagramEmbed() {
  if (window.instgrm?.Embeds?.process) {
    window.instgrm.Embeds.process();
    return;
  }

  if (document.querySelector('script[src="https://www.instagram.com/embed.js"]')) {
    return;
  }

  const script = document.createElement("script");
  script.src = "https://www.instagram.com/embed.js";
  script.async = true;
  document.body.append(script);
}

function openVideo(work) {
  const embedUrl = work.embedUrl || getEmbedUrl(work.videoUrl);
  const hasDirectVideo = isDirectVideoUrl(work.videoUrl);
  const hasInstagramEmbed = isInstagramUrl(work.videoUrl);

  if (!embedUrl && !hasDirectVideo && !hasInstagramEmbed) {
    window.open(work.videoUrl, "_blank", "noreferrer");
    return;
  }

  videoModalTitle.textContent = work.title;
  videoModalPanel.classList.toggle("is-instagram", hasInstagramEmbed);
  videoFrame.classList.toggle("instagram-frame", hasInstagramEmbed);

  if (hasInstagramEmbed) {
    videoFrame.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${work.videoUrl}" data-instgrm-version="14"></blockquote>`;
    loadInstagramEmbed();
  } else {
    videoFrame.innerHTML = hasDirectVideo
      ? `<video src="${work.videoUrl}" title="${work.title}" controls playsinline></video>`
      : `<iframe src="${embedUrl}" title="${work.title}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  videoModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeVideo() {
  videoModal.hidden = true;
  videoModalPanel.classList.remove("is-instagram");
  videoFrame.classList.remove("instagram-frame");
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
      thumb.setAttribute("role", "button");
      thumb.setAttribute("tabindex", "0");
      thumb.setAttribute("aria-label", `播放或開啟 ${work.title}`);
      thumb.addEventListener("click", () => openVideo(work));
      thumb.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openVideo(work);
        }
      });
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
