require(['knockout','jquery','d3','topojson','queue','underscore'],
    function (ko,$,d3,topojson,queue,_)
{
    "use strict";

    $(function ()
    {
	    var regions = ["East Coast","West Coast","Midwest","Southern"];
      	var width = 960,
		    height = 420;
 
		var path = d3.geo.path();
		var statesToRegion = d3.map();

		var svg = d3.select("#map").append("svg")
		    .attr("width", width)
		    .attr("height", height);

        
        	queue()
			    .defer(d3.json, "data/us.json")
			    .defer(d3.json, "data/region_data.json")
			    .defer(d3.json, "data/lyric_data.json")
			    .await(dataLoaded);


        function dataLoaded(error,us,regionData,lyricData){
	         drawMap(us,regionData);
	         buildTopWordLists(lyricData);
	         renderWordBarCharts(lyricData);			
        }

        function renderWordBarCharts(lyricData){

            var words = createWordUnion(lyricData);
            for (var word in words){
            	renderWordBars(word,words[word]);
            }   
        }
        function renderWordBars(word,wordData){
        	
            
        	var barChartWidth = 60;
        	var barChartHeight = 100;
        	var barWidth = barChartWidth/wordData.length;
        	
        	var barGraph = d3.select("#wordBars").append("svg")
        	                .attr("width", barChartWidth)
        	                .attr("height", barChartHeight)
        	                .attr("class", "bars");

           var x = d3.scale.linear().domain([0, wordData.length]).range([0, barChartWidth]);
	       var y = d3.scale.linear().domain([1, d3.min(wordData, function(d) { return d.idf_score; })])
			  .rangeRound([0, barChartHeight]);

		var barGroup = barGraph.select(".bars");
	    if(barGroup.empty()){
		    barGroup = barGraph.append("g");
		    
	    }
	
	  var bars = barGroup.selectAll("rect").data(wordData,function(d){return d.region;});
	
	  bars
	   .enter()
	   .append("rect")
	   .attr("x", function(d, i) { return x(i); })
	   .attr("y",  function(d) { return barChartHeight-y(d.idf_score); })
       .attr("height", function(d) { return y(d.idf_score); })
	   .attr("width", barWidth)
	   .attr("stroke", "black")
	   .attr("class", function(d){
            if(d.region === "Midwest")
            	return "midwest";
            if(d.region === "East Coast")
            	return "east-coast";
            if(d.region === "West Coast")
            	return "west-coast";
            if(d.region === "Southern")
            	return "southern";
	    });

	   barGroup.append("text")
         .attr("x", 0)
         .attr("y", barChartHeight - .5)
         .text(word)
         .style("fill", "black")
         .style("stroke", "black");
        	
        }

 
        

        function createWordUnion(lyricData){
        	var words = {};
        	var midwestCommonWords = lyricData["Midwest"].commonWords;
            var southernCommonWords = lyricData["Southern"].commonWords;
            var eastCoastCommonWords = lyricData["East Coast"].commonWords;
            var westCoastCommonWords = lyricData["West Coast"].commonWords;

            for (var i=0; i<midwestCommonWords.length;i++){
                 var word = midwestCommonWords[i];
                 word.region = "Midwest";
                 words[word.commonWord] = [word];
            }
            
            for (var i=0;i<southernCommonWords.length;i++){
            	var word = southernCommonWords[i];
            	word.region = "Southern";
            	if(words[word.commonWord]){
            		words[word.commonWord].push(word);
            	}
            	else {
            		words[word.commonWord] = [word];
            	}
            }
            for (var i=0;i<eastCoastCommonWords.length;i++){
            	var word = eastCoastCommonWords[i];
            	word.region = "East Coast";
            	if(words[word.commonWord]){
            		words[word.commonWord].push(word);
            	}
            	else {
            		words[word.commonWord] = [word];
            	}
            }
            for (var i=0;i<westCoastCommonWords.length;i++){
            	var word = westCoastCommonWords[i];
            	word.region = "West Coast";
            	if(words[word.commonWord]){
            		words[word.commonWord].push(word);
            	}
            	else {
            		words[word.commonWord] = [word];
            	}
            }

            return words;
        }

        function buildTopWordLists(lyricData){
        	var midwestTopWords = lyricData["Midwest"];
        	var southernTopWords = lyricData["Southern"];
        	var eastCoastTopWords = lyricData["East Coast"];
        	var westCoastTopWords = lyricData["West Coast"];

            buildTopWordList($("#midwestTop20"),midwestTopWords);
            buildTopWordList($("#southernTop20"),southernTopWords);
            buildTopWordList($("#eastCoastTop20"),eastCoastTopWords);
            buildTopWordList($("#westCoastTop20"),westCoastTopWords);

             var wordListItems = $('#top20Lists li');

             function mouseEnter(){

             	var word = $(this).text();
             	var matchingWords =  _.filter(wordListItems, function(item){return $(item).text() === word;});
             	var restOfWords = _.difference(wordListItems,matchingWords);
             	$(matchingWords).addClass("wordHover");
             	$(restOfWords).addClass("wordFade");
             	
             }

             function mouseLeave(){
             	wordListItems.removeClass("wordHover");
             	wordListItems.removeClass("wordFade");
             }

            wordListItems.hover(mouseEnter, mouseLeave);
        	

        }
         
        function buildTopWordList(list,words){
        	for(var i=0;i<words.commonWords.length;i++){
        		list.append('<li>'+words.commonWords[i]['commonWord']+'</li>')
        	}

        }

        function drawMap(us,regionData) {
			        for(var i=0;i<regions.length;i++){
				          var region = regions[i];
				          var states = regionData[region];
				          for(var j=0;j<states.length;j++){
					          statesToRegion.set(states[j],region);
				          }

			          }
		              svg.append("g")
						 .selectAll("path")
						 .data(topojson.feature(us, us.objects.states).features)
						 .enter().append("path")
						 .attr("class", function(d) { 
							var state = d.properties.name;
							var region = statesToRegion.get(state);
							if(region === "East Coast")
							    return "east-coast";
							else if(region === "West Coast")
							    return "west-coast";
							else if(region === "Midwest")
							    return "midwest";
							else if(region === "Southern")
							    return "southern";
							//hack, hide the states that don't belong (Hawaii,Alaska,etc)
							else
							     return "hidden";
						   })
						 .attr("d", path);

					//draws a path for the inner borders states
					//West Coast
					svg.append("path")
					   .datum(topojson.mesh(us,us.objects.states,function(a,b){
						    var aState = a.properties.name;
						    var bState = b.properties.name;
						    var region = statesToRegion.get(aState);
						    if(region !=="West Coast")
						       return false;
						    else{
							    if(a===b)
							     return true;
							else{
								if(aState==="Washington" || 
								(aState==="Nevada" && bState!=="Oregon") || 
								aState==="New Mexico" || 
								(aState==="Arizona" && bState==="Utah")){
								   return true;
								}
								else
								   return false;
							}

						}

						}))
					   .attr("d",path)
					   .attr("class","states");
					   //Midwest
						svg.append("path")
						   .datum(topojson.mesh(us,us.objects.states,function(a,b){
							    var aState = a.properties.name;
								var bState = b.properties.name;
								var region = statesToRegion.get(aState);
								if(region !=="Midwest")
								   return false;
								else{
									if(a===b)
									  return true;
									else{
										if((aState==="Idaho" && (bState!=="Montana" && bState!=="Wyoming" && bState!=="Utah")) ||
										    (aState==="Colorado" && (bState==="New Mexico" || bState==="Oklahoma")) ||
										     (aState==="Kansas" && bState==="Oklahoma") || 
										     aState==="Ohio" || 
										     (aState==="Indiana" && (bState!=="Ohio" && bState!=="Michigan")) || 
										     (aState==="Missouri" && bState !== "Nebraska") || 
										     (aState==="Illinois" && bState==="Kentucky")){
										   return true;
										}
										else
										   return false;
									}

								}

								}))
							   .attr("d",path)
							   .attr("class","states");

					//Southern
					svg.append("path")
					   .datum(topojson.mesh(us,us.objects.states,function(a,b){
						    var aState = a.properties.name;
							var bState = b.properties.name;
							var region = statesToRegion.get(aState);
							if(region !=="Southern")
							   return false;
							else{
								if(a===b)
								  return true;
								else{
									if((aState==="Kentucky" && (bState!=="Tennessee" && bState!=="West Virginia" && bState!=="Virginia")) ||
									   (aState==="Arkansas" && bState==="Missouri")){
									    return true;
									}
									else
									    return false;
								}

							}

							}))
						   .attr("d",path)
						   .attr("class","states");	
						//East Coast
						svg.append("path")
						   .datum(topojson.mesh(us,us.objects.states,function(a,b){
							    var aState = a.properties.name;
								var bState = b.properties.name;
								var region = statesToRegion.get(aState);
								if(region !=="East Coast")
								   return false;
								else{
									if(a===b)
									  return true;
									else{
										if(aState==="Pennsylvania" || 
										  (aState==="Maryland" && bState !== "Pennsylvania"))
										   return true;
										else
		                                   return false;
									}

								}

								}))
							   .attr("d",path)
							   .attr("class","states");

							   svg.selectAll("path").attr("transform", "translate(-80,0) scale(0.85)");
}


    });
});