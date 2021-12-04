// let width = window.innerWidth - 150, height = window.innerHeight, active = d3.select(null);

// // Timeline // for both map and line - 50% height each
// let timeline_width = window.innerWidth, timeline_height = window.innerHeight / 2;

// var margin = { top: 15, right: 70, bottom: 60, left: 50 }

// let geojson = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';

// let usStatesDir = '../static/data/us.json';
// let usAbbrevDir = '../static/data/us-state-names.tsv';
// let usPolicyDir = '../static/data/states_policies_clean.tsv';
// let sentimentsDir = '../static/data/all_twitter_data.tsv';

// // map data 
// // all time twitter sentiments
// let twitterSentimentsDir = '../static/data/twitter_sentiments_by_state.csv';
// let covidCasesDir = '../static/data/United_States_COVID-19_Cases_and_Deaths_all_States_over_Time.csv'
// ---------------


let width = window.innerWidth - 225; //map width
let height = window.innerHeight -30 -150; // map height, subtract title and slider heights
let active = d3.select(null); 


var margin = { top: 40, right: 70, bottom: 100, left: 50 }

// Timeline // for both map and line - 50% height each
let timeline_width = window.innerWidth - margin.right, timeline_height = window.innerHeight / 2;


let geojson = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';
let usStatesDir = '../static/data/us.json';
let usAbbrevDir = '../static/data/us-state-names.tsv';
let usPolicyDir = '../static/data/states_policies_clean.tsv';

// map data 
// all time twitter sentiments
let sentimentsDir = '../static/data/sentiments.tsv';
let covidCasesDir = '../static/data/United_States_COVID-19_Cases_and_Deaths_all_States_over_Time.csv'

// Store read data
let usAbbreviations;
let usAbbreviationsDict;
let map_g;
let features;
let usPoliciesByState;
// Datasets
let twitterSentiments; // data[2]

// Color when no sentiments available
let defaultStateGrey = '#bdbdbd'

// First and Last Date of map
let firstDay = new Date(2020, 0, 1);
let lastDay = new Date(2021, 10, 1);



let avgSentimentsByState;
let avgSentimentsByStateYearMonth;
let covidCasesByState;
let covidDeathsByState;

// let colorScale;
let legend;

let currentState;

// color
let purple = '#af8dc3', green = '#5ab4ac', golden = '#d8b365';



// SVGs
let svg_map, svg_timeline, svg_covid_cases_timeline, svg_covid_deaths_timeline;

// Transition
let zoomStateTime = 750;

// A projection tells D3 how to orient the GeoJSON features
let projection = d3.geoAlbersUsa()
    .scale(900)
    .translate([width / 2, height / 2]);

let path = d3.geoPath().projection(projection);

Promise.all([
    d3.json(usStatesDir),
    d3.tsv(usAbbrevDir),
    d3.tsv(sentimentsDir),
    d3.csv(covidCasesDir),
    d3.tsv(usPolicyDir)
]).then(data => {
    let us = data[0];
    usAbbreviations = data[1];
    twitterSentiments = data[2];
    usAbbreviationsDictInit();
    processDataSets(firstDay, lastDay); // replace start and end with true start and end timestamps originally
    processDataSetsTimeline(data[2]);

    processDataSetsCovid(data[3]);
    console.log("covid by state processed");
    processPolicies(data[4]);

    //console.log(data[5][1]);

    // Map
    svg_map = d3.select("#map")
        .attr("width", width)
        .attr("height", height);
    drawMap(svg_map, us);

    // Add legend
    addLegend();

    // Timelines
    svg_timeline = d3.select("body").append("svg")
        .attr('id', 'timeline')
        .attr("width", timeline_width)
        .attr("height", timeline_height);
    svg_covid_cases_timeline = d3.select("body").append("svg")
        .attr('id', 'timeline_covid')
        .attr("width", timeline_width)
        .attr("height", timeline_height);
    svg_covid_deaths_timeline = d3.select("body").append("svg")
        .attr('id', 'timeline_covid_deaths')
        .attr("width", timeline_width)
        .attr("height", timeline_height);

    d3.select('#timeline').style("opacity", 0).style("display", "none");
    d3.select('#timeline_covid').style("opacity", 0).style("display", "none");
    d3.select('#timeline_covid_deaths').style("opacity", 0).style("display", "none");
    // d3.select('#covid_timeline').style("opacity", 0).style("display", "none");

});


function drawMap(svg, us) {
    features = topojson.feature(us, us.objects.states).features;



    /* Initialize tooltip */
    /* var tip = d3.tip()
        .attr("id", "tooltip")
        .attr('class', 'd3-tip')
        .offset([0, 0])
        .html(function (d) {
            //return '<span>' + '<b>' + getCountryObject(d.id).name + '</b>' + '</span>';
            return '<span>' + '<b>' + avgSentimentsByState[getCountryObj(d.id).code] + '</b>' + '</span>';
        })
        .direction('ne'); */



    map_g = svg.append("g")
        .style("stroke-width", "1.5px");

    map_g
        .attr("class", "state")
        .selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr('d', path)
        .attr('id', function (d) {
            // Associated sentiment for this state
            let code = getStateObj(d.id).code;
            // Remove DC - District of Columbia is not a state
            if (code != 'DC')
                return 'path_' + d.id;
        })
        //.attr('fill', '#ccc')
        .attr("fill", function (d) {
            // Associated sentiment for this state
            let code = getStateObj(d.id).code;
            // Remove DC - District of Columbia is not a state
            if (code != 'DC')
                return colorScale(avgSentimentsByState[code]);
        })
        /* .on('mouseover', tip.show)
        .on('mouseout', tip.hide) */
        //.on('mouseover', handleStateMouseOver)

        .on('click', handleStateClick);

    map_g.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("class", "mesh")
        .attr("d", path);

    //map_g.call(tip);


    // Add State labels

    //addStateLabels(map_g, features);
    svg.append("g")
        .selectAll("state-names")
        .data(features)
        .enter()
        .append("text")
        .attr('class', 'state-names')
        .text(function (d) {
            let code = getStateObj(d.id).code;
            // Remove DC - District of Columbia is not a state
            if (code != 'DC')
                return code;
        })
        .attr("x", function (d) {
            let c = path.centroid(d)
            if (c[0])
                return c[0];
        })
        .attr("y", function (d) {
            let c = path.centroid(d)
            if (c[1])
                return c[1];
        })
        .attr("text-anchor", "middle")
        .attr('fill', '#484848')
        .attr("font-size", "10px");

    // Add state text
    svg_map.append("text")
        .attr('id', 'selected-state')
        .text('')
        .attr("text-anchor", "middle")
        .attr("x", width * 0.5)
        .attr("y", height / 2)
        .attr("dy", "-10");
}


function addStateLabels(svg, features) {
    svg.append("g")
        .selectAll("stateText")
        .data(features)
        .enter()
        .append("text")
        .attr('class', 'stateText')
        .text(function (d) {
            let code = getStateObj(d.id).code;
            // Remove DC - District of Columbia is not a state
            if (code != 'DC')
                return code;
        })
        .attr("x", function (d) {
            let c = path.centroid(d)
            if (c[0])
                return c[0];
        })
        .attr("y", function (d) {
            let c = path.centroid(d)
            if (c[1])
                return c[1];
        })
        .attr("text-anchor", "middle")
        .attr('fill', '#484848')
        .attr("font-size", "10px");
}


function getStateObj(id) {
    let state = null;
    usAbbreviations.forEach(stateObj => {
        if (+stateObj.id === +id)
            state = stateObj;
    });
    return state;
}


// Zoom to state
function handleStateClick(d, i) {


    // If clicked on an active state, reset it
    if (active.node() === this) return reset();

    // Find bounds of selected state
    let bounds = path.bounds(d);
    dx = bounds[1][0] - bounds[0][0];
    dy = bounds[1][1] - bounds[0][1];
    x = (bounds[0][0] + bounds[1][0]) / 2;
    y = (bounds[0][1] + bounds[1][1]) / 2;

    // Adjust scale of zoom
    let zoomScale = 0.3;
    scale = zoomScale / Math.max(dx / width, dy / height);

    // Adjust vertical position on page
    let y_state = height / 4;
    translate = [width / 2 - scale * x, y_state - scale * y];

    d3.selectAll('.state-names').style("display", "none");

    // Fade all states
    d3.selectAll(".state > path")
        .transition()
        .duration(zoomStateTime)
        .style("opacity", 0);

    // Keep selected state as opaque all states to white
    let activeState = d3.select(this);
    activeState.transition()
        .duration(zoomStateTime).style("opacity", 1);


    // Transition to make the border lines thinner on zoom
    // Transition to zoom into state
    map_g.transition()
        .duration(zoomStateTime)
        .style("stroke-width", 1.5 / scale + "px")
        .attr("transform", "translate(" + translate + ") scale(" + scale + ")")
        .on('end', function () {
            // Hide other states after transition completes
            d3.selectAll(".state > path").style("display", "none");
            activeState.style("display", "inline");

            // Show selected state title
            d3.select('#selected-state').text(getStateObj(d.id).name);
            d3.select('#selected-state').style("display", "inline");

            // Show Back button
            d3.select('#back').style("display", "inline");
        });

    // Reduce height to make space for timeline chart
    svg_map.transition()
        .duration(zoomStateTime)
        .attr('height', timeline_height);

    //Remove timeline children. 
    const myNode = document.getElementById("timeline");
    while (myNode.firstChild) {
        myNode.removeChild(myNode.lastChild);
    }
    //Remove timeline children. 
    const myNode2 = document.getElementById("timeline_covid");
    while (myNode2.firstChild) {
        myNode2.removeChild(myNode2.lastChild);
      }
    const myNode3 = document.getElementById("timeline_covid_deaths");
      while (myNode3.firstChild) {
        myNode3.removeChild(myNode3.lastChild);
      }

    /* SHOW TIMELINE */
    drawTimeLine(svg_timeline, getStateObj(features[i].id).code);
    drawTimeLineCovid(svg_covid_cases_timeline, getStateObj(features[i].id).code);
    drawTimeLineCovidDeaths(svg_covid_deaths_timeline, getStateObj(features[i].id).code);


    // Make timeline opaque
    d3.select('#timeline')
        .style("display", "inline")
        .transition()
        .duration(zoomStateTime).style("opacity", 1);
    d3.select('#timeline_covid')
        .style("display", "inline")
        .transition()
        .duration(zoomStateTime).style("opacity", 1);
    d3.select('#timeline_covid_deaths')
        .style("display", "inline")
        .transition()
        .duration(zoomStateTime).style("opacity", 1);

    // Activate class
    active.classed("active", false);
    active = d3.select(this).classed("active", true);

}


// Zoome out of selected state
function reset() {

    // Hide selected state title
    d3.select('#selected-state').text('');
    d3.select('#selected-state').style("display", "none");

    // Hide Back button
    d3.select('#back').style("display", "none");

    // Show other states
    // Transition to make other states opaque
    d3.selectAll(".state > path")
        .style("display", "inline")
        .transition()
        .duration(zoomStateTime)
        .style("opacity", 1)

    // Transition to make the border lines thicker (or, back to normal)
    // and remove transformations
    map_g.transition()
        .duration(zoomStateTime)
        .style("stroke-width", "1.5px")
        .attr("transform", "")
        .on('end', function () {
            // Show state abbreviations
            d3.selectAll('.state-names').style("display", "inline");
        });

    // Increase height of map to show the US map
    svg_map.transition()
        .duration(zoomStateTime)
        .attr('height', height);

    // Fade timeline
    d3.select('#timeline')
        .transition()
        .duration(zoomStateTime).style("opacity", 0)
        .on('end', function () {
            d3.select('#timeline').style("display", "none");
        })
    d3.select('#timeline_covid_deaths')
        .transition()
        .duration(zoomStateTime).style("opacity", 0)
        .on('end', function () {
            d3.select('#timeline_covid_deaths').style("display", "none");
        })
    d3.select('#timeline_covid')
        .transition()
        .duration(zoomStateTime).style("opacity", 0)
        .on('end', function () {
            d3.select('#timeline_covid').style("display", "none");
        })


    // Mark the state as not active anymore
    active.classed("active", false);
    active = d3.select(null);
}

// Update cholorpleth map with new start and end timestamps
function updateCholorplethMap(startDateTime, endDateTime) {
    // Update dataset - avgSentimentsByState
    processDataSets(startDateTime, endDateTime);

    /* update color for each state:
    Go over each state text to get state names (this is one approach)
    Retrieve state path by ID --> d3.select('#path_'+state_id)
    Update color for state path
    */
    d3.selectAll('.state-names').nodes().forEach((d) => { // d --> state text
        let state_id = d3.select(d).data()[0].id;
        let state = getStateObj(d3.select(d).data()[0].id).code;
        let color = colorScale(avgSentimentsByState[state]);
        // update color for state
        if (state != 'DC' && color) {
            d3.select('#path_' + state_id).style('fill', color);
        } else if (!color) {
            d3.select('#path_' + state_id).style('fill', defaultStateGrey);
        }
    });
}


function processDataSetsCovid(covidData) {
    // Compute cumulative sentiments by state
    console.log('printing covid data')
    console.log(covidData)
    const parseTime = d3.timeParse("%Y/%m/%d");
    const formatTime = d3.timeFormat("%Y/%m/%d");
    covidDeathsByState = {};
    covidCasesByState = {};

    for (let i = 0; i < covidData.length; i++) {
        // console.log("iteration:", i)
        if (!covidCasesByState[covidData[i].state_abbr]) {
            // console.log("date", covidData[i].submission_date_format, covidData[i].state_abbr);
            // console.log(parseTime(covidData[i].submission_date_format));
            // console.log(formatTime(parseTime(covidData[i].submission_date_format)))
            covidCasesByState[covidData[i].state_abbr] = [];
            new_case = covidData[i].new_case;
            new_death = covidData[i].new_death;
            if (new_case < 0) {
                new_case = 0
            }
            if (new_death < 0) {
                new_death = 0
            }
            covidCasesByState[covidData[i].state_abbr].push({'date': parseTime(covidData[i].submission_date_format), 'new_cases': new_case})
            covidDeathsByState[covidData[i].state_abbr] = []
            covidDeathsByState[covidData[i].state_abbr].push({'date': parseTime(covidData[i].submission_date_format), 'new_deaths': new_death})
                // { 'dates': [+parseTime(covidData[i].submission_date_format)], 'new_cases': [+covidData[i].new_case]}

        } else {
            new_case = covidData[i].new_case;
            new_death = covidData[i].new_death;
            if (new_case < 0) {
                new_case = 0
            }
            if (new_death < 0) {
                new_death = 0
            }
            covidCasesByState[covidData[i].state_abbr].push({'date': parseTime(covidData[i].submission_date_format), 'new_cases': new_case})
            covidDeathsByState[covidData[i].state_abbr].push({'date': parseTime(covidData[i].submission_date_format), 'new_deaths': new_death})

            // covidCasesByState[covidData[i].state_abbr]['dates'].push(+parseTime(covidData[i].submission_date_format))
            // covidCasesByState[covidData[i].state_abbr]['new_cases'].push(+covidData[i].new_case)
            // console.log(parseTime(covidData[i].submission_date_format));
        }
    }
    console.log(covidCasesByState)
    console.log(covidDeathsByState)

}

// filter dataset by time
function processDataSets(start, end) {
    // Compute cumulative sentiments by state
    let cumulativeSentimentsByState = {};
    for (let i = 0; i < twitterSentiments.length; i++) {
        // Get timestamps in miliseconds - (13 digits in timestamp)
        if (new Date(twitterSentiments[i].timestamp * 1000) >= start
            && new Date(twitterSentiments[i].timestamp * 1000) <= end) {
            if (!cumulativeSentimentsByState[twitterSentiments[i].state]) {
                cumulativeSentimentsByState[twitterSentiments[i].state] =
                    { 'sentiment': [+twitterSentiments[i].sentiment] }
            } else cumulativeSentimentsByState[twitterSentiments[i].state]['sentiment']
                .push(+twitterSentiments[i].sentiment)
        }
    }

    // Compute average sentiments by state
    const avg = l => l.reduce((prev, cur) => prev + cur) / l.length;
    avgSentimentsByState = {}
    for (let state in cumulativeSentimentsByState) {
        avgSentimentsByState[state] = avg(cumulativeSentimentsByState[state]['sentiment']);
    }
}


function usAbbreviationsDictInit() {
    usAbbreviationsDict = {};
    usAbbreviations.forEach(countryObj => {
        usAbbreviationsDict[countryObj.code] = countryObj.name
    });
}


function processDataSetsTimeline(twitterSentiments) {
    // Compute cumulative sentiments by state and Year, Month
    let cumulativeSentimentsByStateYearMonth = {};
    let cumulativeSentimentsByStateYearMonthDay = {};
    for (let i = 0; i < twitterSentiments.length; i++) {
        // for (let i = 0; i < 10; i++) {
        let tmpDate = new Date(parseInt(twitterSentiments[i].timestamp + '000'));
        let year = tmpDate.getFullYear();
        let month = tmpDate.getMonth() + 1;
        let day = tmpDate.getDay();
        let yearMonth = year.toString() + "," + month.toString();
        let yearMonthDay = yearMonth + "," + day.toString();


        //---------- MONTH
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


        //----------DAY
        if (!cumulativeSentimentsByStateYearMonthDay[twitterSentiments[i].state]) {
            cumulativeSentimentsByStateYearMonthDay[twitterSentiments[i].state] = {};
        }
        if (!cumulativeSentimentsByStateYearMonthDay[twitterSentiments[i].state][yearMonthDay]) {
            cumulativeSentimentsByStateYearMonthDay[twitterSentiments[i].state][yearMonthDay] =
                { 'sentiment': [+twitterSentiments[i].sentiment] };
        } else {
            cumulativeSentimentsByStateYearMonthDay[twitterSentiments[i].state][yearMonthDay]['sentiment']
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
    // Compute average sentiments by state and Year, Month, Day
    avgSentimentsByStateYearMonthDay = {};
    for (let state in cumulativeSentimentsByStateYearMonthDay) {
        avgSentimentsByStateYearMonthDay[state] = {}
        for (let yearMonthDay in cumulativeSentimentsByStateYearMonthDay[state]) {
            avgSentimentsByStateYearMonthDay[state][yearMonthDay] = avg(cumulativeSentimentsByStateYearMonthDay[state][yearMonthDay]['sentiment']);
        }
    }


}

function updateTimeLine(startDateTime, endDateTime) {
    drawTimeLine(svg_timeline, currentState, startDateTime, endDateTime);
}

function drawTimeLine(svg, state, startDateTime, endDateTime) {

    if (startDateTime) {
        // is update
        var elementExists = document.getElementById("timeline_g");
        if (elementExists) {
            elementExists.remove();
        }    
    }


    currentState = state;

    let sentimentsYM = avgSentimentsByStateYearMonth[state];
    let sentimentsYMD = avgSentimentsByStateYearMonthDay[state];

    // console.log(svg, state, startDateTime, endDateTime);
    // console.log(sentimentsYM);

    let inrangeYM = [];
    let inrangeYMD = [];

    if (startDateTime) {
        let startYM = new Date(startDateTime.getFullYear(), startDateTime.getMonth()).getTime();
        let endYM = new Date(endDateTime.getFullYear(), endDateTime.getMonth()).getTime();
        for (let ty = 2020; ty <= 2021; ty++) {
            for (let tm = 1; tm <= 12; tm++) {
                let ym_obj = new Date(ty, tm-1).getTime();
                // console.log(ym_obj, startYM, endYM);

                if (ym_obj >= startYM && ym_obj <= endYM) {
                    let tym = ty + "," + tm;
                    inrangeYM.push(tym);
                }
            }
        }
        let tmp = startDateTime;
        let endYMD = endDateTime.getTime();
        while (tmp.getTime() <= endYMD) {
            let tymd = tmp.getFullYear() + ',' + (tmp.getMonth()+1) +  ',' + tmp.getDate();
            // console.log(tymd);
            inrangeYMD.push(tymd);
            let nextDay = new Date(tmp);
            nextDay.setDate(tmp.getDate() + 1);
            tmp = nextDay;
        }

    } else {
        for (let ty = 2020; ty <= 2021; ty++) {
            for (let tm = 1; tm <= 12; tm++) {
                let tym = ty + "," + tm;
                inrangeYM.push(tym);
            }
        }

        let tmp = new Date(2020,0,1);
        let endYMD = new Date(2021,11,31).getTime();
        while (tmp.getTime() <= endYMD) {
            let tymd = tmp.getFullYear() + ',' + (tmp.getMonth()+1) +  ',' + tmp.getDate();
            // console.log(tymd);
            inrangeYMD.push(tymd);
            let nextDay = new Date(tmp);
            nextDay.setDate(tmp.getDate() + 1);
            tmp = nextDay;
        }


    }


    const monthParser = d3.timeParse("%Y,%m");
    const dayParser = d3.timeParse("%Y,%m,%d");
    let lineDataDay = [];
    let lineData = [];

    for (let yearMonth in sentimentsYM) {
        if (!inrangeYM.includes(yearMonth)) {
            continue;
        }
        let dt = monthParser(yearMonth);

        lineData.push({ date: dt, sentiment: sentimentsYM[yearMonth], ts: dt.getTime() });
    }



    for (let yearMonthDay in sentimentsYMD) {
        if (!inrangeYMD.includes(yearMonthDay)) {
            continue;
        }
        let dt = dayParser(yearMonthDay);
        lineDataDay.push({ date: dt, sentiment: sentimentsYMD[yearMonthDay] });
    }

    function sortByDateAscending(a, b) {
        return a.date - b.date;
    }

    lineDataDay = lineDataDay.sort(sortByDateAscending);

    let timeline_g = svg.append("g")
        .attr("id", "timeline_g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    let xScale = d3.scaleTime()
        .range([margin.left, timeline_width - margin.right])
        .domain(d3.extent(lineData, function (d) { return d.date }));

    let yScale = d3.scaleLinear()
        .range([timeline_height - margin.bottom, margin.top])
        .domain(d3.extent(lineData, function (d) { return d.sentiment }));

    let xScale2 = d3.scaleTime()
        .range([margin.left, width - margin.right])
        .domain(d3.extent(lineDataDay, function (d) { return d.date }));

    let yScale2 = d3.scaleLinear()
        .range([timeline_height - margin.bottom, margin.top])
        .domain(d3.extent(lineDataDay, function (d) { return d.sentiment }));


    let xaxis = d3.axisBottom()
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat('%b %y'))
        .scale(xScale);
    let xaxis2 = d3.axisBottom()
        .ticks(d3.timeDay.every(1))
        .tickFormat(d3.timeFormat('%b %y'))
        .scale(xScale2);

    let yaxis = d3.axisLeft()
        .ticks(10)
        .scale(yScale);
    let yaxis2 = d3.axisLeft()
        .ticks(10)
        .scale(yScale2);

    // x axis
    let x_axis_obj = timeline_g.append("g")
        .attr("transform", "translate(" + 0 + "," + (timeline_height - margin.bottom) + ")")
        .call(xaxis);
    // timeline_g.append("text")
    //     .text("Month")
    //     .style("font-size", "22px")
    //     .attr("text-anchor", "middle")
    //     .attr("class", "x label")
    //     .attr("x", timeline_width * 0.5)
    //     .attr("y", timeline_height - 24);

    // y axis
    let y_axis_obj = timeline_g.append("g")
        .attr("transform", "translate(" + margin.left + "," + 0 + ")")
        .call(yaxis);
    timeline_g.append("text")
        .text("Sentiment")
        .style("font-size", "22px")
        .style("font-weight", "400")
        .attr("text-anchor", "middle")
        .attr("class", "y label")
        .attr("x", -timeline_height * 0.5)
        .attr("y", 0)
        .attr("transform", "rotate(-90)")

    // draw lines
    let lines_a = timeline_g.append("g")
    lines_a
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", purple)
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return xScale(d.date) })
            .y(function (d) { return yScale(d.sentiment) })
        );

    // draw circles for data points

    // timeline_g.selectAll(".dot")
    //     .data(lineData)
    //     .enter().append("circle") // Uses the enter().append() method
    //     .attr("class", "dot") // Assign a class for styling
    //     .attr("cx", function (d, i) { return xScale(d.date) })
    //     .attr("cy", function (d) { return yScale(d.sentiment) })
    //     .attr("r", 12)
    //     .attr("fill", function (d) { return colorScale(d.sentiment) });

    // draw circles for policies
    // create a tooltip
    let tool_tip = d3.tip()
        .attr("class", "d3-tip")
        .attr("id", "tooltip")
        .offset([-8, 0])
        .html("(tool_tip)")
        //.style("width", "200px")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("font-size", "17px")
    svg.call(tool_tip);

    let policyData = usPoliciesByState[state];

    let smallCircleSize = 8, largeCircleSize = 10;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    timeline_g.selectAll(".dot")
        .data(policyData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", function (d, i) {
            if (xScale(d["Date"]) < -0.01) {
                return -1000.0; // move out of screen
            } else {
                return xScale(d["Date"]);
            } })
        .attr("cy", function (d) {
            let ts = d["Date"].getTime();
            if (ts <= lineData[0].ts) {
                return yScale(lineData[0].sentiment);
            } else if (ts >= lineData[lineData.length - 1].ts) {
                return yScale(lineData[lineData.length - 1].sentiment);
            }
            for (let i = 1; i < lineData.length; i++) {
                let lts = lineData[i - 1].ts;
                let rts = lineData[i].ts;
                if (ts >= lts && ts <= rts) {
                    // interpolate
                    let delta = (ts - lts) / (rts - lts);
                    let left = lineData[i - 1].sentiment;
                    let right = lineData[i].sentiment;
                    return yScale(left + delta * (right - left));
                }
            }
            return 100;
        })
        .attr("r", smallCircleSize)
        .attr("fill", "#ffffff")
        .attr("stroke", purple)
        .attr("stroke-width", 2.5)
        .on("mouseover", function (d, i) {
            d3.select(this).attr("stroke", purple);
            let cont = "<b>" + d.mmddyyyy + "</b><br>";
            // make it multiple lines
            let lineMaxLen = 40; // maximum 40 chars per line
            cont += getMultipleLinesHTML(d["Action Taken"], lineMaxLen);
            tool_tip.html(cont);
            tool_tip.show();
            d3.select(this)
            .attr("fill", purple)
            .attr("r", largeCircleSize);
        })
        .on("mouseout", function (d, i) {
            d3.select(this).attr("stroke", purple);
            tool_tip.hide();
            d3.select(this)
            .attr("fill", '#ffffff')
            .attr("r", smallCircleSize);
        })
    // "#32a883" "#24541a"

    // add title

    timeline_g.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "28px")
        .attr("x", timeline_width * 0.5)
        .attr("y", 5)
        .text("Average Sentiments by Month");
}





function drawTimeLineCovid(svg, state) {
    console.log("Drawing timeline", state)
    let sentimentsYMD = covidCasesByState[state];
    let lineDataDay = [];
    console.log("drawCovidTimeline: sentimentsYMD", sentimentsYMD);
    lineDataDay = sentimentsYMD;

    function sortByDateAscending(a, b) {
        return a.date - b.date;
    }
    lineDataDay = lineDataDay.sort(sortByDateAscending);
    dates = []
    cases = []
    for (i=0; i < lineDataDay.length; i++) {
        dates.push(lineDataDay[i].date);
        cases.push(lineDataDay[i].new_cases);
        // console.log(lineDataDay[i].new_cases);
    }
    console.log("max cases", Math.max(...cases));



    let timeline_g = svg.append("g")
        .attr("id","timeline_g1")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    let xScale = d3.scaleTime()
        .range([margin.left, timeline_width - margin.right])
        .domain(d3.extent(dates, function (d) { return d }));

    console.log("extent", d3.extent(cases, function (d) { return d }));
    let yScale = d3.scaleLinear()
        // .range([timeline_height - margin.bottom, margin.top])
        .range([timeline_height - margin.bottom, margin.top])
        // .domain(d3.extent(lineDataDay, function (d) { return d.new_cases }));
        .domain([0,Math.max(...cases)]);


    let xaxis = d3.axisBottom()
        .ticks(d3.timeDay.every(100))
        .tickFormat(d3.timeFormat('%b %y'))
        .scale(xScale);

    let yaxis = d3.axisLeft()
        .ticks(10)
        .scale(yScale);
    // x axis
    let x_axis_obj = timeline_g.append("g")
        .attr("transform", "translate(" + 0 + "," + (timeline_height - margin.bottom) + ")")
        .call(xaxis);
    // timeline_g.append("text")
    //     .text("Day")
    //     .style("font-size", "22px")
    //     .attr("text-anchor", "middle")
    //     .attr("class", "x label")
    //     .attr("x", timeline_width * 0.5)
    //     .attr("y", timeline_height - 24);
    // y axis
    let y_axis_obj = timeline_g.append("g")
        .attr("transform", "translate(" + margin.left + "," + 0 + ")")
        .call(yaxis);
    timeline_g.append("text")
        .text("New Cases")
        .style("font-size", "22px")
        .style("font-weight", "400")
        .attr("text-anchor", "middle")
        .attr("class", "y label")
        .attr("x", -timeline_height * 0.5)
        .attr("y", 0)
        .attr("transform", "rotate(-90)")

    // draw lines
    let lines_a = timeline_g.append("g");
    lines_a
        .append("path")
        .datum(lineDataDay)
        .attr("fill", "none")
        .attr("stroke", green)
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return xScale(d.date) })
            .y(function (d) { return yScale(d.new_cases) })
        );

    timeline_g.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "28px")
        .attr("x", timeline_width * 0.5)
        .attr("y", 5)
        .text("Daily New Cases");

}




function drawTimeLineCovidDeaths(svg, state) {
    console.log("Drawing Deaths timeline", state)
    let sentimentsYMD = covidDeathsByState[state];
    let lineDataDay = [];
    console.log("drawCovidDeathsTimeline: sentimentsYMD", sentimentsYMD);
    lineDataDay = sentimentsYMD;
    function sortByDateAscending(a, b) {
        return a.date - b.date;
    }
    lineDataDay = lineDataDay.sort(sortByDateAscending);
    dates = []
    deaths = []
    for (i=0; i < lineDataDay.length; i++) {
        dates.push(lineDataDay[i].date);
        deaths.push(lineDataDay[i].new_deaths);
        // console.log(lineDataDay[i].new_cases);
    }
    console.log("max cases", Math.max(...deaths));



    let timeline_g = svg.append("g")
        .attr("id","timeline_g2")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    let xScale = d3.scaleTime()
        .range([margin.left, timeline_width - margin.right])
        .domain(d3.extent(dates, function (d) { return d }));

    console.log("extent", d3.extent(cases, function (d) { return d }));
    let yScale = d3.scaleLinear()
        .range([timeline_height - margin.bottom, margin.top])
        // .domain(d3.extent(lineDataDay, function (d) { return d.new_cases }));
        .domain([0,Math.max(...deaths)]);


    let xaxis = d3.axisBottom()
        .ticks(d3.timeDay.every(100))
        .tickFormat(d3.timeFormat('%b %y'))
        .scale(xScale);

    let yaxis = d3.axisLeft()
        .ticks(10)
        .scale(yScale);
    // x axis
    let x_axis_obj = timeline_g.append("g")
        .attr("transform", "translate(" + 0 + "," + (timeline_height - margin.bottom) + ")")
        .call(xaxis);
    timeline_g.append("text")
        .text("Date")
        .style("font-size", "22px")
        .style("font-weight", "400")
        .attr("text-anchor", "middle")
        .attr("class", "x label")
        .attr("x", timeline_width * 0.5)
        .attr("y", timeline_height - 24);
    // y axis
    let y_axis_obj = timeline_g.append("g")
        .attr("transform", "translate(" + margin.left + "," + 0 + ")")
        .call(yaxis);
    timeline_g.append("text")
        .text("Deaths")
        .style("font-size", "22px")
        .style("font-weight", "400")
        .attr("text-anchor", "middle")
        .attr("class", "y label")
        .attr("x", -timeline_height * 0.5)
        .attr("y", 0)
        .attr("transform", "rotate(-90)")

    // draw lines
    let lines_a = timeline_g.append("g");
    lines_a
        .append("path")
        .datum(lineDataDay)
        .attr("fill", "none")
        .attr("stroke", golden) 
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return xScale(d.date) })
            .y(function (d) { return yScale(d.new_deaths) })
        );

    timeline_g.append("text")
        .attr("text-anchor", "middle")
        .style("font-size", "28px")
        .attr("x", timeline_width * 0.5)
        .attr("y", 5)
        .text("Daily Deaths");

}




function getMultipleLinesHTML(noHTMLText, lineMaxLen) {
    if (lineMaxLen <= 2) {
        return "";
    }
    let tokens = noHTMLText.split(' ').filter(function (e) { return e != ""; });
    // let ret = "";
    // for (let i = 0; i < noHTMLText.length; i += lineMaxLen) {
    //     ret += noHTMLText.substring(i, i+lineMaxLen) + "<br>";
    // }
    let ret = "";
    let currentLine = "";
    let i = 0;
    while (i < tokens.length) {
        let token = tokens[i];
        let j = 0;
        if (currentLine.length == 0) {
            while ((token.length - j) > lineMaxLen) {
                ret += token.substring(j, j + lineMaxLen - 1) + "-<br>";
                j += lineMaxLen - 1;
            }
            currentLine += token.substring(j);
            i += 1;
        } else {
            let remaining = lineMaxLen - currentLine.length - 1;
            if (token.length <= remaining) {
                currentLine += " " + token;
                i += 1;
            } else {
                ret += currentLine + "<br>";
                currentLine = "";
                // don't increase i
            }
        }
    }
    if (currentLine.length > 0) {
        ret += currentLine + " <br>";
        currentLine = "";
    }


    return ret;
}

function processPolicies(usPoliciesData) {
    let usAbbreviationsDictRev = {};
    for (let stateAbbr in usAbbreviationsDict) {
        usAbbreviationsDictRev[usAbbreviationsDict[stateAbbr]] = stateAbbr;
    }

    const policyDateParser = d3.timeParse("%Y/%m/%d");
    usPoliciesByState = {};
    for (let i = 0; i < usPoliciesData.length; i++) {
        let stateFullname = usPoliciesData[i].State;
        if (!(stateFullname in usAbbreviationsDictRev)) {
            console.log("unknown state: " + stateFullname)
            continue;
        }
        let state = usAbbreviationsDictRev[stateFullname];
        if (!(state in usPoliciesByState)) {
            usPoliciesByState[state] = [];
        }
        let tmpDate = policyDateParser(usPoliciesData[i].Date);
        let tmp = {
            "Date": tmpDate,
            "Action Taken": usPoliciesData[i]["Action Taken"],
            "yyyymmdd": usPoliciesData[i].Date,
            "mmddyyyy": (tmpDate.getMonth() + 1) + '/' + tmpDate.getDate() + '/' + tmpDate.getFullYear()
        };
        usPoliciesByState[state].push(tmp);
    }
    // sort by date
    for (let state in usPoliciesByState) {
        usPoliciesByState[state].sort(function (a, b) {
            let keyA = a["Date"];
            let keyB = b["Date"];
            if (keyA < keyB) {
                return 1;
            }
            if (keyA > keyB) {
                return -1;
            }
            return 0;
        });
    }
}