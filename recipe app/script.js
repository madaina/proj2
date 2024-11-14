const API_KEY = '0c7b5c2897b843dbb6acce1130423ffa';

const searchInput = document.getElementById('searchInput');
const randomRecipesSection = document.getElementById('randomRecipes');
const recipeModal = document.getElementById('recipeModal');
const closeModal = document.getElementById('closeModal');
const recipeTitle = document.getElementById('recipeTitle');
const recipeDescription = document.getElementById('recipeDescription');
const ingredientsList = document.getElementById('ingredientsList');
const instructionsList = document.getElementById('instructionsList');
const recipeImage = document.getElementById('recipeImage');

searchInput.addEventListener('input', () => fetchSuggestions(searchInput.value));
closeModal.addEventListener('click', () => {
    recipeModal.style.display = 'none';
    document.getElementById('mainContent').classList.remove('blurred');
});

window.addEventListener('load', () => fetchRandomRecipes());

/* display recipes in grid function */

async function fetchRandomRecipes(number = 10) {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/random?number=${number}&apiKey=${API_KEY}`);
        const data = await response.json();
        displayRecipesInGrid(data.recipes);
    } catch (error) {
        console.error("Error fetching recipes:", error);
    }
}

async function fetchRecipesByCategory(category) {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${category}&number=12&apiKey=${API_KEY}`);
        const data = await response.json();

        const recipesWithDetails = await Promise.all(data.results.map(async (recipe) => {
            const fullRecipe = await fetch(`https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${API_KEY}`);
            return fullRecipe.json();
        }));

        displayRecipesInGrid(recipesWithDetails);
    } catch (error) {
        console.error("Error fetching recipes by category:", error);
    }
}

function displayRecipesInGrid(recipes) {
    const recipeGrid = document.getElementById('recipeGrid');
    recipeGrid.innerHTML = '';

    recipes.forEach(recipe => {
        const recipeDiv = document.createElement('div');
        recipeDiv.className = 'recipe-item';

        const time = recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : "Time not available";
        const description = recipe.summary ? recipe.summary : "No description available";

        recipeDiv.innerHTML = `
            <img class="food-img" src="${recipe.image}" alt="${recipe.title}">
            <h3 class="recipe-title">${recipe.title}</h3>
            <div class="recipe-time">
                <img class="time-img" src="assets/clock.svg">
                <span class="recipe-minute">${time}</span>
            </div>
            <div class="recipe-description">
                <p>${description}</p>
            </div>
            <div class="buttons">
                <button class="recipe-button1" onclick="viewRecipe(${recipe.id})">View Recipe</button>
                <div class="recipe-button2" onclick="addToFavorites({
                    id: ${recipe.id},
                    name: '${recipe.title}',
                    image: '${recipe.image}'
                })">
                    <img class="favs-img" src="assets/favorites.svg">
                    <span class="button-text">add</span>
                </div>
            </div>
        `;
        recipeGrid.appendChild(recipeDiv);
    });
}

const categoryLinks = document.querySelectorAll('#searchByCategory a');
categoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.target.textContent.toLowerCase();
        fetchRecipesByCategory(category);
    });
});

/* details function */

async function viewRecipe(id) {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/information?includeNutrition=true&apiKey=${API_KEY}`);
        const data = await response.json();

        recipeTitle.textContent = data.title;
        recipeImage.src = data.image;
        ingredientsList.innerHTML = '';
        instructionsList.innerHTML = '';

        data.extendedIngredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient.original;
            ingredientsList.appendChild(li);
        });

        data.analyzedInstructions[0]?.steps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step.step;
            instructionsList.appendChild(li);
        });

        if (data.nutrition) {
            const { calories, protein, fat, carbohydrates } = data.nutrition.nutrients.reduce((acc, nutrient) => {
                if (nutrient.name === "Calories") acc.calories = nutrient.amount + " " + nutrient.unit;
                if (nutrient.name === "Protein") acc.protein = nutrient.amount + " " + nutrient.unit;
                if (nutrient.name === "Fat") acc.fat = nutrient.amount + " " + nutrient.unit;
                if (nutrient.name === "Carbohydrates") acc.carbohydrates = nutrient.amount + " " + nutrient.unit;
                return acc;
            }, {});

            document.getElementById('nutritionInfo').innerHTML = `
                <p>Calories: ${calories || "N/A"}</p>
                <p>Protein: ${protein || "N/A"}</p>
                <p>Fat: ${fat || "N/A"}</p>
                <p>Carbohydrates: ${carbohydrates || "N/A"}</p>
            `;
        }

        recipeModal.style.display = 'block'; 
        document.getElementById('mainContent').classList.add('blurred');
    } catch (error) {
        console.error("Error fetching recipe details:", error);
    }
}

/* search function */
async function fetchSuggestions(query) {
    if (!query) {
        document.getElementById('suggestions').innerHTML = '';
        return;
    }

    const response = await fetch(`https://api.spoonacular.com/recipes/autocomplete?query=${query}&number=5&apiKey=${API_KEY}`);
    const suggestions = await response.json();
    displaySuggestions(suggestions);
}

function displaySuggestions(suggestions) {
    const suggestionsList = document.getElementById('suggestions');
    suggestionsList.innerHTML = '';

    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion.title;
        div.setAttribute('tabindex', '0');
        div.style.padding = "10px";
        div.style.borderRadius = "5px";
        div.style.cursor = "pointer";

        div.addEventListener('click', () => {
            viewRecipe(suggestion.id);
            suggestionsList.innerHTML = ''; 
            searchInput.value = ''; 
        });
        div.addEventListener('mouseover', () => div.style.backgroundColor = "#d2d2d2");
        div.addEventListener('mouseout', () => div.style.backgroundColor = "");
        suggestionsList.appendChild(div);
    });
}

async function fetchRecipes(query, offset = 0) {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=12&apiKey=${API_KEY}&offset=${offset}`);
        const data = await response.json();
        displayRecipesInGrid(data.results);
    } catch (error) {
        console.error("Error fetching recipes:", error);
    }
}

/* favs function */
function renderFavorites() {
    const favoritesContainer = document.querySelector(".modal-content");
    console.log("Favorites container:", favoritesContainer);
    if (!favoritesContainer) {
        console.error("Не найден контейнер для избранных рецептов.");
        return;
    }

    favoritesContainer.innerHTML = ''; 

    const closeButton = document.createElement("span");
    closeButton.classList.add("close-button");
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", closeFavoritesModal);
    favoritesContainer.appendChild(closeButton);

    const favoriteRecipes = JSON.parse(localStorage.getItem("favorites")) || [];
    console.log("Favorite recipes:", favoriteRecipes);

    if (favoriteRecipes.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.classList.add("empty-message");
        emptyMessage.textContent = "Нет избранных рецептов.";
        favoritesContainer.appendChild(emptyMessage);
    } else {
        favoriteRecipes.forEach(recipe => {
            console.log("Rendering recipe:", recipe);
            const recipeCard = document.createElement("div");
            recipeCard.classList.add("recipe-card");

            recipeCard.innerHTML = `
                <img class="recipe-image" src="${recipe.image || 'https://via.placeholder.com/150'}" alt="${recipe.name}">
                <div class="recipe-info">
                    <h3 class="recipe-name">${recipe.name}</h3>
                    <button class="remove-from-favorites">Удалить</button>
                </div>
            `;

            recipeCard.querySelector(".remove-from-favorites").addEventListener("click", function () {
                removeFromFavorites(recipe.id);
            });

            favoritesContainer.appendChild(recipeCard);
        });
    }

    const modal = document.querySelector(".modal");
    if (modal) {
        modal.removeEventListener("click", closeModalOnOutsideClick);
        modal.addEventListener("click", closeModalOnOutsideClick);
    }
}

function removeFromFavorites(recipeId) {
    const favoriteRecipes = JSON.parse(localStorage.getItem("favorites")) || [];
    const updatedFavorites = favoriteRecipes.filter(recipe => recipe.id !== recipeId);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    renderFavorites();
}

function closeFavoritesModal() {
    const modal = document.querySelector(".modal");
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeModalOnOutsideClick(event) {
    const modalContent = document.querySelector(".modal-content");
    if (modalContent && !modalContent.contains(event.target)) {
        closeFavoritesModal();
    }
}

function addToFavorites(recipe) {
    const favoriteRecipes = JSON.parse(localStorage.getItem("favorites")) || [];
        const isAlreadyFavorite = favoriteRecipes.some(fav => fav.id === recipe.id);
    
    if (!isAlreadyFavorite) {
        favoriteRecipes.push(recipe);
        localStorage.setItem("favorites", JSON.stringify(favoriteRecipes));
        alert("Added to favorites!");
    } else {
        alert("This recipe is already in your favorites.");
    }
}

document.querySelector(".myFavorites").addEventListener("click", function () {
    renderFavorites();
    const modal = document.querySelector(".modal");
    if (modal) {
        modal.style.display = 'block';
    }
});

/* адаптивка */
const categoriesToggle = document.getElementById('categoriesToggle');
const categories = document.querySelector('.aside');
const recipeGrid = document.getElementById('recipeGrid');

categoriesToggle.addEventListener('click', () => {
    categories.classList.toggle('show');
    recipeGrid.classList.toggle('hide');
});