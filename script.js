document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("year");
    const typedText = document.getElementById("typed-text");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    if (!typedText || reducedMotion) {
        return;
    }

    const phrases = [
        "question -> note",
        "question -> system",
        "question -> room",
        "question -> game?",
        "¯\\_(ツ)_/¯"
    ];

    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;

    function type() {
        const phrase = phrases[phraseIndex];

        if (!deleting) {
            characterIndex += 1;
            typedText.textContent = phrase.slice(0, characterIndex);

            if (characterIndex === phrase.length) {
                window.setTimeout(() => {
                    deleting = true;
                    type();
                }, 2600);
                return;
            }

            window.setTimeout(type, 48 + Math.random() * 35);
            return;
        }

        characterIndex -= 1;
        typedText.textContent = phrase.slice(0, characterIndex);

        if (characterIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            window.setTimeout(type, 450);
            return;
        }

        window.setTimeout(type, 24);
    }

    typedText.textContent = "";
    window.setTimeout(type, 700);
});
