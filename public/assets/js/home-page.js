/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
// GSAP ANIMATIONS
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.saveStyles(
  '.hero-img-container, .hero-img-overlay, .hero-content'
);

// Hero section animation
ScrollTrigger.matchMedia({
  '(min-width: 992px)': function () {
    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-section',
        scrub: 1,
        pin: true,
        start: 'top top',
        end: '200%',
      },
    });

    heroTl
      .from('.hero-img-container', { scale: 5 })
      .to('.hero-img-overlay', { opacity: 0, duration: 0.5 }, 0)
      .to('.hero-content', { scale: 0, opacity: 0, duration: 0.05 }, 0)
      .set({}, {}, '+=.5');
  },
});
