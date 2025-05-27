const incomeCol = 'q11';
const ageCol    = 'cage2';
const regionCol = 'brk_government_region';

// all columns 
const healthCols = d3.range(1,11).map(i => 'q3_' + String(i).padStart(2,'0'));
const deviceCols = d3.range(1,11).map(i => 'q1_' + String(i).padStart(2,'0'));
const usageCols = d3.range(1, 20).map(i => 'q2_' + String(i).padStart(2,'0'));

export function highLevelDataProcessor(csvPath){

  return d3.csv(csvPath).then(data => {
    const summary = {};

    data.forEach(row => {
      const region = row[regionCol] || 'Unknown';
      if (!summary[region]) {
        summary[region] = {
          income: {},
          age:    {},
          health: {},
          device: {},
          usage: {},
        };
      }

      // income
      const inc = row[incomeCol] || 'Unknown';
      summary[region].income[inc] = (summary[region].income[inc] || 0) + 1;

      // age
      const age = row[ageCol] || 'Unknown';
      summary[region].age[age] = (summary[region].age[age] || 0) + 1;

      // health flags
      healthCols.forEach(col => {
        if (row[col] === 'Yes') {
          summary[region].health[col] = (summary[region].health[col] || 0) + 1;
        }
      });

      // device flags
      deviceCols.forEach(col => {
        if (row[col] === 'Yes') {
          summary[region].device[col] = (summary[region].device[col] || 0) + 1;
        }
      });

      usageCols.forEach(col => {
        if (row[col] === 'Yes') {
          summary[region].usage[col] = (summary[region].usage[col] || 0) + 1;
        }
      });
    });

    return summary;
  });
  
}
