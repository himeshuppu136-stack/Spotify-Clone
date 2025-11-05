console.log("Javascript starts.......");
let cursong = new Audio();
let srcfolder;
let songs = [];
let play = document.querySelector(".playpause");
async function getsongs(folder) {
    srcfolder = folder;
    let files = await fetch(`/${folder}/`);
    let response = await files.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let lists = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < lists.length; index++) {
        const element = lists[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }
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
    Array.from(document.querySelector(".container").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            Playmusic(e.querySelector(".songinfo").textContent.trim());
        })
    });
    return songs;
}
async function Playmusic(track, pause = false) {
    if (track.endsWith(".mp3")) cursong.src = `/${srcfolder}/` + track;
    else
        cursong.src = `/${srcfolder}/` + track + `.mp3`;
    let a = document.querySelector(".songname");
    a.innerHTML = `${track}`;
    if (!(pause)) {
        play.src = "/images/pause.svg"
        cursong.play();
    }
}
async function secondstominutes(seconds) {
    if (isNaN(seconds) || seconds <= 0) return `00:00`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const formattedmins = String(mins).padStart(2, '0');
    const formattedsecs = String(secs).padStart(2, '0');
    return `${formattedmins}:${formattedsecs}`;
}
async function displayalbums() {
    let mainfolder = await fetch("/songs/");
    let response = await mainfolder.text();
    let a = document.createElement("div");
    a.innerHTML = response;
    let lists = a.getElementsByTagName("a");
    console.log(lists);
    let lists2;
    let folder1;
    let folder2;
    for (let i = 0; i < lists.length; i++) {
        console.log(lists[i].href);
        if (lists[i].href.split("/").slice(-2)[0] == "songs") {
            folder1 = lists[i].href.split("/").slice(-2)[1];
            if (!folder1 || folder1.includes("?")) continue;
            let subfolder = await fetch(`/songs/${folder1}/`);
            let response2 = await subfolder.text();
            let b = document.createElement("div");
            b.innerHTML = response2;
            lists2 = b.getElementsByTagName("a");
            for (let index = 0; index < lists2.length; index++) {
                if (lists2[index].href.split("/").slice(-2)[0] == "playlists") {
                    folder2 = lists2[index].href.split("/").slice(-2)[1];
                    let fullpath=`songs/playlists/${folder2}`;
                    let info = await fetch(`/songs/playlists/${folder2}/info.json`);
                    let response = await info.json();
                    let playlists = document.querySelector(".playlists");
                    playlists.innerHTML = playlists.innerHTML + `<div data-folder="${fullpath}" class="card">
            <img src="/songs/playlists/${folder2}/cover.jpg" alt="">
            <img src="/images/play2.svg" class="playgreen">
            <div>${response.title}</div>
            <div>${response.desc}</div>
            </div>`;
                }
                else if (lists2[index].href.split("/").slice(-2)[0] == "artists") {
                    folder2 = lists2[index].href.split("/").slice(-2)[1];
                    let fullpath=`songs/artists/${folder2}`;
                    let info = await fetch(`/songs/artists/${folder2}/info.json`);
                    let response = await info.json();
                    let artists = document.querySelector(".artists");
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
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            
            // --- FIX 3: Use the correct dataset property and path ---
            // 'songFolder' will be "artists/arijit singh" or "playlists/dhh"
            let songFolder = item.currentTarget.dataset.folder;         
            await getsongs(`${songFolder}`);
            await Playmusic(songs[0].replaceAll("%20", " "), true);
        });
    });
}
async function main() {
    await displayalbums();
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
    let search = Array.from(document.querySelectorAll(".search"));
    search.forEach(e => {
        e.addEventListener("click", () => {
            if (songs.length == 0) {
                alert("Please select a folder first");
            }
            else {
                let name = prompt("Enter the name of the song you want to search from this album");
                name = name.replaceAll(" ", "%20") + ".mp3"
                let found = false;
                for (let index = 0; index < songs.length; index++) {
                    if (name.toLowerCase() == songs[index].toLowerCase()) {
                        found = true;
                        Playmusic(songs[index].replaceAll("%20", " "));
                        break;
                    }
                }
                if (!(found)) {
                    alert("Song not found in this folder");
                }
            }
        })
    });

    cursong.addEventListener("timeupdate", async () => {
        document.querySelector(".duration").innerHTML = `${await secondstominutes(cursong.currentTime)}/${await secondstominutes(cursong.duration)}`;
        document.querySelector(".circle").style.left = cursong.currentTime / cursong.duration * 100 + "%";
        if (cursong.currentTime === cursong.duration) {
            play.src = "/images/replay.svg";
        }
    })
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / document.querySelector(".seekbar").getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        cursong.currentTime = ((cursong.duration) * percent) / 100;
    });
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