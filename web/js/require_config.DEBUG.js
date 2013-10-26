var require = {
    baseUrl: "js/",
    paths:
    {
        "knockout": "../lib/knockout-2.2.1",
        "jquery": ((typeof window !== "undefined") && window.legacyIE) ? "../lib/jquery/jquery-1.9.1" : "../lib/jquery/jquery-2.0.0",
        "d3": "../lib/d3.v3.min",
        "topojson":"../lib/topojson.v1.min",
        "queue":"../lib/queue.v1.min"
        
    },
   shim: {
        d3: {
            exports: 'd3'
        },
        topojson: {
	       exports: 'topojson'
        },
        queue:{
	       exports:'queue'
        }
    }
};