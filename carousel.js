let index = 0;
let currentMedia = [];

export function initCarousel() {
  const imgEl = document.getElementById("carouselImage");
  const vidEl = document.getElementById("carouselVideo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const scrollContainer = document.getElementById("thumbnailScroll");
  const thumbLeft = document.getElementById("thumbLeft");
  const thumbRight = document.getElementById("thumbRight");
  const carouselWrapper = document.getElementById("carouselWrapper");
  const carousel = document.getElementById("carouselContainer");
  const thumbnail = document.getElementById("thumbnailScroll");

  // Helper: normalize input ke {type:'image'|'video', src, poster?}
  function parseMediaFromButton(btn) {
    // Prioritas data-media (baru)
    const mediaAttr = btn.getAttribute("data-media");
    if (mediaAttr) {
      try {
        const arr = JSON.parse(mediaAttr);
        return arr.map(item => {
          if (typeof item === "string") {
            return inferTypeFromUrl(item);
          }
          if (item && item.src) {
            return {
              type: item.type || inferTypeFromUrl(item.src).type,
              src: item.src,
              poster: item.poster || null,
            };
          }
          return null;
        }).filter(Boolean);
      } catch (e) {
        console.warn("Invalid data-media JSON", e);
      }
    }

    // Back-compat: data-images (array string)
    const imagesAttr = btn.getAttribute("data-images");
    if (imagesAttr) {
      try {
        const arr = JSON.parse(imagesAttr);
        return arr.map(src => inferTypeFromUrl(src));
      } catch (e) {
        console.warn("Invalid data-images JSON", e);
      }
    }
    return [];
  }

  function inferTypeFromUrl(src) {
    const lower = src.split("?")[0].toLowerCase();
    const isVideo = /\.(mp4|webm|ogg|ogv|mov|m4v)$/.test(lower);
    return { type: isVideo ? "video" : "image", src, poster: null };
  }

  function showImage(src) {
    // stop video jika ada yang sedang main
    if (!vidEl.classList.contains("hidden")) {
      vidEl.pause();
      vidEl.src = ""; // kecilin memory
      vidEl.classList.add("hidden");
    }
    imgEl.src = src;
    imgEl.classList.remove("hidden");
  }

  function showVideo(src, poster = null) {
    // sembunyikan image
    if (!imgEl.classList.contains("hidden")) {
      imgEl.classList.add("hidden");
    }
    // set video
    if (poster) vidEl.setAttribute("poster", poster);
    else vidEl.removeAttribute("poster");
    if (vidEl.src !== src) {
      vidEl.src = src;
    }
    vidEl.classList.remove("hidden");
  }

  function updateCarousel() {
    if (!currentMedia.length) return;
    const item = currentMedia[index];
    if (item.type === "video") {
      showVideo(item.src, item.poster || null);
    } else {
      showImage(item.src);
    }

    // highlight thumbnail aktif
    const thumbs = document.querySelectorAll(".thumbnail");
    thumbs.forEach((thumb, idx) => {
      thumb.classList.toggle("ring-2", idx === index);
      thumb.classList.toggle("ring-blue-500", idx === index);
      thumb.classList.toggle("ring-0", idx !== index);
    });
  }

  function renderThumbnails() {
  thumbnail.innerHTML = "";
  currentMedia.forEach((m, idx) => {
    let thumb;
    if (m.type === "image") {
      thumb = document.createElement("img");
      thumb.src = m.src;
      // width/height valid + cegah flex shrink
      thumb.className = "thumbnail w-[120px] h-[96px] object-cover cursor-pointer rounded ring-0 shrink-0";
    } else {
      if (m.poster) {
        const wrapper = document.createElement("div");
        // width/height valid + cegah flex shrink
        wrapper.className = "relative thumbnail w-[120px] h-[96px] rounded overflow-hidden cursor-pointer ring-0 shrink-0";
        wrapper.style.backgroundImage = `url('${m.poster}')`;
        wrapper.style.backgroundSize = "cover";
        wrapper.style.backgroundPosition = "center";
        const play = document.createElement("div");
        play.className = "absolute inset-0 flex items-center justify-center bg-black/20";
        play.innerHTML = `<span class="text-white text-xl">▶</span>`;
        wrapper.appendChild(play);
        thumb = wrapper;
      } else {
        const v = document.createElement("video");
        v.src = m.src;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.preload = "metadata";
        // width/height valid + cegah flex shrink
        v.className = "thumbnail w-[120px] h-[96px] object-cover cursor-pointer rounded ring-0 shrink-0";
        v.play().catch(()=>{});
        thumb = v;
      }
    }

    thumb.dataset.index = idx;
    thumb.addEventListener("click", () => {
      index = idx;
      updateCarousel();
    });

    thumbnail.appendChild(thumb);
  });
}


  function openFullscreen(el) {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  }

  // Navigasi kiri-kanan
  prevBtn.addEventListener("click", () => {
    index = (index - 1 + currentMedia.length) % currentMedia.length;
    updateCarousel();
  });

  nextBtn.addEventListener("click", () => {
    index = (index + 1) % currentMedia.length;
    updateCarousel();
  });

  // Scroll thumbnail kiri/kanan
  thumbLeft.addEventListener("click", () => {
    scrollContainer.scrollBy({ left: -150, behavior: "smooth" });
  });

  thumbRight.addEventListener("click", () => {
    scrollContainer.scrollBy({ left: 150, behavior: "smooth" });
  });

  // Klik luar → tutup
  carouselWrapper.addEventListener("click", (e) => {
    if (e.target === carouselWrapper) {
      // pause video kalau sedang tampil
      if (!vidEl.classList.contains("hidden")) {
        vidEl.pause();
      }
      carouselWrapper.classList.add("hidden");

      // Tampilkan deskripsi kembali jika mobile
      if (window.innerWidth <= 964) {
        document.querySelectorAll(".description-box").forEach(box => {
          box.classList.remove("hidden");
        });
      }
    }
  });

  // Fullscreen: img/video
  imgEl.addEventListener("click", () => openFullscreen(imgEl));
  vidEl.addEventListener("click", () => openFullscreen(vidEl));

  // Global handler tombol Gallery
  document.querySelectorAll(".galleryBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const media = parseMediaFromButton(btn);
      if (media.length > 0) {
        index = 0;
        currentMedia = media;
        renderThumbnails();
        updateCarousel();
        carouselWrapper.classList.remove("hidden");
        carousel.classList.remove("hidden");
        thumbnail.classList.remove("hidden");

        if (window.innerWidth <= 964) {
          document.querySelectorAll(".description-box").forEach(box => {
            box.classList.add("hidden");
          });
        }
      }
    });
  });
}
