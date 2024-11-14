const apiKey = '54545c0be853df0481ca8a6e00e42074';

const citySearch = document.getElementById('city-search');
const weatherIcon = document.getElementById('weather-icon');
const weatherCondition = document.getElementById('weather-condition');
const temperatureElement = document.getElementById('temperature');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('wind-speed');
const cityNameElement = document.getElementById('city-name');
const toggleUnit = document.getElementById('toggle-unit');
const useLocationBtn = document.getElementById('use-location');
const suggestionsContainer = document.getElementById('suggestionsList'); 

let isCelsius = true;
let debounceTimeout;

async function fetchCitySuggestions(query) {
    if (query.length < 3) {
        suggestionsContainer.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${apiKey}&units=metric&cnt=5`);

        if (!response.ok) {
            console.error('Failed to fetch city suggestions, response status:', response.status);
            alert('Error fetching city suggestions. Please try again.');
            return;
        }

        const data = await response.json();

        if (data.cod === '200') {
            displaySuggestions(data.list); 
        } else {
            console.error('Error fetching city suggestions:', data.message);
            alert('Error fetching city suggestions');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('There was an issue with the network request.');
    }
}

function displaySuggestions(cities) {
    suggestionsContainer.innerHTML = '';

    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    cities.forEach(city => {
        const suggestionItem = document.createElement('div');
        suggestionItem.textContent = city.name;
        suggestionItem.classList.add('suggestion-item');

        suggestionItem.addEventListener('click', () => {
            citySearch.value = city.name;
            fetchWeather(city.name); 
            suggestionsContainer.style.display = 'none';
        });

        suggestionsContainer.appendChild(suggestionItem);
    });

    suggestionsContainer.style.display = 'block'; 
}

citySearch.addEventListener('input', function() {
    const query = citySearch.value.trim();
    
    clearTimeout(debounceTimeout);
    if (query.length >= 3) {
        debounceTimeout = setTimeout(() => {
            fetchCitySuggestions(query);
        }, 500);
    } else {
        suggestionsContainer.style.display = 'none'; 
    }
});

function displayWeather(data) {
    const temperature = data.main.temp;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const weatherDescription = data.weather[0].description.toLowerCase();

    let iconPath;
    switch (weatherDescription) {
        case 'clear sky':
            iconPath = 'assets/sunny.png';  
            break;
        case 'few clouds':
        case 'scattered clouds':
        case 'broken clouds':
        case 'overcast clouds':
            iconPath = 'assets/cloudy.png';  
            break;
        case 'rain':
        case 'light rain':
        case 'moderate rain':
            iconPath = 'assets/rainy.png';  
            break;
        case 'snow':
            iconPath = 'assets/snowy.png';  
            break;
    }

    cityNameElement.textContent = data.name;
    weatherCondition.textContent = `Currently ${data.weather[0].description}`;
    weatherIcon.src = iconPath;

    let displayTemp = isCelsius ? temperature : (temperature * 9 / 5) + 32;
    temperatureElement.textContent = `${displayTemp.toFixed(1)}°${isCelsius ? 'C' : 'F'}`;

    humidityElement.textContent = humidity + '%';
    windSpeedElement.textContent = windSpeed + ' m/s';
}

async function fetchWeather(city) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    if (data.cod === 200) {
        displayWeather(data);
    } else {
        alert('City not found');
    }
}

citySearch.addEventListener('input', () => {
    const cityName = citySearch.value.trim();
    if (cityName.length > 1) {  
        fetchCitySuggestions(cityName); 
    } else {
        suggestionsContainer.innerHTML = '';
    }
});

useLocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
            const data = await response.json();
            displayWeather(data);
        }, () => alert('Unable to retrieve your location.'));
    } else {
        alert('Geolocation is not supported by your browser.');
    }
});

toggleUnit.addEventListener('click', () => {
    isCelsius = !isCelsius;
   
    const currentTemp = parseFloat(temperatureElement.textContent);

    let newTemp;

    if (isCelsius) {
        newTemp = (currentTemp - 32) * 5 / 9;  
        toggleUnit.textContent = 'Show Fahrenheit';
    } else {
        newTemp = (currentTemp * 9 / 5) + 32;
        toggleUnit.textContent = 'Show Celsius';
    }

    temperatureElement.textContent = `${newTemp.toFixed(1)}°${isCelsius ? 'C' : 'F'}`;
});

fetchWeather('Astana');

async function fetchForecast(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`);
        
        if (!response.ok) {
            console.error('Failed to fetch forecast:', response.status);
            return;
        }

        const data = await response.json();
        
        if (data.cod === '200') {
            displayForecast(data.list);
        } else {
            console.error('Error fetching forecast data:', data.message);
            alert('Error fetching forecast');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('There was an issue with the network request.');
    }
}

function displayForecast(forecastData) {
    const forecastList = document.querySelector('.forecast-list');
    forecastList.innerHTML = ''; 

    for (let i = 0; i < forecastData.length; i += 8) {  
        const day = forecastData[i];
        
        const date = new Date(day.dt * 1000);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        const { temp_max, temp_min } = day.main;
        const { description, icon } = day.weather[0];

        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');

        forecastItem.innerHTML = `
            <p class="date">${dayOfWeek}</p>
            <p class="weather-cond">${description}</p>
            <p class="temp-high">High: ${Math.round(temp_max)}°C</p>
            <p class="temp-low">Low: ${Math.round(temp_min)}°C</p>
            <img class="forecast-pic" src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}">
        `;

        forecastList.appendChild(forecastItem);
    }
}

async function fetchWeather(city) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    
    if (data.cod === 200) {
        displayWeather(data); 
        fetchForecast(city);   
    } else {
        alert('City not found');
    }
}

