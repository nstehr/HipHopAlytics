from pymongo import MongoClient
from itertools import chain
import fpGrowth
import csv
import math
import json


#a little hack, need to do more stop word 
#checking, there were some I wanted,
#but weren't used in the intial data mine
#so have to apply the list again here
stop_words = []

with open('stopwords.txt','rb') as csvfile:
    stop_word_reader = csv.reader(csvfile,delimiter=',')
    for row in stop_word_reader:
        stop_words.extend(row)

stop_words.append(',')
stop_words.append('')

regions = ['West Coast','East Coast','Southern','Midwest']

client = MongoClient()
db = client.lyrics

def main():

    data = {}
    total_songs = db.lyrics.count()
    data['totalSongs'] = total_songs
    print "Total number of songs analyzed: %d" % total_songs
    for region in regions:
        print region
        region_data = {}
        songs = db.lyrics.find({"region":region})
        song_count = songs.count()
        artists = set([song['artist'] for song in songs])
        idf_calc = calcIDF(region,song_count)
        common_words = [word[0] for word in idf_calc]
        
        print "Number of Songs: %d" % song_count
        print "Number of Artists: %d" % len(artists)
        print "Top %d most common words: %s " % (len(common_words),",".join(common_words))
        print "--------"

        region_data['numSongs'] = song_count
        region_data['numArtists'] =  len(artists)
       

        freqSets = calcFrequentSets(region)

        common_word_data = []        

        for idx,common_word in enumerate(common_words):
            common_word_freq_map = {}
            freq_appears = []
            for freqSet in freqSets:
                if common_word in freqSet:
                    freqSet.remove(common_word)
                    freq_appears.extend(list(freqSet))
            print "Words that commonly appear with %s:%s" % (common_word,",".join(set(freq_appears)))
            common_word_freq_map['commonWord'] = common_word
            common_word_freq_map['rank'] = idx
            common_word_freq_map['frequentAppears'] = freq_appears
            common_word_data.append(common_word_freq_map)
        region_data['commonWords'] = common_word_data
        data[region] = region_data

    data_file = open("data.json", "w")
    json_data = json.dumps(data,indent=4, separators=(',', ': '))
    data_file.write(json_data)
    data_file.close()
                      

def calcFrequentSets(region):
    songs = db.lyrics.find({"region":region})
    all_verses = []
    for song in songs:
        verses = song['lyrics']
        for verse in verses:
            verse = [v for v in set(verse) if v not in stop_words]
            all_verses.append(verse)

    minSup = 10
    
    initSet = fpGrowth.createInitSet(all_verses)
    myFPtree, myHeaderTab = fpGrowth.createTree(initSet, minSup)
    myFreqList = []
    fpGrowth.mineTree(myFPtree, myHeaderTab, minSup, set([]), myFreqList)
    return myFreqList
    
    
def calcIDF(region,song_count):
    songs = db.lyrics.find({"region":region})
    word_to_song_count = {}
    for song in songs:
        lyrics = song['lyrics']
        #all the words in a given song, using
        #a set to make it unique
        word_set = set([word for word in chain.from_iterable(lyrics) if word not in stop_words])
        for word in word_set:
            if word in word_to_song_count:
                count = word_to_song_count[word]
                count = count+1
                word_to_song_count[word] =  count
            else:
                word_to_song_count[word] = 1
       
    for word in word_to_song_count.keys():
        quotient = float(song_count)/float(word_to_song_count[word])
        count = math.log10(quotient)
        word_to_song_count[word] = count
    return sorted(word_to_song_count.items(), key=lambda x: x[1])[:20]

if __name__ == '__main__':
    main()

