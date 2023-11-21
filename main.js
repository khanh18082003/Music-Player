const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const player = $('.player')
const cd = $('.cd')
const playlist = $('.playlist')
const togglePlay = $('.btn-toggle-play')
const audio = $('#audio')
const songName = $('.song-name')
const cdImage = $('.cd img')
const progress = $('#progress')
const nextBtn = $('.btn-next')
const prevBtn = $('.btn-prev')
const repeatBtn = $('.btn-repeat')
const shuffleBtn = $('.btn-random')
const soundBtn = $('.btn-sound')
const soundLevel = $('#sound-level')

const PLAYER_STORAGE_KEY = 'F8_PLAYER'

const app = {
    currentIndex: 0,
    isPlaying: false,
    isShuffle: false,
    isRepeat: false,
    isSound: true,
    isVolume: 1,
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
    setConfig: function(key, value) {
        app.config[key] = value
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config))
    },
    getData: function () {
        return fetch('http://localhost:3000/songs')
                    .then(response => response.json())
                    .then((data) => {
                        app.songs = data
                    })
    },              
    songs: [
        {
            "name":"Cắt đôi nỗi sầu",
            "singer":"Tăng Duy Tân ft DRUM7",
            "path":"./assets/music/catdoinoisau.mp3",
            "image":"./assets/image/catdoinoisau.jpg"
        },
        {
            "name":"Bạn đời",
            "singer":"Karik ft GDucky",
            "path":"./assets/music/bandoi.mp3",
            "image":"./assets/image/hq720.webp"
        },
        {
            "name":"Bao tiền một mớ bình yên",
            "singer":"14 Casper & Bon Nghiêm",
            "path":"./assets/music/baotien1mobinhyen.mp3",
            "image":"./assets/image/bt1mby.webp"
        },
        {
            "name":"Until I found you",
            "singer":"Stenphan Sanchez ft Em Beihold",
            "path":"./assets/music/uify.mp3",
            "image":"./assets/image/uify.webp"
        },
        {
            "name":"Có chắc yên là đây",
            "singer":"Sơn Tùng MTP",
            "path":"./assets/music/ccyld.mp3",
            "image":"./assets/image/ccyld.webp"
        },
        {
            "name":"Tally",
            "singer":"BLACKPINK",
            "path":"./assets/music/tally.mp3",
            "image":"./assets/image/tallyblink.webp"
        }
    ],
    
    render: function() {
        const htmls = this.songs.map((song, index) => {
            return `
            <div class="song ${index === this.currentIndex ? "active" : ""}" data-index=${index}>
                <div class="thumb">
                    <img src="${song.image}" class="thumb-img">
                </div>
                <div class="body">
                    <h3 class="title">${song.name}</h3>
                    <p class="author">${song.singer}</p>
                </div>
                <div class="option">
                    <i class="fa-solid fa-ellipsis"></i>
                </div>
            </div>
            `
        })
        $('.playlist').innerHTML = htmls.join('')
    },
    defineProperties: function() {
        Object.defineProperty(this, 'currentSong', {
            get: function() {
                return this.songs[this.currentIndex]
            }
        })
    },
    handleEvents: function() {
        const _this = this
        const cdWidth = cd.offsetWidth

        const cdAnimate = cdImage.animate([
            { transform: 'rotate(360deg)'}
        ], {
            duration: 10000, // 10s
            iterations: Infinity
        })
        cdAnimate.pause()

        playlist.onscroll = function() {
            const scrollTop = playlist.scrollTop
            const newWidth = cdWidth - scrollTop

            cd.style.width = newWidth > 0 ? newWidth + 'px' : 0
            cd.style.height = newWidth > 0 ? newWidth + 'px' : 0
            cd.style.opacity = newWidth / cdWidth
        }
        // Listen event click on play button
        togglePlay.onclick = function() {
            if (_this.isPlaying) {
                audio.pause()
            }else {
                audio.play()
            }
        }
        // audio start
        audio.onplay = () => {
            _this.isPlaying = true
            player.classList.add('playing')
            cdAnimate.play()
        }
        // audio pause
        audio.onpause = () => {
            _this.isPlaying = false
            player.classList.remove('playing')
            cdAnimate.pause()
        }
        // Listen to the song's tempo change
        audio.ontimeupdate = () => {
            if (audio.duration) {
                progress.value = Math.floor(audio.currentTime * 100 / audio.duration)
            }
        }

        audio.onended = function() {
            if (_this.isRepeat) {
                audio.play()
            }else {
                startNewSong()
            }
        }
        
        progress.onchange = (e) => {
            audio.currentTime = e.target.value * audio.duration / 100
        }

        function startNewSong() {
            if (_this.isShuffle) {
                _this.shuffleSong()
            }else {
                _this.nextSong()
            }
            
            _this.scrollIntoView()

            audio.play()
        }

        nextBtn.onclick = () => {
            startNewSong()
        }

        prevBtn.onclick = () => {
            if (_this.isShuffle) {
                _this.shuffleSong()
            }else {
                _this.prevSong()
            }
            
            _this.scrollIntoView()
            audio.play()
        }

        shuffleBtn.onclick = () => {
            _this.isShuffle = !_this.isShuffle
            shuffleBtn.classList.toggle('active', _this.isShuffle)
            _this.setConfig('isShuffle', _this.isShuffle)
            if (_this.isShuffle) {
                _this.initArraySongs(_this.currentIndex)
                _this.setConfig('indexSongs', _this.indexSongs)
            }
        }

        repeatBtn.onclick = () => {
            _this.isRepeat = !_this.isRepeat
            repeatBtn.classList.toggle('active', _this.isRepeat)
            _this.setConfig('isRepeat', _this.isRepeat)
        }
        // select music song
        playlist.onclick = function(e) {
            const node = e.target.closest('.song:not(.active)')
            if (node || e.target.closest('.option')) {
                if (node) {
                    $('.song.active').classList.remove('active')
                    node.classList.add('active')
                    _this.currentIndex = Number(node.getAttribute('data-index')) // node.dataset.index
                    _this.loadCurrentSong()
                    
                    audio.play()
                }
            }
        }

        // click volumn button
        soundBtn.onclick = (e) => {
            const target = e.target.closest('i')
            _this.config.volume !== 0 ? _this.isSound = !_this.isSound : _this.isSound = false
            
            if (target) {
                soundBtn.classList.toggle('active', _this.isSound)
                if (!_this.isSound) {
                    soundLevel.value = 0
                    audio.volume = 0
                }else {
                    audio.volume = _this.config.volume
                    soundLevel.value = _this.config.volume * 100
                }
            }
        }
        soundLevel.onchange = (e) => {
            _this.isVolume = e.target.value / 100
            audio.volume = _this.isVolume
            _this.setConfig('volume', _this.isVolume)

            _this.changeVolume()
        }
    },
    changeVolume: function() {
        const lowVolume = $('.btn-sound .fa-solid.fa-volume-low')
        const highVolume = $('.btn-sound .fa-solid.fa-volume-high')
            
        if (audio.volume === 0) {
            soundBtn.classList.remove('active')
        }else if (audio.volume <= 0.5 && audio.volume > 0) {
            soundBtn.classList.add('active')
            lowVolume.style.opacity = 1
            highVolume.style.opacity = 0
        }else {
            soundBtn.classList.add('active')
            lowVolume.style.opacity = 0
            highVolume.style.opacity = 1
        }
    },
    nextSong: function() {
        this.currentIndex++
        if (this.currentIndex >= this.songs.length) {
            this.currentIndex = 0
        }
        $('.song.active').classList.remove('active')
        $$('.song')[this.currentIndex].classList.add('active')
        
        this.loadCurrentSong()
    },
    prevSong: function() {
        this.currentIndex--
        if (this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1
        }
        $('.song.active').classList.remove('active')
        $$('.song')[this.currentIndex].classList.add('active')
        
        this.loadCurrentSong()
    },
    nextIndex: 0,
    indexSongs: [],
    initArraySongs: function(current) {
        this.indexSongs = []
        this.indexSongs.push(current)
        this.songs.forEach((song, index) => {
            if (index !== current) {
                this.indexSongs.push(index)
            }
        })
    },
    shuffleSong: function() {
        // random no duplicate
        let newIndex
        this.nextIndex++
        newIndex = Math.floor(Math.random() * (this.songs.length - this.nextIndex) + this.nextIndex)
        this.currentIndex = this.indexSongs[newIndex]
        this.indexSongs[this.nextIndex] = this.indexSongs.splice(newIndex, 1, this.indexSongs[this.nextIndex])[0]
        this.setConfig('indexSongs', this.indexSongs)

        $('.song.active').classList.remove('active')
        $$('.song')[this.currentIndex].classList.add('active')
        this.loadCurrentSong()
        if (this.nextIndex >= this.songs.length - 1) {
            this.nextIndex = 0
            this.initArraySongs(this.currentIndex)
        }
    },
    scrollIntoView: function() {
        $('.song.active').scrollIntoView(
            {
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
            }
        )
    },
    loadConfig: function() {
        this.isRepeat = this.config.isRepeat
        this.isShuffle = this.config.isShuffle
        this.setConfig('volume', this.isVolume)
        this.indexSongs = this.config.indexSongs

        shuffleBtn.classList.toggle('active', this.isShuffle)
        repeatBtn.classList.toggle('active', this.isRepeat)
    },
    loadCurrentSong: function() {
        const currentSong = this.currentSong
        songName.textContent = `${currentSong.name}`
        cdImage.setAttribute('src', currentSong.image)
        audio.setAttribute('src', currentSong.path)
    },
    start: function() {
        // load config
       
        this.loadConfig()
        // Define Properties for Object app
        this.defineProperties()

        // loading current song
        this.loadCurrentSong()

        // Action Listener
        this.handleEvents()

        // Render Playlist
        this.render()
        
    }
}

app.start()
