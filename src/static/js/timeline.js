let width = window.innerWidth, height = window.innerHeight, active = d3.select(null);

var margin = {top:15, right:70, bottom:60, left:50}

let geojson = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';
let usStatesDir = '../static/data/us.json';
let usAbbrevDir = '../static/data/us-state-names.tsv';


// all time twitter sentiments
let twitterSentimentsDir = '../static/data/twitter_sentiments_by_state.csv';

// Store read data
let usAbbreviations;

let usAbbreviationsDict;

let features;

let avgSentimentsByStateYearMonth;


Promise.all([
    d3.json(usStatesDir),
    d3.tsv(usAbbrevDir),
    d3.csv(twitterSentimentsDir)
]).then(data => {
    let us = data[0];
    usAbbreviations = data[1];
    usAbbreviationsDictInit();
    processDataSetsTimeline(data[2]);

    let svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    let state = "UT";
    drawTimeLine(svg, state);




    // features = topojson.feature(us, us.objects.states).features;

    // /* Define new color scale */
    // var colorScale = getColorScale();

    // /* Initialize tooltip */
    // var tip = d3.tip()
    //     .attr("id", "tooltip")
    //     .attr('class', 'd3-tip')
    //     .offset([0, 0])
    //     .html(function (d) {
    //         //return '<span>' + '<b>' + getCountryObject(d.id).name + '</b>' + '</span>';
    //         //return '<span>' + '<b>' + avgSentimentsByState[getCountryObject(d.id).code] + '</b>' + '</span>';
    //     })
    //     .direction('ne');

    // let svg = d3.select("body").append("svg")
    //     .attr("width", width)
    //     .attr("height", height);

    // map_g = svg.append("g")
    //     .style("stroke-width", "1.5px");

    // map_g
    //     .attr("id", "states")
    //     .attr("class", "state")
    //     .selectAll("path")
    //     .data(features)
    //     .enter().append("path")
    //     .attr('d', path)
    //     //.attr('fill', '#ccc')
    //     .attr("fill", function (d) {
    //         // Associated sentiment for this state
    //         let code = getCountryObject(d.id).code;
    //         return colorScale(avgSentimentsByState[code]);
    //     })
    //     /* .on('mouseover', tip.show)
    //     .on('mouseout', tip.hide) */
    //     //.on('mouseover', handleStateMouseOver)

    //     .on('click', handleStateClick);

    // map_g.append("path")
    //     .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
    //     .attr("class", "mesh")
    //     .attr("d", path);

    // map_g.call(tip);

    // Add State labels
    // let stateLebels = svg.append("g")
    //     .selectAll("text")
    //     .data(features)
    //     .enter()
    //     .append("text")
    //     .attr('class', 'state-names')
    //     .attr("text-anchor", "middle")
    //     .text(function (d) {
    //         return getCountryObject(d.id).code;
    //     })
    //     .attr("x", function (d) {
    //         let c = path.centroid(d)
    //         if (c[0])
    //             return c[0];
    //     })
    //     .attr("y", function (d) {
    //         let c = path.centroid(d)
    //         if (c[1])
    //             return c[1];
    //     })
    //     .attr("text-anchor", "middle")
    //     .attr('fill', '#484848')
    //     .attr("font-size", "10px");


    // // LEGEND
    // legend = d3.legendColor()
    //     //.labelFormat(d3.format(".2f"))
    //     .labels(['Negative','Neutral','Positive'])
    //     .title('Average Sentiment')
    //     .scale(colorScale);

    // svg.append("g")
    //     .attr("id", "legend")
    //     .attr("transform", "translate(" + 0.73*(width) + "," + 0.6*(height) + ")")
    //     .call(legend);
});



function getColorScale() {
    return d3.scaleQuantile()
        .domain([-1, 1])
        .range(['#ef8a62', '#deebf7', '#67a9cf']);
}

// function processDataSets(twitterSentiments) {
//     // Compute cumulative sentiments by state
//     let cumulativeSentimentsByState = {};
//     for (let i = 0; i < twitterSentiments.length; i++) {
//         if (!cumulativeSentimentsByState[twitterSentiments[i].state]) {
//             cumulativeSentimentsByState[twitterSentiments[i].state] =
//                 { 'sentiment': [+twitterSentiments[i].sentiment] }
//         } else cumulativeSentimentsByState[twitterSentiments[i].state]['sentiment']
//             .push(+twitterSentiments[i].sentiment)
//     }

//     // Compute average sentiments by state
//     const avg = l => l.reduce((prev, cur) => prev + cur) / l.length;
//     avgSentimentsByState = {}
//     for (let state in cumulativeSentimentsByState) {
//         avgSentimentsByState[state] = avg(cumulativeSentimentsByState[state]['sentiment']);
//     }
// }

function usAbbreviationsDictInit() {
    usAbbreviationsDict = {};
    usAbbreviations.forEach(countryObj => {
        usAbbreviationsDict[countryObj.code] = countryObj.name
    });
}


function processDataSetsTimeline(twitterSentiments) {
    // Compute cumulative sentiments by state and Year, Month
    let cumulativeSentimentsByStateYearMonth = {};
    for (let i = 0; i < twitterSentiments.length; i++) {
    // for (let i = 0; i < 10; i++) {
        let tmpDate = new Date(parseInt(twitterSentiments[i].timestamp+'000'));
        let year = tmpDate.getFullYear();
        let month = tmpDate.getMonth() + 1;
        let yearMonth = year.toString() + "," + month.toString();

        if (!cumulativeSentimentsByStateYearMonth[twitterSentiments[i].state]) {
            cumulativeSentimentsByStateYearMonth[twitterSentiments[i].state] = {};
        }
        if (!cumulativeSentimentsByStateYearMonth[twitterSentiments[i].state][yearMonth]) {
            cumulativeSentimentsByStateYearMonth[twitterSentiments[i].state][yearMonth] = 
                { 'sentiment': [+twitterSentiments[i].sentiment] };
        } else {
            cumulativeSentimentsByStateYearMonth[twitterSentiments[i].state][yearMonth]['sentiment']
            .push(+twitterSentiments[i].sentiment)
        }
    }
    // Compute average sentiments by state and Year, Month
    const avg = l => l.reduce((prev, cur) => prev + cur) / l.length;
    avgSentimentsByStateYearMonth = {};
    for (let state in cumulativeSentimentsByStateYearMonth) {
        avgSentimentsByStateYearMonth[state] = {}
        for (let yearMonth in cumulativeSentimentsByStateYearMonth[state]) {
            avgSentimentsByStateYearMonth[state][yearMonth] = avg(cumulativeSentimentsByStateYearMonth[state][yearMonth]['sentiment']);
        }
    }
}

function drawTimeLine(svg, state) {
    let sentimentsYM = avgSentimentsByStateYearMonth[state];

    const monthParser = d3.timeParse("%Y,%m");
    let lineData = [];

    for (let yearMonth in sentimentsYM) {
        let dt = monthParser(yearMonth);
        lineData.push({date:dt, sentiment:sentimentsYM[yearMonth]});
    }

    let timeline_g = svg.append("g")
        .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

    let xScale = d3.scaleTime()
        .range([margin.left, width-margin.right])
        .domain(d3.extent(lineData, function(d){return d.date}));

    let yScale = d3.scaleLinear()
        .range([height-margin.bottom, margin.top])
        .domain(d3.extent(lineData, function(d){return d.sentiment}));

    let xaxis = d3.axisBottom()
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat('%b %y'))
        .scale(xScale);

    let yaxis = d3.axisLeft()
        .ticks(10)
        .scale(yScale);

    // x axis
    let x_axis_obj = timeline_g.append("g")
        .attr("transform", "translate(" + 0 + "," + (height-margin.bottom) + ")")
        .call(xaxis);
    timeline_g.append("text")
        .text("Month")
        .style("font-size", "22px") 
        .attr("text-anchor", "middle")
        .attr("class","x label")
        .attr("x", width*0.5)
        .attr("y", height-24);

    // y axis
    let y_axis_obj = timeline_g.append("g")
        .attr("transform", "translate(" + margin.left + "," + 0 + ")")
        .call(yaxis);
    timeline_g.append("text")
        .text("sentiment")
        .style("font-size", "22px") 
        .attr("text-anchor", "middle")
        .attr("class","y label")
        .attr("x", -height*0.5)
        .attr("y", 15)
        .attr("transform", "rotate(-90)")

    // draw lines
    let lines_a = timeline_g.append("g")
    lines_a
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function(d) { return xScale(d.date) })
            .y(function(d) { return yScale(d.sentiment) })
        );

    // draw circles for data points
    var colorScale = getColorScale();

    timeline_g.selectAll(".dot")
        .data(lineData)
      .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", function(d, i) { return xScale(d.date) })
        .attr("cy", function(d) { return yScale(d.sentiment) })
        .attr("r", 12)
        .attr("fill",function(d) { return colorScale(d.sentiment) }  );

    // add title

    timeline_g.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "28px") 
        .attr("x", width*0.5)
        .attr("y", 32)
        .text("average sentiments by month: " + usAbbreviationsDict[state]);

    // LEGEND
    legend = d3.legendColor()
        //.labelFormat(d3.format(".2f"))
        .labels(['Negative','Neutral','Positive'])
        .title('Average Sentiment')
        .scale(colorScale);

    svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate(" + 0.85*(width) + "," + 0.77*(height) + ")")
        .call(legend);

}