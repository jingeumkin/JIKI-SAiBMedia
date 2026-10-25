function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

const randomizedList = shuffleArray(ALL_MEDIA_SOURCE);

const STATE = {
    items: randomizedList,
    activeCategory: 'All',
    searchQuery: '',
    currentPlayingUrl: '',
    currentSlide: 0,
    featuredItems: shuffleArray(ALL_MEDIA_SOURCE).slice(0, 5),
    hotItems: shuffleArray(ALL_MEDIA_SOURCE.filter(i => i.isHot)),
    sliderInterval: null,
    isLoading: true
};

/* --- Skeletons --- */
function renderHeroSkeleton() {
    const slidesWrapper = document.getElementById('hero-slides');
    if(!slidesWrapper) return;
    slidesWrapper.innerHTML = `
        <div class="absolute inset-0 skeleton-shimmer flex flex-col justify-end p-6 sm:p-10 lg:p-12">
            <div class="w-24 h-5 rounded-full bg-white/10 mb-3 skeleton-shimmer"></div>
            <div class="w-3/4 sm:w-1/2 h-8 sm:h-10 rounded-lg bg-white/10 mb-4 skeleton-shimmer"></div>
            <div class="w-32 h-10 rounded-full bg-white/10 skeleton-shimmer"></div>
        </div>
    `;
}

function renderGridSkeleton(count = 12) {
    const grid = document.getElementById('media-grid');
    if(!grid) return;
    grid.innerHTML = Array(count).fill(0).map(() => `
        <div class="bg-surface-100 rounded-xl overflow-hidden border border-white/5 relative flex flex-col h-full animate-pulse">
            <div class="aspect-[2/3] w-full skeleton-shimmer relative">
                <div class="absolute top-2.5 right-2.5 w-12 h-4 rounded-md bg-white/10"></div>
            </div>
            <div class="p-3 space-y-2">
                <div class="h-3.5 bg-white/10 rounded-md w-5/6 skeleton-shimmer"></div>
                <div class="h-3.5 bg-white/10 rounded-md w-1/2 skeleton-shimmer"></div>
            </div>
        </div>
    `).join('');
}

function renderEpisodesSkeleton(count = 5) {
    const epList = document.getElementById('vm-episodes');
    if(!epList) return;
    epList.innerHTML = Array(count).fill(0).map(() => `
        <div class="w-full h-12 bg-surface-100 border border-white/5 rounded-xl p-3 flex items-center justify-between skeleton-shimmer">
            <div class="h-4 bg-white/10 rounded-md w-2/3"></div>
            <div class="w-4 h-4 bg-white/10 rounded-full"></div>
        </div>
    `).join('');
}

/* --- Trending Row Render --- */
function renderHotRow() {
    const track = document.getElementById('hot-row-track');
    const hotSection = document.getElementById('hot-section');
    if(!track || !hotSection) return;

    const query = STATE.searchQuery.toLowerCase().trim();
    const filteredHot = STATE.hotItems.filter(item => {
        const matchesCat = STATE.activeCategory === 'All' || item.category === STATE.activeCategory;
        const matchesSearch = item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
        return matchesCat && matchesSearch;
    });

    if (filteredHot.length === 0) {
        hotSection.style.display = 'none';
        return;
    } else {
        hotSection.style.display = 'block';
    }

    track.innerHTML = filteredHot.map((item, index) => `
        <div onclick="openVideo(${item.id})" class="shrink-0 w-36 sm:w-44 lg:w-48 snap-start cursor-pointer group card-hover">
            <div class="bg-surface-100 rounded-xl overflow-hidden border border-white/10 relative flex flex-col h-full shadow-xl">
                <div class="aspect-[2/3] w-full overflow-hidden relative bg-surface-200">
                    <img src="${item.cover}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="this.src='https://placehold.co/400x600/121215/FFFFFF?text=MEDIA'">
                    <div class="absolute inset-0 bg-gradient-to-t from-surface-100 via-transparent to-transparent opacity-80"></div>
                    
                    <!-- Rank Badge -->
                    <div class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white text-black text-[10px] sm:text-xs font-black tracking-wider uppercase shadow-md flex items-center">
                        ${item.hotBadge || `TOP ${index + 1}`}
                    </div>

                    <!-- Category Badge -->
                    <span class="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/20 text-[9px] font-semibold text-zinc-300 uppercase shadow">
                        ${item.category}
                    </span>

                    <!-- Play Icon Overlay -->
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300">
                        <div class="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <svg class="w-5 h-5 ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    </div>
                </div>

                <div class="p-3 flex-1 flex flex-col justify-between">
                    <h3 class="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-white transition-colors duration-300 line-clamp-2 leading-snug">
                        ${item.title}
                    </h3>
                </div>
            </div>
        </div>
    `).join('');
}

function scrollHotRow(direction) {
    const track = document.getElementById('hot-row-track');
    if(track) {
        const scrollAmount = track.clientWidth * 0.75;
        track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
}

/* --- Hero Slider Controller --- */
function initHeroSlider() {
    const slidesWrapper = document.getElementById('hero-slides');
    const dotsWrapper = document.getElementById('hero-dots');
    if (!slidesWrapper || !dotsWrapper) return;

    slidesWrapper.innerHTML = STATE.featuredItems.map((item, idx) => `
        <div class="slide-item absolute inset-0 ${idx === 0 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}">
            <img src="${item.cover}" alt="${item.title}" class="w-full h-full object-cover object-center" onerror="this.src='https://placehold.co/1200x600/121215/FFFFFF?text=FEATURED'">
            <div class="absolute inset-0 bg-gradient-to-t from-darkbg via-darkbg/50 to-transparent"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-darkbg/90 via-darkbg/40 to-transparent"></div>
            
            <div class="absolute bottom-0 inset-x-0 p-6 sm:p-10 lg:p-12 flex flex-col justify-end max-w-2xl">
                <span class="inline-block px-3.5 py-1 rounded-full bg-white backdrop-blur-md text-black font-extrabold text-[10px] sm:text-xs uppercase tracking-widest w-max mb-2 sm:mb-3 shadow-lg">
                    Featured ${item.category}
                </span>
                <h1 class="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3 sm:mb-4 drop-shadow-md">
                    ${item.title}
                </h1>
                <div class="flex items-center gap-3">
                    <button onclick="openVideo(${item.id})" class="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm flex items-center gap-2 transition-all duration-300 shadow-xl hover:scale-105 active:scale-95">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        Watch Now
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    dotsWrapper.innerHTML = STATE.featuredItems.map((_, idx) => `
        <button onclick="goToSlide(${idx})" class="dot-btn h-2 rounded-full transition-all duration-500 ease-out ${idx === 0 ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'}"></button>
    `).join('');

    setupSwipeGestures();
    startSliderAutoPlay();
}

function updateSlideUI() {
    const slides = document.querySelectorAll('.slide-item');
    const dots = document.querySelectorAll('.dot-btn');

    slides.forEach((slide, idx) => {
        if (idx === STATE.currentSlide) {
            slide.classList.remove('opacity-0', 'z-0', 'pointer-events-none');
            slide.classList.add('opacity-100', 'z-10', 'pointer-events-auto');
        } else {
            slide.classList.remove('opacity-100', 'z-10', 'pointer-events-auto');
            slide.classList.add('opacity-0', 'z-0', 'pointer-events-none');
        }
    });

    dots.forEach((dot, idx) => {
        if (idx === STATE.currentSlide) {
            dot.classList.remove('w-2', 'bg-white/30');
            dot.classList.add('w-6', 'bg-white');
        } else {
            dot.classList.remove('w-6', 'bg-white');
            dot.classList.add('w-2', 'bg-white/30');
        }
    });
}

function moveSlide(direction) {
    clearInterval(STATE.sliderInterval);
    STATE.currentSlide = (STATE.currentSlide + direction + STATE.featuredItems.length) % STATE.featuredItems.length;
    updateSlideUI();
    startSliderAutoPlay();
}

function goToSlide(index) {
    clearInterval(STATE.sliderInterval);
    STATE.currentSlide = index;
    updateSlideUI();
    startSliderAutoPlay();
}

function startSliderAutoPlay() {
    clearInterval(STATE.sliderInterval);
    STATE.sliderInterval = setInterval(() => {
        STATE.currentSlide = (STATE.currentSlide + 1) % STATE.featuredItems.length;
        updateSlideUI();
    }, 6000);
}

function setupSwipeGestures() {
    const container = document.getElementById('hero-slider-container');
    if(!container) return;

    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) moveSlide(1);
            else moveSlide(-1);
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/* --- Grid Rendering --- */
function renderGrid(showSkeletonFirst = false) {
    const grid = document.getElementById('media-grid');
    const countEl = document.getElementById('media-count');
    if(!grid) return;

    renderHotRow();

    if (showSkeletonFirst) {
        renderGridSkeleton();
        setTimeout(() => {
            executeGridRender(grid, countEl);
        }, 300);
    } else {
        executeGridRender(grid, countEl);
    }
}

function executeGridRender(grid, countEl) {
    const query = STATE.searchQuery.toLowerCase().trim();
    const filtered = STATE.items.filter(item => {
        const matchesCat = STATE.activeCategory === 'All' || item.category === STATE.activeCategory;
        const matchesSearch = item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
        return matchesCat && matchesSearch;
    });

    countEl.innerText = `${filtered.length} items`;

    if(filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center animate-fade-in">
                <div class="w-16 h-16 mx-auto mb-3 text-zinc-600 border border-zinc-800 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <p class="text-sm text-zinc-400 font-medium">No results found matching your query.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map((item) => `
        <div onclick="openVideo(${item.id})" class="group cursor-pointer card-hover">
            <div class="bg-surface-100 rounded-xl overflow-hidden border border-white/10 relative flex flex-col h-full shadow-lg">
                <div class="aspect-[2/3] w-full overflow-hidden relative bg-surface-200">
                    <img src="${item.cover}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="this.src='https://placehold.co/400x600/121215/FFFFFF?text=MEDIA'">
                    <div class="absolute inset-0 bg-gradient-to-t from-surface-100 via-transparent to-transparent opacity-85"></div>
                    
                    <!-- Category Badge -->
                    <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-zinc-200 tracking-wider uppercase shadow-md">
                        ${item.category}
                    </span>

                    ${item.isHot ? `
                        <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white text-black text-[10px] font-extrabold tracking-wider uppercase shadow-md">
                            HOT
                        </span>
                    ` : ''}

                    <!-- Play Overlay -->
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300">
                        <div class="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <svg class="w-5 h-5 ml-0.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    </div>
                </div>

                <div class="p-3 flex-1 flex flex-col justify-between">
                    <h3 class="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors duration-300 line-clamp-2 leading-snug">
                        ${item.title}
                    </h3>
                </div>
            </div>
        </div>
    `).join('');
}

function filterCategory(cat) {
    STATE.activeCategory = cat;
    
    document.querySelectorAll('.hdr-cat-btn').forEach(btn => {
        if(btn.innerText.includes(cat) || (cat === 'Cartoons' && btn.innerText.includes('Animation'))) {
            btn.className = 'hdr-cat-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-black shadow-md shadow-white/10';
        } else {
            btn.className = 'hdr-cat-btn px-4 py-1.5 rounded-full text-xs font-semibold text-zinc-400 hover:text-white';
        }
    });

    document.querySelectorAll('.cat-btn').forEach(btn => {
        if(btn.innerText.includes(cat) || (cat === 'Cartoons' && btn.innerText.includes('Animation'))) {
            btn.className = 'cat-btn active px-4 py-1.5 rounded-full text-xs font-medium shrink-0 bg-white text-black shadow-md shadow-white/10';
        } else {
            btn.className = 'cat-btn px-4 py-1.5 rounded-full text-xs font-medium shrink-0 bg-surface-100 hover:bg-surface-200 text-zinc-300 border border-white/10';
        }
    });

    const catTitles = { 'All': 'All Titles', 'Movies': 'Movies', 'Series': 'Series', 'Cartoons': 'Animation' };
    document.getElementById('section-title').innerHTML = `<span class="w-1.5 h-5 bg-white rounded-full"></span> ${catTitles[cat] || cat}`;

    renderGrid(true);
}

const debouncedSearch = debounce((val) => {
    STATE.searchQuery = val;
    const clearBtn = document.getElementById('main-clear');
    if(val.trim() !== '') {
        clearBtn.classList.remove('opacity-0', 'pointer-events-none');
    } else {
        clearBtn.classList.add('opacity-0', 'pointer-events-none');
    }
    renderGrid(true);
}, 150);

function clearSearch() {
    document.getElementById('main-search').value = '';
    debouncedSearch('');
}

function resetView() {
    clearSearch();
    STATE.items = shuffleArray(ALL_MEDIA_SOURCE);
    STATE.featuredItems = shuffleArray(ALL_MEDIA_SOURCE).slice(0, 5);
    STATE.hotItems = shuffleArray(ALL_MEDIA_SOURCE.filter(i => i.isHot));
    initHeroSlider();
    filterCategory('All');
    document.getElementById('main-container').scrollTo({ top: 0, behavior: 'smooth' });
}

/* --- Player Controller --- */
let hlsInstance = null;
let streamTimeout = null;

function showStatusOverlay() {
    const overlay = document.getElementById('video-status-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
    }
}

function hideStatusOverlay() {
    const overlay = document.getElementById('video-status-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }
}

function openVideo(id) {
    const item = STATE.items.find(i => i.id === id);
    if(!item) return;

    document.getElementById('vm-title').innerText = item.title;
    const modal = document.getElementById('video-modal');
    modal.classList.add('active');

    const epList = document.getElementById('vm-episodes');
    const epCount = document.getElementById('vm-count');

    renderEpisodesSkeleton(item.episodes ? item.episodes.length : 1);

    setTimeout(() => {
        if(item.episodes && item.episodes.length > 0) {
            epCount.innerText = `${item.episodes.length} Episodes`;
            epList.innerHTML = item.episodes.map((ep) => `
                <button onclick="playEpisode('${ep.url}', this)" class="ep-btn w-full p-3 bg-surface-100 hover:bg-surface-200 border border-white/5 rounded-xl text-left text-xs sm:text-sm font-medium text-zinc-200 transition-all duration-300 flex items-center justify-between group active:scale-[0.98] animate-fade-in">
                    <span class="truncate pr-2">${ep.name}</span>
                    <svg class="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors duration-300 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
            `).join('');
            playEpisode(item.episodes[0].url, epList.firstElementChild);
        } else {
            epCount.innerText = "1 Episode";
            epList.innerHTML = `
                <button onclick="playEpisode('${item.url}', this)" class="ep-btn w-full p-3 bg-surface-100 hover:bg-surface-200 border border-white/5 rounded-xl text-left text-xs sm:text-sm font-medium text-zinc-200 transition-all duration-300 flex items-center justify-between group active:scale-[0.98] animate-fade-in">
                    <span class="truncate pr-2">${item.title}</span>
                    <svg class="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors duration-300 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
            `;
            playEpisode(item.url, epList.firstElementChild);
        }
    }, 300);
}

function playEpisode(url, btnElement) {
    STATE.currentPlayingUrl = url;

    document.querySelectorAll('.ep-btn').forEach(btn => {
        btn.className = 'ep-btn w-full p-3 bg-surface-100 hover:bg-surface-200 border border-white/5 rounded-xl text-left text-xs sm:text-sm font-medium text-zinc-300 transition-all duration-300 flex items-center justify-between group active:scale-[0.98]';
    });
    if(btnElement) {
        btnElement.className = 'ep-btn w-full p-3 bg-white/10 border-white/30 text-white font-semibold rounded-xl text-left text-xs sm:text-sm transition-all duration-300 flex items-center justify-between group shadow-lg active:scale-[0.98]';
    }

    const ytContainer = document.getElementById('yt-player-container');
    const stdPlayer = document.getElementById('std-player');
    
    showStatusOverlay();

    if (streamTimeout) clearTimeout(streamTimeout);
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }

    if(url.includes('youtube.com') || url.includes('youtu.be')) {
        stdPlayer.classList.add('hidden');
        stdPlayer.pause();
        ytContainer.classList.remove('hidden');
        
        let videoId = '';
        if (url.includes('youtu.be')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com')) {
            videoId = url.split('v=')[1].split('&')[0];
        }

        ytContainer.innerHTML = `<iframe class="w-full h-full border-0" src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen onload="hideStatusOverlay()"></iframe>`;
        
        streamTimeout = setTimeout(() => {
            hideStatusOverlay();
        }, 1500);

    } else {
        ytContainer.classList.add('hidden');
        ytContainer.innerHTML = '';
        stdPlayer.classList.remove('hidden');

        const handlePlaying = () => {
            hideStatusOverlay();
            stdPlayer.removeEventListener('playing', handlePlaying);
            stdPlayer.removeEventListener('loadeddata', handlePlaying);
        };

        stdPlayer.addEventListener('playing', handlePlaying);
        stdPlayer.addEventListener('loadeddata', handlePlaying);

        if (url.includes('.m3u8') && Hls.isSupported()) {
            hlsInstance = new Hls({ enableWorker: true });
            hlsInstance.loadSource(url);
            hlsInstance.attachMedia(stdPlayer);
            
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
                stdPlayer.play().catch(() => {});
            });

            hlsInstance.on(Hls.Events.ERROR, function(event, data) {
                if (data.fatal) {
                    showStatusOverlay();
                }
            });
        } else {
            stdPlayer.src = url;
            stdPlayer.play().catch(() => {});
        }

        stdPlayer.onerror = () => {
            showStatusOverlay();
        };

        streamTimeout = setTimeout(() => {
            if (stdPlayer.paused || stdPlayer.readyState < 2) {
                showStatusOverlay();
            }
        }, 8000);
    }
}

function closeVideo() {
    const modal = document.getElementById('video-modal');
    modal.classList.remove('active');

    if (streamTimeout) clearTimeout(streamTimeout);
    
    setTimeout(() => {
        document.getElementById('yt-player-container').innerHTML = '';
        const stdPlayer = document.getElementById('std-player');
        stdPlayer.pause();
        stdPlayer.src = '';

        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
    }, 400);
}

window.onload = () => {
    renderHeroSkeleton();
    renderGridSkeleton();

    setTimeout(() => {
        initHeroSlider();
        renderGrid();
        STATE.isLoading = false;
    }, 500);
};
