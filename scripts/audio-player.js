// audio-player.js

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audio');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.querySelector('.progress-container');
  const volumeSlider = document.getElementById('volume-slider');
  const muteBtn = document.getElementById('mute-btn');

  // Play or pause the audio
  playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();// audio-player.js

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audio');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.querySelector('.progress-container');
  const volumeSlider = document.getElementById('volume-slider');
  const muteBtn = document.getElementById('mute-btn');

  // Play or pause the audio
  playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
    } else {
      audio.pause();
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
    }
  });

  // Update the progress bar as the audio plays
  audio.addEventListener('timeupdate', () => {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
  });

  // Seek when clicking on the progress bar
  progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;

    audio.currentTime = (clickX / width) * duration;
  });

  // Volume control
  volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.currentTarget.value;
    updateVolumeIcon();
  });

  // Mute or unmute the audio
  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    updateVolumeIcon();
  });

  // Update volume icon based on volume level
  function updateVolumeIcon() {
    const volumeIcon = muteBtn.querySelector('i');
    if (audio.muted || audio.volume === 0) {
      volumeIcon.classList.remove('fa-volume-up');
      volumeIcon.classList.add('fa-volume-mute');
    } else {
      volumeIcon.classList.remove('fa-volume-mute');
      volumeIcon.classList.add('fa-volume-up');
    }
  }
});

      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
    } else {
      audio.pause();
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
    }
  });

  // Update the progress bar as the audio plays
  audio.addEventListener('timeupdate', () => {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
  });

  // Seek when clicking on the progress bar
  progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;

    audio.currentTime = (clickX / width) * duration;
  });

  // Volume control
  volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.currentTarget.value;
    updateVolumeIcon();
  });

  // Mute or unmute the audio
  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    updateVolumeIcon();
  });

  // Update volume icon based on volume level
  function updateVolumeIcon() {
    const volumeIcon = muteBtn.querySelector('i');
    if (audio.muted || audio.volume === 0) {
      volumeIcon.classList.remove('fa-volume-up');
      volumeIcon.classList.add('fa-volume-mute');
    } else {
      volumeIcon.classList.remove('fa-volume-mute');
      volumeIcon.classList.add('fa-volume-up');
    }
  }
});
