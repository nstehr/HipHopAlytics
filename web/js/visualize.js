require(['knockout','jquery','d3','topojson','queue'],
    function (ko,$,d3,topojson,queue)
{
    "use strict";

    $(function ()
    {
	    var regions = ["East Coast","West Coast","Midwest","Southern"];
	    console.log("regions");
      	var width = 960,
		    height = 500;
 
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
		
				
        }

    });
});