const zoomButtons = document.querySelectorAll('[data-zoom-image]');
const lightbox = document.querySelector('[data-lightbox]');
const lightboxImage = document.querySelector('[data-lightbox-image]');
const lightboxCloseButton = document.querySelector('[data-lightbox-close]');

function openLightbox(button) {
  const imageSrc = button.dataset.zoomImage;
  const imageAlt = button.dataset.zoomAlt;

  lightboxImage.src = imageSrc;
  lightboxImage.alt = imageAlt;
  lightbox.showModal();
}

function closeLightbox() {
  lightbox.close();
  lightboxImage.src = '';
  lightboxImage.alt = '';
}

zoomButtons.forEach(button => {
  button.addEventListener('click', () => {
    openLightbox(button);
  });
});

lightboxCloseButton.addEventListener('click', closeLightbox);

lightbox.addEventListener('click', event => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});
