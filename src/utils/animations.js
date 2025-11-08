// Activador global de animaciones: añade class 'is-loaded' y observa elementos con .reveal/.card/.product
(function () {
  if (typeof document === 'undefined') return;

  // Si el HTML tiene la clase no-js por defecto, la script la quita para activar estilos JS
  document.documentElement.classList.remove('no-js');

  function init() {
    // Activar estado cargado para animaciones que dependen de html.is-loaded
    requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'));

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    // Selector amplio para elementos que queremos animar
    const WATCH_SELECTOR = '.reveal, .card, .product, .producto, header, main, footer, .hero, .payment-card, .payment-container, .card-preview';

    // helper para observar un elemento si aplica
    const observeIfNeeded = (el) => {
      if (!(el instanceof Element)) return;
      // evitar re-observar
      if (el.__animObserved) return;
      // asegurar que tenga la clase reveal para que el CSS actúe
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
      observer.observe(el);
      el.__animObserved = true;
    };

    // Inicial: observa los elementos ya presentes
    document.querySelectorAll(WATCH_SELECTOR).forEach(observeIfNeeded);

    // Observador de mutaciones para detectar elementos añadidos dinámicamente (p. ej. navegación SPA)
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            // si el nodo mismo coincide, observarlo
            if (node.matches && node.matches(WATCH_SELECTOR)) observeIfNeeded(node);
            // y buscar descendientes que coincidan
            node.querySelectorAll && node.querySelectorAll(WATCH_SELECTOR).forEach(observeIfNeeded);
          });
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Export nothing; file is intended for side-effects when imported by bundler
