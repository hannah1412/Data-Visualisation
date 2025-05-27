export function createBarChart({ containerId, data, xKey, yKey, xLabel, yLabel, radioMode, yDomain }) {
  d3.select(`#${containerId}`).html("");

  const container = document.getElementById(containerId);
  const fullWidth = container.clientWidth;
  const fullHeight = container.clientHeight;

  const margin = { top: 20, right: 20, bottom: 50, left: 200 };
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;

  const svg = d3.select(`#${containerId}`)
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const y = d3.scaleBand()
    .range([0, height])
    .domain(yDomain || data.map(d => d[yKey]))
    .padding(0.2);

  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .attr("transform", "translate(-10,0)")
    .style("text-anchor", "end");

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[xKey].total)])
    .nice()
    .range([0, width]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)")
    .style("text-anchor", "end");

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "12px");

  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("y", d => y(d[yKey]))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d[xKey].total))
    .style("fill", "steelblue")
    .on("mouseover", function (event, d) {
      const breakdown = d[xKey][radioMode];
    
      const breakdownText = Object.entries(breakdown)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k}: ${v}`)
        .join("<br>");
    
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<strong>${d[yKey]}</strong><br><br>${breakdownText}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })    
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .style("text-anchor", "middle")
    .text(xLabel);

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -150)
    .style("text-anchor", "middle")
    .text(yLabel);
}


export function displayCharts(region, data, device_filter) {
  const regionTitle = document.getElementById("region-title");
  regionTitle.textContent = `Data for ${region}`;
  regionTitle.style.display = "block";

  const visContainer = document.getElementById("all-categories");
  visContainer.style.display = "flex";
  visContainer.style.flexDirection = "column";

  const chartsContainer = document.getElementById("barcharts");
  chartsContainer.style.display = "flex";
  chartsContainer.style.flexDirection = "column";

  const ageOrder = ['16-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const incomeOrder = [
    '£0-£10,399', '£10,400-£15,599', '£15,600-£25,999',
    '£26,000-£36,399', '£36,400-£51,999', '£52,000+',
    "Don't know", "Prefer not to say"
  ];

  createBarChart({
    containerId: "age",
    data: Object.entries(data.age).map(([key, value]) => ({ category: key, value })),
    yKey: "category",
    xKey: "value",
    yLabel: "Age group",
    xLabel: "Count",
    radioMode: device_filter,
    yDomain: ageOrder
  });
  
  createBarChart({
    containerId: "income",
    data: Object.entries(data.income).map(([key, value]) => ({ category: key, value })),
    yKey: "category",
    xKey: "value",
    yLabel: "Income band",
    xLabel: "Count",
    radioMode: device_filter,
    yDomain: incomeOrder
  });
  
  createBarChart({
    containerId: "health",
    data: Object.entries(data.health).map(([key, value]) => ({ category: key, value })),
    yKey: "category",
    xKey: "value",
    yLabel: "Health issues",
    xLabel: "Count",
    radioMode: device_filter
  });  

}