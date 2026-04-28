document.addEventListener('DOMContentLoaded', () => {

    // Year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Subtle typing — dry, factual, system-focused
    const phrases = [
        'local rules -> global behavior',
        'systems / intelligence',
        'security / sound',
        'play / unfinished fragments',
        '¯\_(ツ)_/¯'
    ];

    const el = document.getElementById('typed-text');
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function type() {
        const current = phrases[phraseIndex];

        if (!deleting) {
            el.textContent = current.slice(0, charIndex + 1);
            charIndex++;
            if (charIndex === current.length) {
                setTimeout(() => { deleting = true; type(); }, 3000);
                return;
            }
            setTimeout(type, 50 + Math.random() * 40);
        } else {
            el.textContent = current.slice(0, charIndex - 1);
            charIndex--;
            if (charIndex === 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                setTimeout(type, 500);
                return;
            }
            setTimeout(type, 25);
        }
    }

    setTimeout(type, 1000);
});
