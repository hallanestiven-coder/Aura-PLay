// DOM Elements
const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const volumeSlider = document.getElementById('volume-slider');
const volumePercent = document.getElementById('volume-percent');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const albumCover = document.getElementById('album-cover');
const selectFolderBtn = document.getElementById('select-folder-btn');
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

// State
let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let musicFolder = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadStoredFolder();
  setVolume();
});

// Event Listeners
function setupEventListeners() {
  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);
  progressBar.addEventListener('input', seek);
  progressBar.addEventListener('change', seek);
  volumeSlider.addEventListener('input', setVolume);
  selectFolderBtn.addEventListener('click', selectFolder);
  audioPlayer.addEventListener('timeupdate', updateProgress);
  audioPlayer.addEventListener('loadedmetadata', updateDuration);
  audioPlayer.addEventListener('ended', playNext);
  audioPlayer.addEventListener('play', () => (isPlaying = true));
  audioPlayer.addEventListener('pause', () => (isPlaying = false));

  // Navigation
  navButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      navButtons.forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      const page = e.target.dataset.page;
      showPage(page);
    });
  });
}

// Folder Selection
async function selectFolder() {
  try {
    const folderPath = await window.electron.selectMusicFolder();
    if (folderPath) {
      musicFolder = folderPath;
      localStorage.setItem('musicFolder', folderPath);
      await loadPlaylist();
    }
  } catch (error) {
    console.error('Error selecting folder:', error);
  }
}

function loadStoredFolder() {
  const stored = localStorage.getItem('musicFolder');
  if (stored) {
    musicFolder = stored;
    loadPlaylist();
  }
}

async function loadPlaylist() {
  try {
    const files = await window.electron.getMusicFiles(musicFolder);
    playlist = files;
    currentIndex = 0;
    renderPlaylist();
    renderLibrary();
    if (playlist.length > 0) {
      loadSong(0);
    }
  } catch (error) {
    console.error('Error loading playlist:', error);
  }
}

// Playback Controls
function togglePlay() {
  if (!playlist.length) return;

  if (isPlaying) {
    audioPlayer.pause();
    playBtn.textContent = '▶️';
  } else {
    if (!audioPlayer.src) {
      loadSong(currentIndex);
    }
    audioPlayer.play();
    playBtn.textContent = '⏸️';
  }
}

function playNext() {
  if (!playlist.length) return;
  currentIndex = (currentIndex + 1) % playlist.length;
  loadSong(currentIndex);
  audioPlayer.play();
  playBtn.textContent = '⏸️';
  isPlaying = true;
}

function playPrevious() {
  if (!playlist.length) return;
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  loadSong(currentIndex);
  audioPlayer.play();
  playBtn.textContent = '⏸️';
  isPlaying = true;
}

function loadSong(index) {
  if (index < 0 || index >= playlist.length) return;

  currentIndex = index;
  const song = playlist[index];
  audioPlayer.src = `file://${song.path}`;
  songTitle.textContent = song.name || song.filename;
  songArtist.textContent = 'From: ' + musicFolder.split('\\').pop();
  progressBar.value = 0;
  updatePlaylistUI();
  updateLibraryUI();
}

function seek() {
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
  }
}

function setVolume() {
  const volume = volumeSlider.value / 100;
  audioPlayer.volume = volume;
  volumePercent.textContent = volumeSlider.value + '%';
}

function updateProgress() {
  if (audioPlayer.duration) {
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = percent;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
  }
}

function updateDuration() {
  durationEl.textContent = formatTime(audioPlayer.duration);
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// UI Rendering
function renderPlaylist() {
  const container = document.getElementById('playlist-container');
  if (!playlist.length) {
    container.innerHTML = '<p class="empty-state">No songs in playlist</p>';
    return;
  }

  container.innerHTML = playlist
    .map((song, index) => `
    <div class="song-item" data-index="${index}" onclick="loadAndPlay(${index})">
      <div class="song-item-title">${song.name || song.filename}</div>
      <div class="song-item-meta">🎵 Audio</div>
    </div>
  `)
    .join('');
  updatePlaylistUI();
}

function renderLibrary() {
  const container = document.getElementById('library-container');
  if (!playlist.length) {
    container.innerHTML = '<p class="empty-state">No music folder selected</p>';
    return;
  }

  container.innerHTML = playlist
    .map((song, index) => `
    <div class="song-item" data-index="${index}" onclick="loadAndPlay(${index})">
      <div class="song-item-title">${song.name || song.filename}</div>
      <div class="song-item-meta">📁 Library</div>
    </div>
  `)
    .join('');
  updateLibraryUI();
}

function updatePlaylistUI() {
  document.querySelectorAll('.playlist-container .song-item').forEach((item, index) => {
    item.classList.toggle('active', index === currentIndex);
  });
}

function updateLibraryUI() {
  document.querySelectorAll('.library-container .song-item').forEach((item, index) => {
    item.classList.toggle('active', index === currentIndex);
  });
}

function loadAndPlay(index) {
  loadSong(index);
  audioPlayer.play();
  playBtn.textContent = '⏸️';
  isPlaying = true;
}

// Page Navigation
function showPage(pageName) {
  pages.forEach((page) => page.classList.remove('active'));
  document.getElementById(pageName).classList.add('active');
}
