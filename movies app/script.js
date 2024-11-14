const API_KEY = '9b04da4a2c4c1c0aad5c7b35734599f2';
const searchIcon = document.getElementById('search-icon');
const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById("suggestions");

const modal = document.querySelector('.movie-details-modal');
let movies = []; 

searchIcon.addEventListener('click', () => {
    if (searchInput.style.width === '0px' || searchInput.style.width === '') {
        searchInput.style.width = '300px'; 
        searchInput.style.opacity = '1'; 
    } else {
        searchInput.style.width = '0'; 
        searchInput.style.opacity = '0'; 
        suggestionsList.style.display = 'none'; 
    }
});

async function fetchMovies(query) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`);
        
        if (!response.ok) {
            throw new Error("Ошибка при получении данных");
        }

        const data = await response.json();
        return data.results; 
    } catch (error) {
        console.error("Ошибка:", error);
        return [];
    }
}

async function showSuggestions(query) {
    suggestionsList.innerHTML = ""; 

    if (query.length === 0) {
        suggestionsList.style.display = "none"; 
        return;
    }

    const movies = await fetchMovies(query); 

    if (movies.length > 0) {
        suggestionsList.style.display = "block";
        movies.forEach(movie => {
            const listItem = document.createElement("li");
            listItem.textContent = movie.title;

            listItem.addEventListener("click", () => {
                searchInput.value = ""; 
                suggestionsList.style.display = "none";

                viewMovie(movie.id); 
            });

            suggestionsList.appendChild(listItem);
        });
    } else {
        suggestionsList.style.display = "none";
    }
}

searchInput.addEventListener("input", (event) => {
    const query = event.target.value;
    showSuggestions(query);
});


function renderMoviesInGrid(movies) {
    filmsGrid.innerHTML = ''; 

    movies.forEach((movie) => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.setAttribute('data-id', movie.id);

        movieCard.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-rating">
                    <img class="rating-pic" src="assets/rating.png" />
                    <p class="rating">${movie.vote_average.toFixed(1)}</p>
                </div>
                <div class="movie-release">
                    <img class="release-pic" src="assets/calendar.png" />
                    <p class="release-date">${movie.release_date}</p>
                </div>
            </div>
        `;

        movieCard.querySelector('.movie-poster').addEventListener('click', () => viewMovie(movie.id));
        movieCard.querySelector('.movie-title').addEventListener('click', () => viewMovie(movie.id));

        filmsGrid.appendChild(movieCard);
    });
}

async function fetchAndDisplayMovies() {
    try {
        const totalPages = 5;
        movies = [];

        for (let page = 1; page <= totalPages; page++) {
            const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`);
            if (!response.ok) throw new Error('Ошибка при получении данных');
            const data = await response.json();
            movies = movies.concat(data.results);
        }

        renderMoviesInGrid(movies); 

    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function sortAndDisplayMovies(sortBy) {
    movies.sort((a, b) => {
        if (sortBy === 'popularity') {
            return b.popularity - a.popularity;
        } else if (sortBy === 'release_date') {
            return new Date(b.release_date) - new Date(a.release_date);
        } else if (sortBy === 'vote_average') {
            return b.vote_average - a.vote_average;
        }
    });
    
    renderMoviesInGrid(movies); 
}

document.querySelector('.popularity').addEventListener('click', () => sortAndDisplayMovies('popularity'));
document.querySelector('.release').addEventListener('click', () => sortAndDisplayMovies('release_date'));
document.querySelector('.rating').addEventListener('click', () => sortAndDisplayMovies('vote_average'));

document.addEventListener('DOMContentLoaded', fetchAndDisplayMovies);

// MODAL
async function viewMovie(id) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=en-US`);
        const data = await response.json();

        const titleElement = document.querySelector('.movie-details-container h2');
        const descriptionElement = document.querySelector('.movie-details-container .description');
        const posterElement = document.querySelector('.poster img');
        const ratingElement = document.querySelector('.movieRating span');
        const durationElement = document.querySelector('.movie-info .duration .duration-text');

        if (titleElement) titleElement.textContent = data.title;
        if (descriptionElement) descriptionElement.textContent = data.overview;
        if (posterElement) posterElement.src = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
        if (ratingElement) {
            ratingElement.textContent = data.vote_average.toFixed(1);
        }
        
        if (durationElement) {
            durationElement.textContent = data.runtime ? ` ${data.runtime} min` : ' Время неизвестно';
        }

        const watchlistButton = document.querySelector('.watchlist-btn');
        if (watchlistButton) {
            watchlistButton.addEventListener('click', () => {
                addToWatchlist(data); 
            });
        }

        const castList = document.querySelector('.cast-list');
        if (castList) castList.innerHTML = '';

        const creditsResponse = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}`);
        const creditsData = await creditsResponse.json();

        if (castList) {
            creditsData.cast.forEach(member => {
                const castMember = document.createElement('div');
                castMember.classList.add('cast-member');
                const imageUrl = member.profile_path 
                    ? `https://image.tmdb.org/t/p/w500${member.profile_path}` 
                    : '';

                castMember.innerHTML = `
                    <img src="${imageUrl}" alt="${member.name}">
                    <span>${member.name}</span>
                `;
                castList.appendChild(castMember);
            });
        }

        const trailerResponse = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}&language=en-US`);
        const trailerData = await trailerResponse.json();
        const trailer = trailerData.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
        
        const trailerIframe = document.querySelector('.trailer-section iframe');
        const trailerButton = document.querySelector('.watch-trailer-btn'); 
        
        if (trailer && trailerIframe) {
            trailerIframe.src = `https://www.youtube.com/embed/${trailer.key}`;
            if (trailerButton) {
                trailerButton.style.display = 'flex';
            }
        }

        if (trailerButton) {
            trailerButton.addEventListener('click', () => {
                const trailerSection = document.querySelector('.trailer-section');
                if (trailerSection) {
                    trailerSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        document.querySelector('.movie-details-modal').style.display = 'block';

    } catch (error) {
        console.error("Error fetching movie details:", error);
    }
    
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.querySelector('.movie-details-modal').style.display = 'none';
        });
    }
}

/* WATCHLIST FUNCTION */
function addToWatchlist(movie) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    
    if (!watchlist.some(item => item.id === movie.id)) {
        localStorage.setItem('watchlist', JSON.stringify(watchlist)); 
        alert(`${movie.title} добавлен в Watchlist!`);
    } else {
        alert(`${movie.title} уже в вашем Watchlist!`); 
    }
}

function deleteFromWatchlist(movieId) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || []; 

    const movieIndex = watchlist.findIndex(movie => movie.id === movieId);

    if (movieIndex !== -1) {
        watchlist.splice(movieIndex, 1);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        alert(`Фильм с ID ${movieId} был удален из Watchlist`);

        renderWatchlist();
    }
}

function renderWatchlist() {
    const watchlistMoviesContainer = document.getElementById('watchlistMovies');
    watchlistMoviesContainer.innerHTML = ''; 

    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || []; 

    if (watchlist.length === 0) {
        watchlistMoviesContainer.innerHTML = '<p>No movies in your Watchlist</p>';
        return;
    }

    watchlist.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        movieCard.innerHTML = `
            <div class = "watchlistMovies">
                <div class = "moviecard">
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="watchlist-poster">
                    <div class="watchlist-info">
                        <h3 class="watchlist-title">${movie.title}</h3>
                        <div class="functions">
                            <button class="view-det">View details</button>
                            <div class="delete" data-id="${movie.id}">
                                <img class="del" src="assets/delete.png">
                                <span class="del-text">Delete</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;


        movieCard.querySelector('.delete').addEventListener('click', (event) => {
            const movieId = event.currentTarget.dataset.id; 
            deleteFromWatchlist(Number(movieId));
        });

        movieCard.querySelector('.view-det').addEventListener('click', () => viewMovie(movie.id));

        watchlistMoviesContainer.appendChild(movieCard);
    });
}

function showWatchlist() {
    const watchlistContainer = document.getElementById('watchlistContainer');
    watchlistContainer.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
    renderWatchlist();
}

function hideWatchlist() {
    const watchlistContainer = document.getElementById('watchlistContainer');
    watchlistContainer.style.display = 'none';
    document.body.style.overflow = 'auto'; 
}

document.getElementById('watchlistButton').addEventListener('click', showWatchlist);

document.getElementById('closeWatchlist').addEventListener('click', hideWatchlist);