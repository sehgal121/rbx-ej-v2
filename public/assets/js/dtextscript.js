window.addEventListener('scroll', function() {
    const delayedText = document.getElementById('delayedText');
    const rect = delayedText.getBoundingClientRect();
    const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);

    if (rect.top <= viewHeight) {
        setTimeout(() => {
            delayedText.style.opacity = 1;
        }, 1000); // 1000 milliseconds delay
    }
});
