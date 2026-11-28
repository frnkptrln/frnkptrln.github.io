(() => {
    const here = new URL(location.href);
    const requested = here.searchParams.get("lang");
    const alternate = [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
        .find(link => link.hreflang === requested);
    if (alternate && requested !== document.documentElement.lang) {
        const target = new URL(alternate.href);
        here.searchParams.delete("lang");
        target.search = here.search;
        target.hash = here.hash;
        location.replace(target.href);
        return;
    }

    const switches = document.querySelectorAll("a[data-language-switch]");
    function linkToSection(hash) {
        for (const link of switches) {
            const target = new URL(link.href);
            target.hash = hash;
            link.href = target.href;
        }
    }
    function visibleSection() {
        if (window.scrollY < 80) return location.hash;
        const target = location.hash && document.getElementById(location.hash.slice(1));
        if (target) {
            const box = target.getBoundingClientRect();
            if (box.bottom > 0 && box.top < window.innerHeight * 0.7) return location.hash;
        }
        const sections = [...document.querySelectorAll("main section[id], main article[id]")];
        const current = sections.filter(section => section.getBoundingClientRect().top <= 100).pop();
        return current ? "#" + current.id : location.hash;
    }
    window.addEventListener("hashchange", () => linkToSection(location.hash));
    for (const link of switches) {
        link.addEventListener("focus", () => linkToSection(visibleSection()));
        link.addEventListener("pointerdown", () => linkToSection(visibleSection()));
    }
    linkToSection(location.hash);
})();
