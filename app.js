// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    databaseURL: "YOUR_REALTIME_DB_URL"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();
// Firebase configuration (ensure you've added this previously)

// Function to get the currently playing song
function getCurrentlyPlaying() {
    const nowPlayingRef = db.ref('nowPlaying');
    nowPlayingRef.on('value', (snapshot) => {
        const songData = snapshot.val();
        if (songData) {
            document.getElementById('song-title').innerText = songData.name;
            document.getElementById('audio-source').src = songData.url;
            document.getElementById('audio-player').load();
        } else {
            document.getElementById('song-title').innerText = "No song playing...";
        }
    });
}

// Function to upload a song
document.getElementById('upload-button').addEventListener('click', function () {
    const fileInput = document.getElementById('song-upload');
    const file = fileInput.files[0];

    if (file && file.type === "audio/mp3") {
        const storageRef = storage.ref(`songs/${file.name}`);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // Progress logic (optional)
                console.log('Upload is in progress...');
            }, 
            (error) => {
                console.error('Upload failed:', error);
            }, 
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    const songData = {
                        name: file.name,
                        url: downloadURL
                    };

                    const newSongKey = db.ref().child('songs').push().key;
                    db.ref('songs/' + newSongKey).set(songData);
                });
            }
        );
    } else {
        alert('Please upload a valid .mp3 file.');
    }
});

// Function to load the list of uploaded songs
function loadSongs() {
    const songsRef = db.ref('songs');
    songsRef.on('value', (snapshot) => {
        const songs = snapshot.val();
        const songList = document.getElementById('song-list');
        songList.innerHTML = '';  // Clear the list

        for (const key in songs) {
            const song = songs[key];
            const li = document.createElement('li');
            li.innerHTML = `<a href="${song.url}" target="_blank">${song.name}</a> <button onclick="setAsNowPlaying('${key}')">Play</button>`;
            songList.appendChild(li);
        }
    });
}

// Set a song as "now playing"
function setAsNowPlaying(songKey) {
    db.ref('songs/' + songKey).once('value').then((snapshot) => {
        const songData = snapshot.val();
        db.ref('nowPlaying').set(songData);
    });
}

// Initialize functions
if (document.getElementById('song-list')) {
    loadSongs();  // Load songs on songs.html
} else {
    getCurrentlyPlaying();  // Load currently playing song on index.html
}
