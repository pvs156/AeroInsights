// ✅ D3.js implementation of original Power BI charts (Q1–Q5)
const filePath = 'data/Integrated_Aviation_Dataset1.csv';

const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("padding", "8px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.1)")
    .style("visibility", "hidden")
    .style("opacity", 0);

d3.csv(filePath).then(data => {
    data.forEach(d => {
        d["Total.Fatal.Injuries"] = +d["Total.Fatal.Injuries"] || 0;
        d["Total.Serious.Injuries"] = +d["Total.Serious.Injuries"] || 0;
        d["Total.Minor.Injuries"] = +d["Total.Minor.Injuries"] || 0;
        d.Severity = d["Severity"] ? +d["Severity"] : d["Total.Fatal.Injuries"] + d["Total.Serious.Injuries"] + d["Total.Minor.Injuries"];
    });

    // Q1: Accidents Over Time
    const accidentByYear = d3.rollup(data, v => v.length, d => d["Event.Date"].slice(0, 4));
    const yearData = Array.from(accidentByYear, ([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year);
    drawLineChart("#chart1 svg", yearData, "year", "count", "Year", "Accidents");

    // Q2: Monthly Accidents Trend
    const accidentByMonth = d3.rollup(data, v => v.length, d => d["Event.Date"].slice(0, 7));
    const monthData = Array.from(accidentByMonth, ([month, count]) => ({ month, count })).sort((a, b) => new Date(a.month) - new Date(b.month));
    drawLineChart("#chart2 svg", monthData, "month", "count", "Month", "Accidents");

    // Q3: Which weather condition leads to more severe accidents
    const severityByWeather = Array.from(
        d3.group(data, d => d["Weather.Condition"]),
        ([weather, records]) => ({
            weather,
            avgSeverity: d3.mean(records, r => r.Severity)
        })
    );
    drawBarChart("#chart3 svg", severityByWeather, "weather", "avgSeverity", "Weather", "Avg Severity");

    // Q4: Engine Count vs Severity
    const severityByEngine = Array.from(
        d3.group(data, d => d["Engine.Type"] || "Unknown"),
        ([engine, records]) => ({
            engine,
            avgSeverity: d3.mean(records, r => r.Severity)
        })
    );
    drawBarChart("#chart4 svg", severityByEngine, "engine", "avgSeverity", "Engine Type", "Avg Severity");

    // Q5: Aircraft Makes with Most Accidents
    const aircraftCounts = Array.from(
        d3.group(data, d => d["Aircraft.Make"]),
        ([make, records]) => ({
            make,
            count: records.length
        })
    ).sort((a, b) => b.count - a.count).slice(0, 10);
    drawBarChart("#chart5 svg", aircraftCounts, "make", "count", "Aircraft Make", "# of Accidents");
});

// Reusable D3 Charts
function drawBarChart(svgSelector, dataset, xKey, yKey, xLabel, yLabel) {
    const svg = d3.select(svgSelector), width = +svg.attr("width"), height = +svg.attr("height"), margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const x = d3.scaleBand().domain(dataset.map(d => d[xKey])).range([margin.left, width - margin.right]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(dataset, d => d[yKey])]).range([height - margin.bottom, margin.top]);
    svg.selectAll("*").remove();
    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
    svg.selectAll("rect")
        .data(dataset)
        .enter().append("rect")
        .attr("x", d => x(d[xKey]))
        .attr("y", d => y(d[yKey]))
        .attr("height", d => y(0) - y(d[yKey]))
        .attr("width", x.bandwidth())
        .attr("fill", "#4682b4")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "#ff7f50");
            tooltip.transition().style("opacity", 1).style("visibility", "visible");
            tooltip.html(`${xLabel}: <strong>${d[xKey]}</strong><br>${yLabel}: <strong>${d[yKey].toFixed(2)}</strong>`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "#4682b4");
            tooltip.transition().style("opacity", 0).style("visibility", "hidden");
        });
}

function drawLineChart(svgSelector, dataset, xKey, yKey, xLabel, yLabel) {
    const svg = d3.select(svgSelector), width = +svg.attr("width"), height = +svg.attr("height"), margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const x = d3.scalePoint().domain(dataset.map(d => d[xKey])).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, d3.max(dataset, d => d[yKey])]).range([height - margin.bottom, margin.top]);
    svg.selectAll("*").remove();
    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
    svg.append("path")
        .datum(dataset)
        .attr("fill", "none")
        .attr("stroke", "#1f77b4")
        .attr("stroke-width", 2)
        .attr("d", d3.line().x(d => x(d[xKey])).y(d => y(d[yKey])));
    svg.selectAll("circle")
        .data(dataset)
        .enter().append("circle")
        .attr("cx", d => x(d[xKey]))
        .attr("cy", d => y(d[yKey]))
        .attr("r", 3)
        .attr("fill", "#ff7f50")
        .on("mouseover", function (event, d) {
            tooltip.transition().style("opacity", 1).style("visibility", "visible");
            tooltip.html(`${xLabel}: <strong>${d[xKey]}</strong><br>${yLabel}: <strong>${d[yKey]}</strong>`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().style("opacity", 0).style("visibility", "hidden");
        });
}
