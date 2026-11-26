"use strict";

// The local sheet is laid out in four columns. Each cell holds a cover and its spine.
function createArtwork() {
  const localSheet = ["./assets/images/fallback-sleeves.jpg", 1684, 1830];
  const loaded = new Set();
  const facesBySheet = new Map();
  const posters = new Map();
  let currentPoster;

  function region(sheet, x, y, width, height) {
    return { sheet, x, y, width, height };
  }

  function remoteRegion(key) {
    const [name, ...box] = artworkCrops[key];
    return region(artworkSheets[name], ...box);
  }

  function paintFace(face, crop) {
    const { sheet: [url, w, h], x, y, width, height } = crop;
    face.style.backgroundImage = 'url("' + url + '")';
    face.style.backgroundSize = (w / width * 100) + "% " + (h / height * 100) + "%";
    face.style.backgroundPosition = (x / (w - width) * 100) + "% " + (y / (h - height) * 100) + "%";
  }

  function paintPoster(image, crop) {
    const { sheet: [url, w, h], x, y, width, height } = crop;
    image.setAttribute("x", -x * 474 / width);
    image.setAttribute("y", -y * 900 / height);
    image.setAttribute("width", w * 474 / width);
    image.setAttribute("height", h * 900 / height);
    image.setAttribute("href", url);
  }

  function register(spine, cover, film, index) {
    const x = (index % 4) * 421;
    const y = Math.floor(index / 4) * 610;
    const front = region(localSheet, x, y, 320, 610);
    posters.set(film.id, front);
    for (const [face, key, fallback] of [
      [spine, "spine-" + film.id, region(localSheet, x + 320, y, 101, 610)],
      [cover, "cover-" + film.id, front]
    ]) {
      const sheet = artworkCrops[key][0];
      if (!facesBySheet.has(sheet)) facesBySheet.set(sheet, []);
      facesBySheet.get(sheet).push({ face, key });
      paintFace(face, fallback);
    }
  }

  function showPoster(image, film) {
    const key = "cover-" + film.id;
    currentPoster = { image, key };
    paintPoster(image, loaded.has(artworkCrops[key][0]) ? remoteRegion(key) : posters.get(film.id));
  }

  function loadOriginals() {
    for (const [name, [url]] of Object.entries(artworkSheets)) {
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      image.decode().then(() => {
        loaded.add(name);
        for (const { face, key } of facesBySheet.get(name)) paintFace(face, remoteRegion(key));
        if (currentPoster && artworkCrops[currentPoster.key][0] === name) {
          paintPoster(currentPoster.image, remoteRegion(currentPoster.key));
        }
      }).catch(() => { /* The locally bundled sleeve is already visible. */ });
    }
  }

  return { register, showPoster, loadOriginals };
}
