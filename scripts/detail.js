"use strict";

function createFilmDetail({ artwork, reduced, requestFrame, restoreFocus }) {
  const dialog = document.querySelector(".detail");
  const archive = document.querySelector("#archive");
  const closeButton = dialog.querySelector(".close-film");
  const poster = dialog.querySelector("#poster-image");
  const print = dialog.querySelector("#print");
  const blots = dialog.querySelector("#blots");
  const watch = dialog.querySelector(".watch");
  const availability = dialog.querySelector("#availability");
  const inkDrops = [
    [150, 330, 0], [340, 600, 120], [250, 120, 220], [90, 760, 300],
    [400, 250, 360], [260, 860, 420], [230, 470, 180]
  ].map(([x, y, delay]) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    blots.append(circle);
    return { circle, delay };
  });
  let transition, opener, cover;
  let inkStart = null;
  let closing = false;
  const paperEase = "cubic-bezier(.76,0,.18,1)";

  function frames() {
    const box = cover.getBoundingClientRect();
    dialog.style.transformOrigin = (box.left + box.width / 2) + "px " + (box.top + box.height / 2) + "px";
    const inset = [box.top, innerWidth - box.right, innerHeight - box.bottom, box.left].join("px ");
    return [
      { clipPath: "inset(" + inset + "px round 3px)", transform: "rotate(-4.5deg)" },
      { clipPath: "inset(0px 0px 0px 0px round 0px)", transform: "rotate(0deg)" }
    ];
  }

  function open(film, face) {
    if (!dialog.hidden) return;
    cover = face;
    opener = document.activeElement.closest("button, a");
    dialog.querySelector(".sub").textContent = film.romaji + " / " + film.kanji;
    dialog.querySelector("h2").textContent = film.title;
    dialog.querySelector(".meta").textContent = film.year + " / " + film.genre + " / " + film.minutes + " min";
    dialog.querySelector(".synopsis").textContent = film.synopsis;
    availability.hidden = true;
    watch.setAttribute("aria-expanded", "false");

    artwork.showPoster(poster, film);
    print.setAttribute("mask", "url(#ink)");
    for (const { circle } of inkDrops) circle.setAttribute("r", 0);
    const sequence = frames();
    dialog.hidden = false;
    dialog.scrollTop = 0;
    archive.inert = true;
    transition = dialog.animate(sequence, { duration: reduced.matches ? 1 : 1050, easing: paperEase, fill: "both" });
    transition.onfinish = () => { transition.cancel(); transition = null; };
    dialog.querySelectorAll(".copy .mask > div").forEach((el, i) => {
      el.animate([{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], {
        duration: reduced.matches ? 1 : 900, delay: reduced.matches ? 0 : 620 + i * 75,
        easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards"
      });
    });
    inkStart = performance.now() + (reduced.matches ? -5000 : 520);
    closeButton.focus({ preventScroll: true });
    requestFrame();
  }

  function draw(now) {
    if (inkStart === null) return false;
    const elapsed = now - inkStart;
    if (reduced.matches || elapsed >= 1670) {
      print.removeAttribute("mask");
      inkStart = null;
      return false;
    }
    for (const { circle, delay } of inkDrops) {
      if (elapsed < delay) continue;
      const p = Math.min(1, (elapsed - delay) / 1250);
      circle.setAttribute("r", 720 * (1 - (1 - p) ** 3));
    }
    return true;
  }

  function close() {
    if (dialog.hidden || closing) return;
    closing = true;
    const sequence = frames().reverse();
    if (transition) {
      const visible = getComputedStyle(dialog);
      sequence[0] = { clipPath: visible.clipPath, transform: visible.transform };
      transition.onfinish = null;
      transition.cancel();
    }
    transition = dialog.animate(sequence, { duration: reduced.matches ? 1 : 850, easing: paperEase, fill: "both" });
    transition.onfinish = () => {
      dialog.hidden = true;
      dialog.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
      transition = null;
      closing = false;
      inkStart = null;
      archive.inert = false;
      restoreFocus(opener);
      requestFrame();
    };
  }

  watch.onclick = () => {
    availability.hidden = !availability.hidden;
    watch.setAttribute("aria-expanded", String(!availability.hidden));
  };
  closeButton.onclick = close;
  return { open, close, draw };
}
