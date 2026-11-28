(() => {
    // Only these two exhibitions mount external players. Keep their containers
    // in place and exchange the surrounding exhibition text with its translation.
    const copy = [
        ".skip-link", ".site-mark", ".nav-links > a", ".site-footer",
        ".machines-hero", ".wil-hero", ".films > .collection-head", ".film-group",
        ".machines-workshop", ".machines-note", ".wil-index", ".wil-note",
        ".piece-topline", ".piece-foot", ".film-copy"
    ].join(", ");
    const screens = ".machines-stage, .wil-stage, article.film";
    const poster = ".stage-figure, .wil-figure-stage, .film-figure";
    let request = 0;

    document.addEventListener("click", async (event) => {
        const link = event.target.closest("a[data-language-switch]");
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
            !document.querySelector(".film-player iframe, .wil-player iframe")) return;
        if (location.protocol === "file:") return;

        const target = new URL(link.href);
        if (target.origin !== location.origin) return;
        event.preventDefault();
        const turn = ++request;
        if (link.hreflang === document.documentElement.lang) return;

        try {
            const response = await fetch(target, { mode: "same-origin" });
            if (!response.ok) throw new Error("Missing translation");
            const translation = new DOMParser().parseFromString(await response.text(), "text/html");
            if (turn !== request) return;
            const currentCopy = [...document.querySelectorAll(copy)];
            const translatedCopy = [...translation.querySelectorAll(copy)];
            const slots = [...document.querySelectorAll(screens)];
            if (translation.documentElement.lang !== link.hreflang ||
                currentCopy.length !== translatedCopy.length ||
                slots.some(slot => !translation.getElementById(slot.id)?.querySelector(poster))) {
                throw new Error("Incomplete translation");
            }

            currentCopy.forEach((node, i) => node.replaceWith(translatedCopy[i]));
            const playingNote = translation.body.dataset.playingNote;
            for (const slot of slots) {
                const unopened = slot.querySelector(poster);
                if (unopened) {
                    unopened.replaceWith(translation.getElementById(slot.id).querySelector(poster));
                } else {
                    slot.querySelector(".piece-foot > span").textContent = playingNote;
                }
            }
            document.body.dataset.playingNote = playingNote;
            document.documentElement.lang = link.hreflang;
            document.title = translation.title;
            document.querySelector('meta[name="description"]').content =
                translation.querySelector('meta[name="description"]').content;
            for (const selector of [".site-nav", ".language-switch"]) {
                document.querySelector(selector).setAttribute("aria-label",
                    translation.querySelector(selector).getAttribute("aria-label"));
            }
            for (const item of document.querySelectorAll("a[data-language-switch]")) {
                if (item.hreflang === link.hreflang) item.setAttribute("aria-current", "page");
                else item.removeAttribute("aria-current");
            }
            history.replaceState(history.state, "", target);
        } catch {
            if (turn === request) location.assign(target);
        }
    });
})();
