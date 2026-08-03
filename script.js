const youtubeLink = document.getElementById("youtubeLink");
const youtubePlayer = document.getElementById("youtubePlayer");

const addSongButton = document.getElementById("addSongButton");
const playNowButton = document.getElementById("playNowButton");

const playPauseButton = document.getElementById("playPauseButton");
const backButton = document.getElementById("backButton");
const nextButton = document.getElementById("nextButton");
const restartButton = document.getElementById("restartButton");

const volumeSlider = document.getElementById("volumeSlider");

const playlistSongs = document.getElementById("playlistSongs");
const currentSong = document.getElementById("currentSong");


/* PLAYLIST */

let playlist = JSON.parse(
  localStorage.getItem("musicDiaryPlaylist")
) || [];

let currentSongIndex = -1;
let isPlaying = false;


/* GET YOUTUBE VIDEO ID */

function getYouTubeID(link) {

  try {

    const url = new URL(link);

    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v");
    }

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.substring(1);
    }

  } catch (error) {

    return null;

  }

  return null;
}


/* SAVE PLAYLIST */

function savePlaylist() {

  localStorage.setItem(
    "musicDiaryPlaylist",
    JSON.stringify(playlist)
  );

}


/* LOAD SONG */

function loadSong(index) {

  if (playlist.length === 0) {
    return;
  }


  if (index < 0) {
    index = playlist.length - 1;
  }


  if (index >= playlist.length) {
    index = 0;
  }


  currentSongIndex = index;

  const song = playlist[currentSongIndex];


  youtubePlayer.src =
    `https://www.youtube.com/embed/${song.id}?autoplay=1&enablejsapi=1`;


  currentSong.textContent = song.title;


  isPlaying = true;

  playPauseButton.textContent = "Ⅱ";


  displayPlaylist();

}


/* ADD TO PLAYLIST */

addSongButton.addEventListener("click", async function() {

  const link = youtubeLink.value.trim();

  const videoID = getYouTubeID(link);


  if (!videoID) {

    alert("Please paste a valid YouTube link.");

    return;

  }


  if (playlist.some(song => song.id === videoID)) {

    alert("That song is already in your playlist.");

    return;

  }


  const song = {

    id: videoID,

    title: "loading...",

    thumbnail:
      `https://img.youtube.com/vi/${videoID}/hqdefault.jpg`,

    author: ""

  };


  playlist.push(song);

  savePlaylist();

  displayPlaylist();


  const newSongIndex = playlist.length - 1;


  /* GET YOUTUBE INFORMATION */

  try {

    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoID}&format=json`
    );


    if (response.ok) {

      const data = await response.json();

      playlist[newSongIndex].title = data.title;
      playlist[newSongIndex].author = data.author_name;

      savePlaylist();
      displayPlaylist();

    }

  } catch (error) {

    playlist[newSongIndex].title = "YouTube video";

    savePlaylist();
    displayPlaylist();

  }


  /* DON'T START THE SONG */

  youtubeLink.value = "";

});


/* PLAY NOW */

playNowButton.addEventListener("click", async function() {

  const link = youtubeLink.value.trim();

  const videoID = getYouTubeID(link);


  if (!videoID) {

    alert("Please paste a valid YouTube link.");

    return;

  }


  let existingIndex = playlist.findIndex(
    song => song.id === videoID
  );


  /* ADD IT IF IT ISN'T ALREADY THERE */

  if (existingIndex === -1) {

    const song = {

      id: videoID,

      title: "loading...",

      thumbnail:
        `https://img.youtube.com/vi/${videoID}/hqdefault.jpg`,

      author: ""

    };


    playlist.push(song);

    existingIndex = playlist.length - 1;


    try {

      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoID}&format=json`
      );


      if (response.ok) {

        const data = await response.json();

        playlist[existingIndex].title = data.title;
        playlist[existingIndex].author = data.author_name;

      }

    } catch (error) {

      playlist[existingIndex].title = "YouTube video";

    }


    savePlaylist();

    displayPlaylist();

  }


  /* PLAY IT */

  loadSong(existingIndex);

  youtubeLink.value = "";

});


/* PLAY / PAUSE */

playPauseButton.addEventListener("click", function() {

  if (currentSongIndex === -1) {

    if (playlist.length > 0) {

      loadSong(0);

    } else {

      alert("Add a song to your playlist first.");

    }

    return;

  }


  if (isPlaying) {

    youtubePlayer.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: "pauseVideo"
      }),
      "*"
    );


    isPlaying = false;

    playPauseButton.textContent = "▶";

  }

  else {

    youtubePlayer.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: "playVideo"
      }),
      "*"
    );


    isPlaying = true;

    playPauseButton.textContent = "Ⅱ";

  }

});


/* NEXT */

nextButton.addEventListener("click", function() {

  if (playlist.length === 0) {
    return;
  }

  loadSong(currentSongIndex + 1);

});


/* PREVIOUS */

backButton.addEventListener("click", function() {

  if (playlist.length === 0) {
    return;
  }

  loadSong(currentSongIndex - 1);

});


/* RESTART */

restartButton.addEventListener("click", function() {

  if (currentSongIndex === -1) {
    return;
  }


  youtubePlayer.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: "seekTo",
      args: [0, true]
    }),
    "*"
  );

});


/* VOLUME */

volumeSlider.addEventListener("input", function() {

  const volume = Number(volumeSlider.value);


  youtubePlayer.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: "setVolume",
      args: [volume]
    }),
    "*"
  );

});


/* DISPLAY PLAYLIST */

function displayPlaylist() {

  playlistSongs.innerHTML = "";


  playlist.forEach(function(song, index) {

    const songElement = document.createElement("div");

    songElement.className = "playlist-song";


    songElement.innerHTML = `

      <img
        class="song-thumbnail"
        src="${song.thumbnail}"
        alt=""
      >

      <div class="song-info">

        <span class="song-number">
          ${index + 1}.
        </span>

        <div>

          <div class="song-title">
            ${escapeHTML(song.title)}
          </div>

          ${
            song.author
              ? `<div class="song-author">
                  ${escapeHTML(song.author)}
                 </div>`
              : ""
          }

        </div>

      </div>


      <div class="song-buttons">

        <button class="song-play">
          play
        </button>

        <button class="delete-button">
          ×
        </button>

      </div>

    `;


    /* PLAY SONG */

    songElement
      .querySelector(".song-play")
      .addEventListener("click", function() {

        loadSong(index);

      });


    /* DELETE SONG */

    songElement
      .querySelector(".delete-button")
      .addEventListener("click", function() {

        playlist.splice(index, 1);

        savePlaylist();


        if (playlist.length === 0) {

          currentSongIndex = -1;

          youtubePlayer.src = "";

          currentSong.textContent = "nothing playing";

          isPlaying = false;

          playPauseButton.textContent = "▶";

        }

        else if (index === currentSongIndex) {

          currentSongIndex =
            Math.min(
              currentSongIndex,
              playlist.length - 1
            );

          loadSong(currentSongIndex);

        }

        else if (index < currentSongIndex) {

          currentSongIndex--;

        }


        displayPlaylist();

      });


    playlistSongs.appendChild(songElement);

  });

}


/* PROTECT HTML */

function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


/* LOAD SAVED PLAYLIST */

displayPlaylist();