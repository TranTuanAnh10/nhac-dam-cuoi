/* ═══════════════════════════════════════════════════════
   Wedding Soundboard — Chị Ánh & Anh Tùng (29/03)
   JavaScript — Core Logic
   ═══════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────
// 1. DỮ LIỆU KỊCH BẢN (Lấy từ Sheet 6)
//    Mỗi track có `audioFile` trỏ tới file .mp3 trong thư mục audio/
//    và `startTime` (giây) để nhảy đến đúng mốc cần phát.
// ─────────────────────────────────────────────────────
const SCRIPT_DATA = [
  {
    step: 1,
    title: "CD ra mắt",
    description: "CD ra mắt",
    tracks: [
      {
        label: "▶ Phát nhạc CD ra mắt",
        audioFile: "audio/01_cd_ra_mat.mp3",
        startTime: 0,
      },
    ],
  },
  {
    step: 2,
    title: "Bố mẹ 2 bên ra mắt",
    description:
      "Bố mẹ 2 bên cùng lên sân khấu\nGia đình ổn định vị trí trên sân khấu, cúi chào quan khách",
    tracks: [
      {
        label: "▶ Phát nhạc (từ 02:00)",
        audioFile: "audio/02_bo_me_ra_mat.mp3",
        startTime: 120, // Phát từ phút thứ 2
      },
    ],
  },
  {
    step: 3,
    title: "Trao nhẫn cưới",
    description:
      "MC giới thiệu, chào mừng hộ nhẫn\nCDCR trao nhẫn cưới\nChụp ảnh",
    tracks: [
      {
        label: "▶ Phát nhạc trao nhẫn",
        audioFile: "audio/03_trao_nhan_cuoi.mp3",
        startTime: 0,
      },
    ],
  },
  {
    step: 4,
    title: "Hoạt động kết ước",
    description:
      'Nấu cơm bằng nồi cơm điện\n🎵 "Và thế giới đã mất đi một người cô đơn"',
    tracks: [
      {
        label: "▶ Phát nhạc kết ước",
        audioFile: "audio/04_ket_uoc.mp3",
        startTime: 0,
      },
    ],
  },
  {
    step: 5,
    title: "Phát biểu cảm ơn — Bố CR",
    description:
      'MC mời đại diện gia đình phát biểu\nĐại diện gia đình phát biểu cảm ơn\n🎵 "Cho con" (Piano)',
    tracks: [
      {
        label: '▶ Phát nhạc "Cho con" (Piano)',
        audioFile: "audio/05_cho_con_piano.mp3",
        startTime: 0,
      },
    ],
  },
  {
    step: 6,
    title: "Nâng ly khai tiệc",
    description:
      "MC mời CDCR dâng rượu cho bố mẹ hai bên\nMC hô khẩu hiệu nâng ly\nGia đình nâng ly chúc mừng, chụp ảnh\nCDCR đi xuống first-walk trên đường dẫn — bóng nổ, bạn bè tung hoa 🎉",
    tracks: [
      {
        label: "🥂 Nhạc nâng ly — Marry You",
        audioFile: "audio/06a_marry_you.mp3",
        startTime: 0,
      },
      {
        label: "💐 Nhạc First-walk — Love Story",
        audioFile: "audio/06b_love_story.mp3",
        startTime: 0,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────
// 2. TRẠNG THÁI TOÀN CỤC
// ─────────────────────────────────────────────────────
let audioPlayer = null; // HTML5 Audio instance
let currentTrackId = null; // ID nút đang phát (để toggle UI)
let currentVolume = 1.0; // Âm lượng (0 → 1)
let progressInterval = null; // Interval cập nhật progress bar

// ─────────────────────────────────────────────────────
// 3. KHỞI TẠO
// ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderCards();
  setupVolumeControl();
  console.log(
    "[Soundboard] Sẵn sàng. Tổng cộng",
    SCRIPT_DATA.length,
    "phần kịch bản.",
  );
});

// ─────────────────────────────────────────────────────
// 4. RENDER GIAO DIỆN
// ─────────────────────────────────────────────────────
function renderCards() {
  const container = document.getElementById("cards-container");
  if (!container) return;

  container.innerHTML = SCRIPT_DATA.map((item, idx) => {
    // Chuyển \n thành các dòng riêng biệt
    const descHtml = item.description
      .split("\n")
      .map((line) => `<span>${line}</span>`)
      .join("");

    // Render từng nút phát trong card
    const buttonsHtml = item.tracks
      .map((track, tIdx) => {
        const btnId = `btn-${idx}-${tIdx}`;
        const startLabel =
          track.startTime > 0
            ? `<span class="play-btn__start-time">(${formatTime(track.startTime)})</span>`
            : "";

        return `
        <button
          id="${btnId}"
          class="play-btn"
          onclick="playTrack('${escapeAttr(track.audioFile)}', ${track.startTime}, '${btnId}', '${escapeAttr(track.label)}')"
          aria-label="Phát ${escapeAttr(track.label)}"
        >
          <span class="play-btn__icon">🎵</span>
          <span class="play-btn__label">
            ${track.label}${startLabel}
          </span>
          <span class="play-btn__arrow">⏵</span>
        </button>
      `;
      })
      .join("");

    return `
      <article class="card" id="card-${idx}">
        <div class="card__header">
          <span class="step-badge">${item.step}</span>
          <div>
            <h2 class="card__title">${item.title}</h2>
          </div>
        </div>
        <div class="card__description">
          ${descHtml}
        </div>
        <div class="buttons-group">
          ${buttonsHtml}
        </div>
      </article>
    `;
  }).join("");
}

// ─────────────────────────────────────────────────────
// 5. ĐIỀU KHIỂN PHÁT NHẠC (HTML5 Audio API)
// ─────────────────────────────────────────────────────

/**
 * Phát một track.
 * - Tự động dừng bài cũ (tránh chồng chéo).
 * - Hỗ trợ startTime (nhảy đến giây cụ thể).
 *
 * @param {string} audioFile  - Đường dẫn file audio (ví dụ: 'audio/01_cd_ra_mat.mp3')
 * @param {number} startTime  - Thời gian bắt đầu phát (giây)
 * @param {string} btnId      - ID của nút bấm (để cập nhật UI)
 * @param {string} label      - Nhãn bài hát (để hiển thị)
 */
function playTrack(audioFile, startTime, btnId, label) {
  // Nếu đang bấm lại chính nút đang phát → toggle dừng
  if (currentTrackId === btnId) {
    stopAll();
    return;
  }

  // 1) Dừng bài cũ (nếu có)
  stopCurrentAudio();

  // 2) Reset tất cả UI buttons
  resetAllButtons();

  // 3) Tạo Audio mới
  const player = new Audio(audioFile);
  audioPlayer = player;
  player.volume = currentVolume;
  player.preload = "auto";

  // Chỉ xử lý event nếu player này vẫn là track đang hoạt động.
  player.addEventListener("loadedmetadata", () => {
    if (audioPlayer !== player) return;
    if (startTime > 0) {
      player.currentTime = startTime;
    }
    player.play().catch((err) => {
      if (audioPlayer !== player) return;
      console.error("[Soundboard] Lỗi phát nhạc:", err);
      showToast("⚠️ Lỗi phát nhạc — Kiểm tra file!");
      resetAllButtons();
      hideNowPlaying();
    });
  });

  // 5) Khi bài kết thúc
  player.addEventListener("ended", () => {
    if (audioPlayer !== player) return;
    audioPlayer = null;
    resetAllButtons();
    hideNowPlaying();
    clearProgressInterval();
    showToast("✅ Kết thúc bài hát");
  });

  // Dừng/chuyển bài cũng có thể tạo error event khi giải phóng source.
  player.addEventListener("error", () => {
    if (audioPlayer !== player) return;
    console.error(
      "[Soundboard] Không tải/phát được file:",
      audioFile,
      player.error,
    );
    showToast(
      "⚠️ Không tải/phát được file nhạc! Kiểm tra đường dẫn hoặc định dạng.",
    );
    audioPlayer = null;
    resetAllButtons();
    hideNowPlaying();
    clearProgressInterval();
  });

  // 6) Xử lý lỗi load file
  // audioPlayer.addEventListener('error', () => {
  //   console.error('[Soundboard] Không tìm thấy file:', audioFile);
  //   showToast('⚠️ Không tìm thấy file nhạc!');
  //   resetAllButtons();
  //   hideNowPlaying();
  // });

  // 7) Cập nhật UI
  currentTrackId = btnId;
  const btnEl = document.getElementById(btnId);
  if (btnEl) {
    btnEl.classList.add("is-playing");
  }

  // 8) Hiển thị Now Playing bar
  showNowPlaying(label);

  // 9) Bắt đầu cập nhật progress bar
  startProgressInterval();

  // 10) Toast thông báo
  showToast(`🎵 Đang phát: ${cleanLabel(label)}`);
}

/** Dừng audio đang phát hiện tại */
function stopCurrentAudio() {
  if (audioPlayer) {
    const player = audioPlayer;
    // Đánh dấu đã dừng trước khi bỏ nguồn, tránh báo error giả.
    audioPlayer = null;
    player.pause();
    player.removeAttribute("src");
    player.load();
  }
  clearProgressInterval();
}

/**
 * DỪNG TẤT CẢ — Emergency Stop
 * Được gọi từ nút 🛑 FAB hoặc nút "Dừng" trên Now Playing bar.
 */
function stopAll() {
  stopCurrentAudio();
  resetAllButtons();
  hideNowPlaying();
  currentTrackId = null;
  showToast("🛑 Đã dừng tất cả");
}

// ─────────────────────────────────────────────────────
// 6. CẬP NHẬT GIAO DIỆN (UI Updates)
// ─────────────────────────────────────────────────────

/** Xoá trạng thái is-playing khỏi tất cả nút */
function resetAllButtons() {
  document.querySelectorAll(".play-btn.is-playing").forEach((btn) => {
    btn.classList.remove("is-playing");
  });
  currentTrackId = null;
}

/** Hiển thị thanh Now Playing */
function showNowPlaying(label) {
  const bar = document.getElementById("now-playing-bar");
  const text = document.getElementById("now-playing-text");
  if (bar && text) {
    text.textContent = cleanLabel(label);
    bar.classList.add("visible");
  }
}

/** Ẩn thanh Now Playing */
function hideNowPlaying() {
  const bar = document.getElementById("now-playing-bar");
  if (bar) bar.classList.remove("visible");
  // Reset progress bar
  const fill = document.getElementById("progress-fill");
  const timeEl = document.getElementById("progress-current");
  const durEl = document.getElementById("progress-duration");
  if (fill) fill.style.width = "0%";
  if (timeEl) timeEl.textContent = "00:00";
  if (durEl) durEl.textContent = "00:00";
}

/** Bắt đầu cập nhật progress bar liên tục */
function startProgressInterval() {
  clearProgressInterval();
  progressInterval = setInterval(() => {
    if (!audioPlayer) return;

    const current = audioPlayer.currentTime || 0;
    const duration = audioPlayer.duration || 0;
    const percent = duration > 0 ? (current / duration) * 100 : 0;

    const fill = document.getElementById("progress-fill");
    const timeEl = document.getElementById("progress-current");
    const durEl = document.getElementById("progress-duration");

    if (fill) fill.style.width = `${percent}%`;
    if (timeEl) timeEl.textContent = formatTime(Math.floor(current));
    if (durEl) durEl.textContent = formatTime(Math.floor(duration));
  }, 500);
}

/** Dừng cập nhật progress */
function clearProgressInterval() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

/** Xử lý click vào progress bar để seek */
function seekAudio(event) {
  if (!audioPlayer || !audioPlayer.duration) return;

  const bar = event.currentTarget;
  const rect = bar.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percent = x / rect.width;
  audioPlayer.currentTime = percent * audioPlayer.duration;
}

// ─────────────────────────────────────────────────────
// 7. VOLUME CONTROL
// ─────────────────────────────────────────────────────

function setupVolumeControl() {
  const slider = document.getElementById("volume-slider");
  const icon = document.getElementById("volume-icon");
  if (!slider) return;

  slider.addEventListener("input", (e) => {
    currentVolume = parseFloat(e.target.value);
    if (audioPlayer) {
      audioPlayer.volume = currentVolume;
    }
    updateVolumeIcon();
  });

  if (icon) {
    icon.addEventListener("click", () => {
      // Toggle mute
      if (currentVolume > 0) {
        slider.dataset.prevVolume = currentVolume;
        currentVolume = 0;
      } else {
        currentVolume = parseFloat(slider.dataset.prevVolume || 0.8);
      }
      slider.value = currentVolume;
      if (audioPlayer) audioPlayer.volume = currentVolume;
      updateVolumeIcon();
    });
  }
}

function updateVolumeIcon() {
  const icon = document.getElementById("volume-icon");
  if (!icon) return;

  if (currentVolume === 0) {
    icon.textContent = "🔇";
  } else if (currentVolume < 0.5) {
    icon.textContent = "🔉";
  } else {
    icon.textContent = "🔊";
  }
}

// ─────────────────────────────────────────────────────
// 8. HELPERS
// ─────────────────────────────────────────────────────

/** Chuyển giây → chuỗi mm:ss */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Escape chuỗi cho attribute onclick */
function escapeAttr(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

/** Loại bỏ emoji prefix khỏi label */
function cleanLabel(label) {
  return label
    .replace(/^[▶🥂💐🎵]\s*/, "")
    .replace(/\\'/g, "'")
    .replace(/&quot;/g, '"');
}

/** Hiển thị toast thông báo ngắn */
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
