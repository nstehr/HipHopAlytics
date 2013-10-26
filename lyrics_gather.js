var fs = require('fs');
var rapGeniusClient = require("rapgenius-js");
var _ = require("underscore");
var MongoClient = require('mongodb').MongoClient;
var sleep = require('sleep');


var rapperFile = __dirname + '/rappers.json'
var stopWordsFile = __dirname + '/stopwords.txt'

var stopWords = [];
var alreadyProcessed = [];
var alreadyProcessedArtists = [];

var mongoDb;

MongoClient.connect('mongodb://127.0.0.1:27017/lyrics', function(err, db) {
    if(err){
	    return;
    }
    mongoDb = db;
    var collection = db.collection('lyrics');
    collection.find().toArray(function(err,doc){
    alreadyProcessed = _.map(doc,function(lyric) {return lyric['name'];});
    alreadyProcessedArtists = _.map(doc,function(lyric){return lyric['artist']});    
    loadData();
});
    
    
});

function loadData(){
	fs.readFile(rapperFile,'utf8',function(err,data){
		if(err){
			console.log('Error reading file: ' + err);
			return;
		}
		fs.readFile(stopWordsFile,'utf8',function(csvErr,csvData){
			if(csvErr){
				console.log('Error reading file: ' + csvErr);
				return;
			}
			stopWords = csvData.split(',');
			var regionToRappers = JSON.parse(data);
		    _.each(regionToRappers,function(rappers,region){
		        getLyrics(rappers,region);	
		     });
		});

	});
	
}

function getLyrics(rappers,region){
	console.log(rappers.length);
	rappers = _.first(rappers,200);
	
	for(var i=0;i<rappers.length;i++){
		rapper = rappers[i];
		if(!_.contains(alreadyProcessedArtists,rapper))
            getLyricsForRapper(rapper,region);
        else
            console.log('skipping artist');

}
}

function getLyricsForRapper(rapper,region){
			//find the artist on rap genius
		    rapGeniusClient.searchArtist(rapper,function(err,artist){  
			 if(err){
				    console.log(rapper);
				    return;
			    }
			for(var s=0;s<artist.popularSongs.length;s++){
				 var song = artist.popularSongs[s];
				  //for every popular song per artist, get the lyrics
				if(!_.contains(alreadyProcessed,song.name))  
				    setTimeout(getLyricsForSong(artist,song,region),Math.floor(Math.random() * (7 - 3 + 3)) + 3);
				else
				   console.log('skipping song');
				
				
	}
     
	});
	 
	
}

function getLyricsForSong(artist,song,region){
	try{
	rapGeniusClient.searchLyricsAndExplanations(song.link,function(err,lyricsAndExplanations){
	      if(err){
		    console.log('error');
		    return;
	      }
	      var lyrics = lyricsAndExplanations.lyrics;
	      console.log(artist.name + "----" + song.name + "-----" + region);
	      songArr = [];
	      for(var j=0;j<lyrics.sections.length;j++){
		      var section = lyrics.sections[j];
		      
		      for(var k=0;k<section.verses.length;k++){
			     verse = trim(section.verses[k].content);
			     if(verse.length > 0){
			         var wordArray = verse.toLowerCase().split(' ');
			         wordArray = _.map(wordArray,trim);
			         wordArray = removeStopWords(wordArray);
			         
			         songArr.push(wordArray);
			       }
		     }
		    
	      }
  var doc = {'name':song.name,'artist':artist.name,'region':region,'lyrics':songArr};
  mongoDb.collection('lyrics').insert(doc,function(err,records){
    if(err){
       console.log('error writing to db');	
       return;
    }
    console.log("Record added....");
});

});
}catch(ex){
	console.log('exception');
}	
}


function trim(str) {
        return str.replace(/^\s+|\s+$/g,"");
}

function removeStopWords(wordArray){
	return _.difference(wordArray,stopWords);
}
