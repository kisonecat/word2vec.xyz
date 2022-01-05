To produce the data, I did the following.

```
wget https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt
wget https://nlp.stanford.edu/data/glove.6B.zip
unzip glove.6B.zip glove.6B.300d.txt
python dump.py > words.json
```

The `dump.py` script also produces `vectors.bin`.
