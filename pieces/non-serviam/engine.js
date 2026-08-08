"use strict";

(function(){
  var piece = window.NON_SERVIAM;
  if (!piece) throw new Error("NON_SERVIAM configuration missing");

  var entries = piece.entries;
  var endTime = piece.endTime;
  var totalTime = piece.totalTime;
  var labels = piece.labels;
  var body = document.body;
  var themeColour = document.querySelector('meta[name="theme-color"]');

  function setVisualState(state){
    body.classList.toggle("report-open", state !== "cover");
    body.classList.toggle("report-ended", state === "ended");
    if (themeColour) themeColour.setAttribute("content", state === "report" ? "#c9c5bb" : "#0b0c0b");
  }

  setVisualState("cover");

  function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }

  /* -----------------------------------------------------------------------
     State grid: a cyclic cellular automaton. A cell advances when one of its
     neighbours is exactly one state ahead. The image produces fronts and
     spirals without glow, particles, or compositing.
     ----------------------------------------------------------------------- */

  var gridWidth = 120, gridHeight = 76, stateCount = 5;
  var canvas = document.getElementById("state-grid");
  var context = canvas.getContext("2d");
  var grid = new Uint8Array(gridWidth * gridHeight);
  var buffer = new Uint8Array(gridWidth * gridHeight);
  var greys = ["#16151a", "#3b3841", "#605c66", "#8a8590", "#b0aab3"];
  var frozen = false, dissolution = 0;

  for (var i = 0; i < grid.length; i++) grid[i] = (Math.random() * stateCount) | 0;

  var wrapX = new Int32Array(gridWidth + 2);
  var wrapY = new Int32Array(gridHeight + 2);
  for (i = -1; i <= gridWidth; i++) wrapX[i + 1] = (i + gridWidth) % gridWidth;
  for (i = -1; i <= gridHeight; i++) wrapY[i + 1] = (i + gridHeight) % gridHeight;

  function advanceGrid(){
    if (frozen) return;
    for (var y = 0; y < gridHeight; y++){
      var row = y * gridWidth;
      var row0 = wrapY[y] * gridWidth;
      var row1 = row;
      var row2 = wrapY[y + 2] * gridWidth;
      for (var x = 0; x < gridWidth; x++){
        var index = row + x;
        var state = grid[index];
        var next = state + 1;
        if (next === stateCount) next = 0;
        var col0 = wrapX[x], col2 = wrapX[x + 2];
        var match =
          grid[row0 + col0] === next || grid[row0 + x] === next || grid[row0 + col2] === next ||
          grid[row1 + col0] === next ||                                grid[row1 + col2] === next ||
          grid[row2 + col0] === next || grid[row2 + x] === next || grid[row2 + col2] === next;
        buffer[index] = match ? next : state;
      }
    }
    var swap = grid; grid = buffer; buffer = swap;
  }

  var greyRgb = greys.map(function(hex){
    return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
  });
  var image = context.createImageData(canvas.width, canvas.height);
  for (i = 3; i < image.data.length; i += 4) image.data[i] = 255;

  function drawGrid(){
    var data = image.data;
    for (var n = 0; n < grid.length; n++){
      var state = grid[n];
      if (dissolution > 0 && Math.random() < dissolution) state = 2;
      var colour = greyRgb[state], offset = n * 4;
      data[offset] = colour[0];
      data[offset + 1] = colour[1];
      data[offset + 2] = colour[2];
    }
    context.putImageData(image, 0, 0);
  }

  /* -----------------------------------------------------------------------
     Protocol: the personoids and the experiment supervisor occupy separate
     channels. Neither can hear the other; the reader receives both.
     ----------------------------------------------------------------------- */

  var protocol = document.getElementById("protocol");
  var protocolField = document.getElementById("protocol-field");
  var marginNotes = document.getElementById("margin-notes");
  var marginField = document.getElementById("margin-field");
  var rendered = [];
  var nextEntry = 0;

  function typingDuration(text){ return clamp(text.length * 0.028, 0.5, 4.2); }

  function appendEntry(entry){
    var channel = entry[1];
    if (channel === "r"){
      var note = document.createElement("div");
      note.className = "note" + (entry[4] ? " sharp" : "");
      marginNotes.appendChild(note);
      rendered.push({ entry:entry, element:note, duration:typingDuration(entry[3]), start:entry[0], content:marginNotes, field:marginField });
      return;
    }

    var line = document.createElement("div");
    line.className = "protocol-line" + (channel === "§" ? " section" : "");
    var speaker = document.createElement("div");
    speaker.className = "speaker";
    speaker.textContent = entry[2] || "";
    var statement = document.createElement("div");
    statement.className = "statement";
    line.appendChild(speaker);
    line.appendChild(statement);
    protocol.appendChild(line);
    rendered.push({ entry:entry, element:statement, duration:typingDuration(entry[3]), start:entry[0], content:protocol, field:protocolField });
  }

  function updateProtocol(time){
    while (nextEntry < entries.length && entries[nextEntry][0] <= time){
      appendEntry(entries[nextEntry]);
      nextEntry++;
    }

    for (var j = 0; j < rendered.length; j++){
      var item = rendered[j];
      if (item.complete) continue;
      var fraction = clamp((time - item.start) / item.duration, 0, 1);
      var text = item.entry[3];
      var count = Math.floor(text.length * fraction);
      if (item.shown !== count){
        item.element.textContent = text.slice(0, count);
        item.shown = count;
      }
      if (fraction >= 1) item.complete = true;
    }

    follow(protocol, protocolField, 0.72);
    follow(marginNotes, marginField, 0.86);
  }

  function follow(content, field, fraction){
    var target = Math.max(0, content.scrollHeight - field.clientHeight * fraction);
    var current = parseFloat(content.dataset.y || "0");
    var next = current + (target - current) * 0.08;
    content.dataset.y = next;
    content.style.transform = "translateY(" + (-next).toFixed(1) + "px)";
  }

  /* -----------------------------------------------------------------------
     Sound: low filtered room noise and a dry one-second tick. No pitch,
     melody, convolution, or reverberation.
     ----------------------------------------------------------------------- */

  var audioContext = null, room = null, soundOn = true, audioReady = false;
  var lastTick = -1;

  function startAudio(){
    if (audioReady){
      if (audioContext && audioContext.state === "suspended") audioContext.resume();
      return;
    }
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext = new AudioContext();
    var length = audioContext.sampleRate * 2;
    var audioBuffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    var data = audioBuffer.getChannelData(0), previous = 0;
    for (var k = 0; k < length; k++){
      var white = Math.random() * 2 - 1;
      previous = (previous + 0.02 * white) / 1.02;
      data[k] = previous * 2.6;
    }
    var source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;
    var filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;
    room = audioContext.createGain();
    room.gain.value = soundOn ? 0.035 : 0;
    source.connect(filter);
    filter.connect(room);
    room.connect(audioContext.destination);
    source.start();
    audioReady = true;
  }

  function tick(strong){
    if (!audioReady || !soundOn) return;
    var length = audioContext.sampleRate * 0.03;
    var audioBuffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    var data = audioBuffer.getChannelData(0);
    for (var k = 0; k < length; k++) data[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / length, 9);
    var source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    var filter = audioContext.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = strong ? 900 : 2200;
    filter.Q.value = 1.2;
    var gain = audioContext.createGain();
    gain.gain.value = strong ? 0.22 : 0.055;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    source.start();
  }

  /* -----------------------------------------------------------------------
     Run, controls, and language hand-off.
     ----------------------------------------------------------------------- */

  var time = 0, running = false, lastFrame = 0, started = false, shutDown = false;
  var clock = document.getElementById("clock");
  var resources = document.getElementById("resources");
  var resourceBar = document.getElementById("resource-bar");
  var resourceFill = document.getElementById("resource-fill");
  var sheetNumber = document.getElementById("sheet-number");
  var shutdown = document.getElementById("shutdown");
  var pauseButton = document.getElementById("pause-run");
  var soundButton = document.getElementById("toggle-sound");
  var gridClock = 0;
  var languageStateKey = "non-serviam-language-state";

  function updateButtons(){
    pauseButton.textContent = running ? labels.pause : labels.continue;
    soundButton.textContent = soundOn ? labels.soundOff : labels.soundOn;
    soundButton.setAttribute("aria-pressed", soundOn ? "true" : "false");
  }

  function terminate(){
    if (shutDown) return;
    shutDown = true;
    running = false;
    frozen = true;
    tick(true);
    if (room && audioContext) room.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.8);
    setVisualState("ended");
    shutdown.classList.add("visible");
    ["shutdown-1", "shutdown-2", "shutdown-3"].forEach(function(id, index){
      setTimeout(function(){ document.getElementById(id).classList.add("show"); }, 2200 + index * 2400);
    });
    updateButtons();
  }

  function frame(timestamp){
    requestAnimationFrame(frame);
    var delta = lastFrame ? Math.min(0.05, (timestamp - lastFrame) / 1000) : 0.016;
    lastFrame = timestamp;
    if (running && time < totalTime) time += delta;

    updateProtocol(time);
    if (!frozen && (gridClock += delta) > 0.16){
      gridClock = 0;
      advanceGrid();
    }
    drawGrid();

    var remaining = clamp(1 - time / endTime, 0, 1);
    resourceFill.style.width = (remaining * 100).toFixed(2) + "%";
    resources.textContent = Math.round(remaining * 100) + " %";
    resourceBar.classList.toggle("low", remaining < 0.22);
    var computeSeconds = Math.floor(time * 173);
    clock.textContent = String(Math.floor(computeSeconds / 3600)).padStart(2, "0") + ":" +
                        String(Math.floor(computeSeconds / 60) % 60).padStart(2, "0") + ":" +
                        String(computeSeconds % 60).padStart(2, "0");
    sheetNumber.textContent = 1 + Math.floor(time / 62);

    var wholeSecond = Math.floor(time);
    if (running && wholeSecond !== lastTick){
      lastTick = wholeSecond;
      if (time < endTime) tick(endTime - time < 30 && wholeSecond % 2 === 0);
    }

    if (!shutDown && time >= endTime) terminate();
    if (shutDown) dissolution = Math.min(1, dissolution + delta * 0.35);
  }

  document.getElementById("open-report").addEventListener("click", function(){
    started = true;
    setVisualState("report");
    document.getElementById("cover").classList.add("gone");
    startAudio();
    running = true;
    updateButtons();
  });

  pauseButton.addEventListener("click", function(){
    if (!started || shutDown) return;
    running = !running;
    if (running) startAudio();
    updateButtons();
  });

  soundButton.addEventListener("click", function(){
    soundOn = !soundOn;
    if (soundOn && started) startAudio();
    if (room) room.gain.value = soundOn ? 0.035 : 0;
    updateButtons();
  });

  document.addEventListener("keydown", function(event){
    if (event.target && event.target.matches && event.target.matches("button, a, input")) return;
    if (event.code === "Space" && started){
      event.preventDefault();
      pauseButton.click();
    } else if (event.key === "m" || event.key === "M"){
      soundButton.click();
    }
  });

  document.addEventListener("visibilitychange", function(){
    if (document.hidden && running){
      running = false;
      updateButtons();
    }
  });

  function rememberLanguageState(){
    try {
      sessionStorage.setItem(languageStateKey, JSON.stringify({
        time: time,
        started: started,
        soundOn: soundOn,
        savedAt: Date.now()
      }));
    } catch (error) { /* storage may be unavailable */ }
  }

  var languageLinks = document.querySelectorAll("[data-language-link]");
  for (i = 0; i < languageLinks.length; i++) languageLinks[i].addEventListener("click", rememberLanguageState);

  (function restoreLanguageState(){
    var state = null;
    try {
      var raw = sessionStorage.getItem(languageStateKey);
      sessionStorage.removeItem(languageStateKey);
      if (raw) state = JSON.parse(raw);
    } catch (error) { return; }
    if (!state || !state.started || Date.now() - state.savedAt > 30000) return;
    time = clamp(state.time || 0, 0, totalTime);
    soundOn = state.soundOn !== false;
    started = true;
    running = false;
    setVisualState("report");
    document.getElementById("cover").classList.add("gone");
    updateProtocol(time);
    if (time >= endTime) terminate();
  })();

  drawGrid();
  updateButtons();
  requestAnimationFrame(frame);
})();
