import './styles/base.css';
import * as model from './model.js';

// More common words are at the beginning of the model.words array
let centeredWord = model.words[Math.floor(Math.random()*model.words.length * 0.2)];

if (window.location.hash) {
  centeredWord = window.location.hash.slice(1);
}

let overWord = undefined;

let sprites = {};

function createWordElement(w) {
  let t = document.createTextNode(w);
  let n = document.createElement('span');

  n.appendChild(t);
  n.classList.add('word');
  n.style.opacity = 0;

  n.addEventListener("click", function () {
    window.location = "#" + w;
  });

  n.addEventListener("mouseleave", function () {
    overWord = undefined;
  });

  n.addEventListener("mouseenter", function () {
    overWord = w;
  });

  document.body.appendChild(n);
  
  return n;
}

let centeredCutoff = 1;

function populateWords() {
  let ranks = [];

  for(const w of model.words) {
    let s = model.similarity(w,centeredWord);
    ranks.push(s);
  }
  ranks.sort();

  let cutoff = ranks[ranks.length - 60]; 

  centeredCutoff = cutoff;
  
  for(const w of model.words) {
    let s = model.similarity(w,centeredWord);

    // remove words that are too far away
    if (sprites[w] && (s <= cutoff)) {
      document.body.removeChild( sprites[w].element );
      delete sprites[w];
    }

    // create words if they are missing
    if (! sprites[w]) {
      if (s > cutoff) {
        sprites[w] = {
          element: createWordElement(w),
          x: Math.random(),
          y: Math.random(),
          dx: 0,
          dy: 0,
          opacity: 0
        };
      }
    }
  }
}

let previousTimeStamp;

function step(timestamp) {
  if (previousTimeStamp === undefined) {
    previousTimeStamp = timestamp;
  }

  let elapsed = (timestamp - previousTimeStamp)/1000.0;
  if (elapsed > 0.3) elapsed = 0.3;
  
  const width  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const height = window.innerHeight|| document.documentElement.clientHeight|| document.body.clientHeight;

  // springs between words based on their similarity
  for(const a of Object.keys(sprites)) {
    let sa = sprites[a];
    sa.dx = sa.dy = 0;
    
    for(const b of Object.keys(sprites)) {
      if (a !== b) {
        let sb = sprites[b];

        let d0 = (model.similarity(a,b) - centeredCutoff) / (1.0 - centeredCutoff);
        let d1 = Math.pow(Math.sqrt(1.0 - Math.pow(d0,2)),3);
        let d2 = Math.sqrt( Math.pow(sa.x - sb.x,2) + Math.pow(sa.y - sb.y,2) ); 
        let k = d1 - d2;

        if (Math.abs(k) > 0.01) {
          let factor = 0.1;
          sa.dx += (sa.x - sb.x) * k * Math.abs(k) * factor;
          sa.dy += (sa.y - sb.y) * k * Math.abs(k) * factor;
        }
      }    
    }
  }

  // push centered word to middle of the screen
  let s = sprites[centeredWord];
  s.dx += (0.5 - s.x) * 1.5;
  s.dy += (0.5 - s.y) * 1.5;

  // synchronize internal state with DOM elements
  for(const w of Object.keys(sprites)) {
    let s = sprites[w];
    let el = s.element;

    if (w === centeredWord) {
      el.classList.add('focused');
    } else {
      el.classList.remove('focused');
    }
    
    s.x += s.dx*elapsed;
    s.y += s.dy*elapsed;

    el.style.top = height * (s.y*0.6 + 0.2);
    el.style.left = width * (s.x*0.6 + 0.2);

    let goalOpacity = 1;

    if (overWord)
      goalOpacity = Math.pow(model.similarity(w, overWord),0.6);
    if (isNaN(goalOpacity)) goalOpacity = 0;
    
    s.opacity = (s.opacity + 7*elapsed*goalOpacity)/(1+7*elapsed);
    el.style.opacity = s.opacity;
  }
  
  previousTimeStamp = timestamp;
  window.requestAnimationFrame(step);
}

window.addEventListener("hashchange", function() {
  centeredWord = window.location.hash.slice(1);
  populateWords();
}, false);

window.addEventListener('load', async function () {
  await model.load();

  populateWords();
  window.requestAnimationFrame(step);
});
