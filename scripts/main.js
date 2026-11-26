"use strict";

(() => {
  const archive = document.querySelector("#archive");
  const dialog = document.querySelector(".detail");
  const catalogue = document.querySelector(".index");
  const back = document.querySelector("#back");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const artwork = createArtwork();
  let frame = null;
  let previous = 0;

  function requestFrame() {
    if (frame !== null || document.hidden) return;
    previous = performance.now();
    frame = requestAnimationFrame(render);
  }

  function render(now) {
    const dt = Math.max(0, Math.min(.05, (now - previous) / 1000));
    previous = now;
    const moving = shelf.draw(dt);
    const printing = detail.draw(now);
    frame = moving || printing ? requestAnimationFrame(render) : null;
  }

  const detail = createFilmDetail({
    artwork, reduced, requestFrame,
    restoreFocus(opener) {
      if (opener && !opener.classList.contains("tape") && opener.isConnected) opener.focus({ preventScroll: true });
      else shelf.focusCover();
    }
  });
  const shelf = createShelf({
    artwork, reduced, requestFrame, openFilm: detail.open,
    isBrowsing: () => dialog.hidden && catalogue.hidden
  });

  function closeCatalogue() {
    catalogue.hidden = true;
    archive.inert = false;
    back.focus({ preventScroll: true });
    requestFrame();
  }

  back.onclick = event => {
    event.preventDefault();
    catalogue.hidden = false;
    archive.inert = true;
    catalogue.querySelector(".close-index").focus();
    requestFrame();
  };
  catalogue.querySelector(".close-index").onclick = closeCatalogue;
  const list = catalogue.querySelector("ol");
  films.forEach((film, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const year = document.createElement("span");
    year.className = "lbl";
    year.textContent = film.year;
    button.append(year, document.createTextNode(film.title));
    button.onclick = () => { closeCatalogue(); shelf.goTo(index); };
    item.append(button);
    list.append(item);
  });

  document.addEventListener("keydown", event => {
    const modal = !dialog.hidden ? dialog : !catalogue.hidden ? catalogue : null;
    if (modal) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (modal === dialog) detail.close();
        else closeCatalogue();
      }
      if (event.key === "Tab") {
        const controls = modal.querySelectorAll("button, a[href]");
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      shelf.step(event.key === "ArrowLeft" ? -1 : 1);
    }
    if (event.key === "Enter" && document.activeElement === document.body) {
      event.preventDefault();
      shelf.openCurrent();
    }
  });

  if (/^https?:$/.test(location.protocol)) {
    const url = encodeURIComponent(location.href.split("#")[0]);
    document.querySelector("#fb").href += "?u=" + url;
    document.querySelector("#tw").href += "?url=" + url + "&text=Leon%20Vasari%20Filmography";
  }

  window.addEventListener("resize", shelf.measure);
  reduced.addEventListener("change", requestFrame);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = null;
    } else requestFrame();
  });
  shelf.measure();
  document.fonts.ready.then(shelf.measure);
  artwork.loadOriginals();
})();
