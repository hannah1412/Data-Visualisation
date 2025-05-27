// heatmap.js
import { highLevelDataProcessor } from './HighLevelDataProcessor.js';

/**
 * Draws a heatmap into the given container.
 *
 * @param {string} containerId   - e.g. '#heatmap'
 * @param {string} dataPath      - CSV URL
 * @param {string} defaultRegion - e.g. 'Scotland'
 * @param {string} defaultX      - 'age'|'income'|'health'
 * @param {string} defaultY      - 'age'|'income'|'health'
 */
export function drawHeatmap(
  containerId,
  dataPath,
  defaultRegion = 'Scotland',
  defaultX      = 'health',
  defaultY      = 'age'
) {
  const margin = {top:30, right:30, bottom:120, left:220};
  const width  = 700 - margin.left - margin.right;
  const height = 600 - margin.top  - margin.bottom;

  // 1) Clear & build static UI (controls + SVG + tooltip)
  const container = d3.select(containerId);
  container.selectAll('*').remove();

  const controls = container.append('div')
    .attr('id','controls')
    .style('margin-bottom','20px')
    .style('margin-top','20px')
    .html(`
      X-Axis:
      <select id="x-axis-select">
        <option value="age">Age</option>
        <option value="income">Income</option>
        <option value="health">Health</option>
      </select>
      Y-Axis:
      <select id="y-axis-select">
        <option value="age">Age</option>
        <option value="income">Income</option>
        <option value="health">Health</option>
      </select>
    `);

  d3.select('#x-axis-select').property('value', defaultX);
  d3.select('#y-axis-select').property('value', defaultY);

  const svg = container.append('svg')
    .attr('width',  width + margin.left + margin.right)
    .attr('height', height + margin.top  + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select('body').append('div')
    .attr('class','tooltip')
    .style('position','absolute')
    .style('background-color','white')
    .style('border','solid 2px #ccc')
    .style('border-radius','5px')
    .style('padding','5px')
    .style('pointer-events','none')
    .style('opacity',0);

  // 2) Static label maps & orders
  const healthLabels = {
    q3_01:'Hearing problems',    q3_02:'Vision problems',
    q3_03:'Mobility limitations', q3_04:'Dexterity issues',
    q3_05:'Breathing difficulties', q3_06:'Mental ability issues',
    q3_07:'Social behavior conditions', q3_08:'Mental health conditions',
    q3_09:'Other illnesses',      q3_10:'No impairments',
    q3_11:'Prefer not to say',    q3_12:"Don't know"
  };
  const ageOrder = ['16-24','25-34','35-44','45-54','55-64','65+'];
  const incomeLabels = {
    'Up to �199 per week / Up to �10,399 per year':'£0-£10,399',
    '�200 to �299 per week / �10,400 to �15,599 per year':'£10,400-£15,599',
    '�300 to �499 per week / �15,600 to �25,999 per year':'£15,600-£25,999',
    '�500 to v699 per week / �26,000 to �36,399 per year':'£26,000-£36,399',
    '�700 to �999 per week / �36,400 to �51,999 per year':'£36,400-£51,999',
    '�1,000 and above per week / �52,000 and above per year':'£52,000+',
    "Don't know":"Don't know", "Prefer not to say":"Prefer not to say"
  };
  const incomeOrder = [
    '£0-£10,399','£10,400-£15,599','£15,600-£25,999',
    '£26,000-£36,399','£36,400-£51,999','£52,000+',
    "Don't know","Prefer not to say"
  ];

  function getLabel(attr, key) {
    if (attr === 'income') return incomeLabels[key] || key;
    if (attr === 'health') return healthLabels[key] || key;
    return key;
  }

  // 3) The update() that re-draws the grid
  function update(summary, xAttr, yAttr, region) {
    const regionData = summary[region] || {};
    const srcX       = regionData[xAttr] || {};
    const srcY       = regionData[yAttr] || {};

    const xDomain = xAttr === 'age'    ? ageOrder
                  : xAttr === 'income' ? incomeOrder
                  : xAttr === 'health' ? Object.keys(srcX).map(k=>healthLabels[k]||k)
                  : Object.keys(srcX);

    const yDomain = yAttr === 'age'    ? ageOrder
                  : yAttr === 'income' ? incomeOrder
                  : yAttr === 'health' ? Object.keys(srcY).map(k=>healthLabels[k]||k)
                  : Object.keys(srcY);

    // Build every combo
    const fullData = [];
    const total = d3.sum(Object.values(srcX)) || 1; // approximate joint basis

    xDomain.forEach(xVal => {
      yDomain.forEach(yVal => {
        const rawX = Object.keys(srcX).find(k => getLabel(xAttr, k) === xVal);
        const rawY = Object.keys(srcY).find(k => getLabel(yAttr, k) === yVal);
        const vX = srcX[rawX] || 0;
        const vY = srcY[rawY] || 0;

        const cnt = (xAttr === yAttr && rawX === rawY) ? vX : (vX * vY / total);
        fullData.push({ xCat: xVal, yCat: yVal, count: Math.round(cnt) });
      });
    });

    // Clear + draw
    svg.selectAll('*').remove();
    const xScale = d3.scaleBand().domain(xDomain).range([0,width]).padding(0.05);
    const yScale = d3.scaleBand().domain(yDomain).range([height,0]).padding(0.05);

    svg.append('g')
      .attr('transform',`translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .selectAll('text')
      .style('text-anchor','end')
      .attr('dx','-.8em').attr('dy','.15em')
      .attr('transform','rotate(-45)')
      .style('font-size', '12px');

    svg.append('g')
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll('text')
      .style('font-size', '12px');

    const maxCnt = d3.max(fullData,d=>d.count);
    // const color  = d3.scaleLinear().domain([0,maxCnt]).range(['#CAF0F8','#03045E']);
    const color = d3.scaleSequential(d3.interpolateBlues).domain([0, maxCnt]);

    svg.selectAll('rect')
      .data(fullData)
      .enter()
      .append('rect')
      .attr('x', d=>xScale(d.xCat))
      .attr('y', d=>yScale(d.yCat))
      .attr('width',  d=>xScale.bandwidth())
      .attr('height', d=>yScale.bandwidth())
      .attr('rx',4).attr('ry',4)
      .style('fill', d=>color(d.count))
      .style('opacity',0.8)
      .on('mouseover', (evt,d) => {
        tooltip.style('opacity',1);
        d3.select(evt.currentTarget).style('stroke','black').style('opacity',1);
      })
      .on('mousemove', (evt,d) => {
        tooltip
          .html(`<strong>${d.xCat} × ${d.yCat}</strong><br/>Count: ${d.count}`)
          .style('left', `${evt.pageX+10}px`)
          .style('top',  `${evt.pageY-28}px`);
      })
      .on('mouseleave', () => {
        tooltip.style('opacity',0);
        svg.selectAll('rect').style('stroke','none').style('opacity',0.8);
      });
  }

  // 4) Load & wire everything up
  highLevelDataProcessor(dataPath).then(summary => {
    // initial draw
    update(summary, defaultX, defaultY, defaultRegion);

    // when dropdowns change
    d3.select('#x-axis-select').on('change', function() {
      update(summary, this.value,  d3.select('#y-axis-select').node().value, defaultRegion);
    });
    d3.select('#y-axis-select').on('change', function() {
      update(summary, d3.select('#x-axis-select').node().value, this.value,  defaultRegion);
    });

    // region-click from your map or buttons (uses the same summary + update)
    document.querySelectorAll('.region').forEach(elem => {
      elem.addEventListener('click', e => {
        // your map bind __data__, or fallback to dataset.region
        const feat = e.target.__data__;
        const regionName = feat?.properties?.EER13NM 
                         || e.target.dataset.region 
                         || defaultRegion;
        update(
          summary,
          d3.select('#x-axis-select').node().value,
          d3.select('#y-axis-select').node().value,
          regionName
        );
      });
    });
  });
}
