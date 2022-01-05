import './styles/base.css';

import words from '../data/words.json';
import vectorsUrl from '../data/vectors.bin';

function dot(a,b) {
  let result = 0;
  for(let i=0; i<a.length; i++) {
    result = result + a[i]*b[i];
  }
  return result;
}


const norm = (a) => Math.sqrt(dot(a,a));

let model = {};

let memoized = {};
function similarity(a,b) {
  if (a > b) {
    let c = a;
    a = b;
    b = c;
  }

  if (memoized[a]) {
    if (memoized[a][b]) {
      return memoized[a][b];
    }
  } else {
    memoized[a] = {};
  }
  let result = dot(model[a],model[b]) / norm(model[a]) / norm(model[b]);
  if (result > 1) result = 1;
  memoized[a][b] = result;
  return result; 
}

async function loadModel() {
  let vectorsRaw = await fetch(vectorsUrl);
  let buffer = await vectorsRaw.arrayBuffer();

  let vectors = new Float32Array(buffer);

  let dimension = vectors.length / words.length;
  
  for(let i=0; i < words.length; i++ ) {
    model[words[i]] = vectors.subarray(i*dimension, (i+1)*dimension);
  }
}

let centeredWord = 'crust';

window.addEventListener("hashchange", function() {
  centeredWord = window.location.hash.slice(1);
  populateWords();
}, false);

if(window.location.hash) {
  centeredWord = window.location.hash.slice(1);
}

let overWord = undefined;
let centeredCutoff = 1;
let sprites = {};

function populateWords() {
  let ranks = [];
  for(const w of words) {
    let s = similarity(w,centeredWord);
    ranks.push(s);
  }
  ranks.sort();
  let cutoff = ranks[ranks.length - 60]; 
  centeredCutoff = cutoff;
  
  for(const w of words) {
    let s = similarity(w,centeredWord);

    if (sprites[w] && (s <= cutoff)) {
      document.body.removeChild( sprites[w].element );
      delete sprites[w];
    }

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

function createWordElement(w) {
  let t = document.createTextNode(w);
  let n = document.createElement('span');
  n.appendChild(t);
  n.classList.add('word');
  document.body.appendChild(n);
  n.style.opacity = 1;
  n.addEventListener("click", function () {
    window.location = "#" + w;
  });
  n.addEventListener("mouseleave", function () {
    overWord = undefined;
  });
  n.addEventListener("mouseenter", function () {
    overWord = w;
  });
  
  return n;
}

let start, previousTimeStamp;

function step(timestamp) {
  if (start === undefined) {
    start = timestamp;
    previousTimeStamp = timestamp;
  }

  const elapsed = (timestamp - previousTimeStamp)/1000.0;
  previousTimeStamp = timestamp; 

  const width  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const height = window.innerHeight|| document.documentElement.clientHeight|| document.body.clientHeight;

  for(const w of Object.keys(sprites)) {
    let s = sprites[w];
    s.dx = s.dy = 0;
  }

  for(const a of Object.keys(sprites)) {
    let sa = sprites[a];
    
    for(const b of Object.keys(sprites)) {
      if (a !== b) {
        let sb = sprites[b];

        let d1 = Math.sqrt(1.0 - Math.pow((similarity(a,b) - centeredCutoff) / (1.0 - centeredCutoff),2));
        d1 = Math.pow(d1,3);

        let d2 = Math.sqrt( Math.pow(sa.x - sb.x,2) + Math.pow(sa.y - sb.y,2) ); 
        let k = d1 - d2;

        if (Math.abs(k) > 1)
          k = 1*Math.sign(k);
        
        if (Math.abs(k) > 0.01) {
          let factor = 0.1;
          sb.dx += (sb.x - sa.x) * k * Math.abs(k) * factor;
          sb.dy += (sb.y - sa.y) * k * Math.abs(k) * factor;
        }
      }    
    }
  }

  let s = sprites[centeredWord];
  s.dx += (0.5 - s.x) * 1.5;
  s.dy += (0.5 - s.y) * 1.5;
  
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
      goalOpacity = Math.pow(similarity(w, overWord),0.6);
    if (isNaN(goalOpacity)) goalOpacity = 0;
    
    s.opacity = (s.opacity + 7*elapsed*goalOpacity)/(1+7*elapsed);
    el.style.opacity = s.opacity;
  }
  
  previousTimeStamp = timestamp
  window.requestAnimationFrame(step);
}

(async function() {
  await loadModel();

  populateWords();
  window.requestAnimationFrame(step);
})();

