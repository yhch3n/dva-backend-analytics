let colorScale = d3.scaleLinear()
    .domain([-1, 0, 1])
    .range(['#ef8a62', '#deebf7', '#67a9cf']);

function addLegend() {
    let shiftUpHeight = window.innerHeight/6;
    let legendheight = 120, legendwidth = 220; // height & width of legend
    let legendRectangleHeight = 80, legendRectangleWidth = 20,  // height & width of legend rectangle
        margin_legend = { top: 30, right: 60, bottom: 10, left: 2 };

    let legendscale = d3.scaleLinear()
        .range([120 - margin_legend.top - margin_legend.bottom, 1])
        .domain([-1, 1]) // set the min and max of the domain (sentiments here)

    // Define Axis for legend
    let legendaxis = d3.axisRight()
        .scale(legendscale)
        .ticks(2)
        .tickFormat(function (d) {
            if (d === -1)
                return 'Disliked policy changes';
            else if (d === 0)
                return 'Neutral opinion';
            else if (d === 1)
                return 'Liked policy changes';
        });

    /* var svg = d3.select(selector_id) */
    var svg = d3.select('#legend')
        //.append("svg")
        .attr("width", legendwidth)
        .attr("height", legendheight)
        .attr("transform", "translate(" + [0, -shiftUpHeight] + ")"); 
        // position legend wrt page
        /* .attr("transform", "translate(" + [window.innerWidth - 150, window.innerHeight / 2] + ")");  */

    // Linear gradient for legend rectangle
    var legendGradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("gradientTransform", "rotate(90)");

    legendGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale.range()[2]);

    legendGradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", colorScale.range()[1]);

    legendGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale.range()[0]);


    // Append legend rectangle to SVG
    svg.append('rect')
        .attr('x', 30)
        .attr('y', 30)
        .attr('width', legendRectangleWidth)
        .attr('height', legendRectangleHeight)
        .style("fill", "url(#legend-gradient)");

    svg.append("text")
        .text("Average sentiment towards policies")
        .attr('x', '10px')
        .attr('y', '15px')
        .attr("text-anchor", "right")
        .attr("font-size", "12px");

    svg.append("g")
        .attr("class", "legend-axis")
        .attr("transform", "translate(" + (50) + "," + (margin_legend.top) + ")")
        .call(legendaxis);


};