console.log("Javascript starts.......");

// Create an audio object to play songs
let cursong = new Audio();
let srcfolder; // stores current folder path
let songs = []; // array to store song list
let play = document.querySelector(".playpause");
async function getsongs(folder) {
    srcfolder = folder;
    let files = await fetch(`/${folder}/`); // fetch folder content from server
    let response = await files.text(); 
    let div = document.createElement("div");
    div.innerHTML = response; 
    let lists = div.getElementsByTagName("a"); // get all links (song files)
    songs = []; // reset songs array

    // Loop through all links and find mp3 files
    for (let index = 0; index < lists.length; index++) {
        const element = lists[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]); // extract filename
        }
    }

    // Display the list of songs in the music library
    let library = document.querySelector(".container").getElementsByTagName("ul")[0];
    library.innerHTML = "";
    for (const song of songs) {
        library.innerHTML = library.innerHTML + `<li class="flex aligncenter">
                        <div class="music">
                            <img src="/images/music.svg" alt="" style="filter: invert(1);">
                        </div> 
                        <div class="songinfo">${song.split(".mp3")[0].replaceAll("%20", " ")} </div>
                        <div class="play flex ">
                            <span>Play Now</span>
                            <img src="/images/play.svg" alt="" style="filter: invert(1);">
                        </div>
                    </li>`;
    }

    // Add click event to each list item to play selected song
    Array.from(document.querySelector(".container").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            Playmusic(e.querySelector(".songinfo").textContent.trim());
        })
    });
    return songs; // return songs array
}
async function Playmusic(track, pause = false) {
    // Set the song source path (with or without .mp3 extension)
    if (track.endsWith(".mp3")) cursong.src = `/${srcfolder}/` + track;
    else cursong.src = `/${srcfolder}/` + track + `.mp3`;

    // Display song name in player UI
    let a = document.querySelector(".songname");
    a.innerHTML = `${track}`;

    // If not paused, play the song
    if (!(pause)) {
        play.src = "/images/pause.svg"
        cursong.play();
    }
}
// Converts seconds into mm:ss format for time display
async function secondstominutes(seconds) {
    if (isNaN(seconds) || seconds <= 0) return `00:00`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const formattedmins = String(mins).padStart(2, '0');
    const formattedsecs = String(secs).padStart(2, '0');
    return `${formattedmins}:${formattedsecs}`;
}
// Dynamically loads albums/playlists/artists and displays them
async function displayalbums() {
    let mainfolder = await fetch("/songs/");
    let response = await mainfolder.text();
    let a = document.createElement("div");
    a.innerHTML = response;
    let lists = a.getElementsByTagName("a");
    let lists2;
    let folder1;
    let folder2;

    // Loop through main song folders
    for (let i = 0; i < lists.length; i++) {
        console.log(lists[i].href);
        if (lists[i].href.split("/").slice(-2)[0] == "songs") {
            folder1 = lists[i].href.split("/").slice(-2)[1];
            if (!folder1 || folder1.includes("?")) continue;

            // Fetch subfolders (playlists/artists)
            let subfolder = await fetch(`/songs/${folder1}/`);
            let response2 = await subfolder.text();
            let b = document.createElement("div");
            b.innerHTML = response2;
            lists2 = b.getElementsByTagName("a");

            // Loop through each subfolder
            for (let index = 0; index < lists2.length; index++) {

                // If folder is under "playlists"
                if (lists2[index].href.split("/").slice(-2)[0] == "playlists") {
                    folder2 = lists2[index].href.split("/").slice(-2)[1];
                    let fullpath = `songs/playlists/${folder2}`;
                    let info = await fetch(`/songs/playlists/${folder2}/info.json`);
                    let response = await info.json();
                    let playlists = document.querySelector(".playlists");

                    // Add playlist card to the UI
                    playlists.innerHTML = playlists.innerHTML + `<div data-folder="${fullpath}" class="card">
            <img src="/songs/playlists/${folder2}/cover.jpg" alt="">
            <img src="/images/play2.svg" class="playgreen">
            <div>${response.title}</div>
            <div>${response.desc}</div>
            </div>`;
                }

                // If folder is under "artists"
                else if (lists2[index].href.split("/").slice(-2)[0] == "artists") {
                    folder2 = lists2[index].href.split("/").slice(-2)[1];
                    let fullpath = `songs/artists/${folder2}`;
                    let info = await fetch(`/songs/artists/${folder2}/info.json`);
                    let response = await info.json();
                    let artists = document.querySelector(".artists");

                    // Add artist card to the UI
                    artists.innerHTML = artists.innerHTML + `<div data-folder="${fullpath}" class="card">
            <img src="/songs/artists/${folder2}/cover.jpg" alt="">
            <img src="/images/play2.svg" class="playgreen">
            <div>${response.title}</div>
            <div>${response.desc}</div>
            </div>`;
                }
            }
        }
    }

    // Add click event to every album/artist card
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            let songFolder = item.currentTarget.dataset.folder;         
            await getsongs(`${songFolder}`); // load songs from that folder
            await Playmusic(songs[0].replaceAll("%20", " "), true); // preload first song (paused)
        });
    });
}
async function main() {
    await displayalbums(); // load all albums first

    // Toggle play/pause button
    play.addEventListener("click", e => {
        if (cursong.paused) {
            cursong.play();
            play.src = "/images/pause.svg";
        }
        else {
            cursong.pause();
            play.src = "/images/play.svg";
        }
    })

    let search = Array.from(document.querySelectorAll(".search")); // placeholder for search feature

    // Update song progress and duration display
    cursong.addEventListener("timeupdate", async () => {
        document.querySelector(".duration").innerHTML =
            `${await secondstominutes(cursong.currentTime)}/${await secondstominutes(cursong.duration)}`;
        document.querySelector(".circle").style.left = cursong.currentTime / cursong.duration * 100 + "%";
        if (cursong.currentTime === cursong.duration) {
            play.src = "/images/replay.svg"; // show replay icon at end
        }
    })

    // Click on seek bar to jump to a position in the song
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / document.querySelector(".seekbar").getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        cursong.currentTime = ((cursong.duration) * percent) / 100;
    });

    // Handle next/previous buttons
    let previous = document.querySelector(".previous");
    let next = document.querySelector(".next");

    previous.addEventListener("click", e => {
        let index = songs.indexOf(cursong.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) {
            Playmusic(songs[index - 1].replaceAll("%20", " "));
        }
    })

    next.addEventListener("click", e => {
        let index = songs.indexOf(cursong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            Playmusic(songs[index + 1].replaceAll("%20", " "));
        }
    })

    // Handle sidebar menu toggle (for mobile/small screen view)
    let menu_open = false;
    document.querySelector(".menu").addEventListener("click", () => {
        if (menu_open) {
            document.querySelector(".left").style.left = "-110%";
            menu_open = false;
        }
        else {
            document.querySelector(".left").style.left = "0%";
            menu_open = true;
        }
    });
}
main();
