const worksGrid = document.querySelector("#works-grid");
const emptyState = document.querySelector("#empty-state");
const filterButtons = document.querySelectorAll(".filter-button");
const year = document.querySelector("#year");

year.textContent = new Date().getFullYear();

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
      const link = document.createElement("a");
      link.className = "work-link";
      link.href = work.videoUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "觀看影片";
      body.append(link);
    }

    card.append(thumb, body);
    worksGrid.append(card);
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderWorks(button.dataset.filter);
  });
});

renderWorks();
