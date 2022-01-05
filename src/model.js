import words from '../data/words.json';
import vectorsUrl from '../data/vectors.bin';

export { words };

function dot(a,b) {
  let result = 0;

  for(let i=0; i<a.length; i++) {
    result = result + a[i]*b[i];
  }

  return result;
}

const norm = (a) => Math.sqrt(dot(a,a));

let model = {};

export async function load() {
  let vectorsRaw = await fetch(vectorsUrl);
  let buffer = await vectorsRaw.arrayBuffer();

  let vectors = new Float32Array(buffer);

  let dimension = vectors.length / words.length;
  
  for(let i=0; i < words.length; i++ ) {
    model[words[i]] = vectors.subarray(i*dimension, (i+1)*dimension);
  }
}

let memoized = {};

export function similarity(a,b) {
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
  if (result < -1) result = -1;

  memoized[a][b] = result;

  return result; 
}

