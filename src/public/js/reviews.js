(function () {
  const REVIEWS_URL = '/data/reviews.json';
  const PLACEHOLDER_PHOTO = '/img/reviews/placeholder.svg';
  const INITIAL_BATCH = 3;
  const LOAD_BATCH = 6;

  const reviewsGrid = document.getElementById('reviewsGrid');
  const loadMoreButton = document.getElementById('loadMoreReviews');

  if (!reviewsGrid || !loadMoreButton) {
    return;
  }

  let reviews = [];
  let currentIndex = 0;

  const createReviewCard = (review) => {
    const card = document.createElement('div');
    card.className = 'review';

    const photo = document.createElement('img');
    photo.className = 'review-photo';
    const resolvedPhoto = review.photo ? review.photo : PLACEHOLDER_PHOTO;
    photo.src = resolvedPhoto;
    photo.alt = review.author ? `Photo of ${review.author}` : 'Cliente';
    photo.onerror = () => {
      photo.classList.add('placeholder');
      photo.src = PLACEHOLDER_PHOTO;
    };

    const body = document.createElement('div');
    body.className = 'review-body';

    const text = document.createElement('p');
    text.className = 'review-text';
    text.textContent = review.text || '';

    const author = document.createElement('span');
    author.className = 'review-author';
    author.textContent = review.author || 'Cliente';

    body.appendChild(text);
    body.appendChild(author);

    card.appendChild(photo);
    card.appendChild(body);

    return card;
  };

  const renderNextBatch = (count) => {
    if (currentIndex >= reviews.length) return;
    const slice = reviews.slice(currentIndex, currentIndex + count);
    const fragment = document.createDocumentFragment();

    slice.forEach((review) => {
      fragment.appendChild(createReviewCard(review));
    });

    reviewsGrid.appendChild(fragment);
    currentIndex += slice.length;
    updateLoadMoreVisibility();
  };

  const updateLoadMoreVisibility = () => {
    if (currentIndex >= reviews.length) {
      loadMoreButton.style.display = 'none';
    } else {
      loadMoreButton.style.display = 'inline-flex';
    }
  };

  const handleLoadMore = () => {
    renderNextBatch(LOAD_BATCH);
  };

  const initialize = async () => {
    try {
      const response = await fetch(REVIEWS_URL);
      if (!response.ok) {
        throw new Error('No se pudo cargar reviews.json');
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Formato de reviews.json no válido');
      }

      reviews = data;
      currentIndex = 0;
      reviewsGrid.innerHTML = '';
      renderNextBatch(INITIAL_BATCH);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
      reviewsGrid.innerHTML = '<p class="review-text">No se pudieron cargar las reseñas en este momento.</p>';
      loadMoreButton.style.display = 'none';
    }
  };

  loadMoreButton.addEventListener('click', handleLoadMore);
  document.addEventListener('DOMContentLoaded', initialize);
})();
