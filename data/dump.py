#! /usr/bin/env nix-shell
#! nix-shell -i python3 -p "python3.withPackages(ps: [ps.numpy])"

import numpy as np
import json

def load_words():
    with open('words_alpha.txt') as word_file:
        valid_words = set(word_file.read().split())

    return valid_words

english_words = load_words()

file=open("glove.6B.300d.txt",'r') 

row = file.readlines()

words = []
vectors = []

for line in row:
    word = line.split()[0]
    if len(word) >= 3 and len(word) <= 6:
        if word in english_words:
            w = word
            v = np.array([float(x) for x in line.split()[1:]])
            words.append(w)
            vectors.append(v)

print(json.dumps(words))

words = np.array(words)
vectors = np.array(vectors)
vectors.astype('float32').tofile('vectors.bin')
