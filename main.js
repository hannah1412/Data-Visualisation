import { displayCharts } from './barChart.js';

barChartDataProcessor('./data/digital-exclusion-data.csv').then(regionData => {
  document.querySelectorAll(".region").forEach(button => {
    button.addEventListener("click", e => {
      var selectedMode = document.querySelector('input[name="mode"]:checked').value;
      if (selectedMode == "type") {
        selectedMode = "device";
      } else {
        selectedMode = "usage";
      }

      const regionFeature = e.target.__data__;
      const regionName = regionFeature?.properties?.EER13NM;

      const data = regionData[regionName];
      console.log(data);

      if (!data) return;
      displayCharts(regionName, data, selectedMode);
    });
  });

  document.addEventListener("click", (e) => {
    // Clicking outside the barchart container closes it.
    if (!e.target.closest(".region") && !e.target.closest("#barcharts") && !e.target.closest("#all-categories")) {
      const visContainer = document.getElementById("all-categories");
      visContainer.style.display = "none";

      const chartsContainer = document.getElementById("barcharts");
      chartsContainer.style.display = "none";

      const chartsHeader = document.getElementById("region-title");
      chartsHeader.style.display = "none";

      document.querySelectorAll(".chart").forEach(chart => {
        chart.innerHTML = "";
      });
    }
  });
});

const incomeCol = 'q11';
const ageCol = 'cage2';
const regionCol = 'brk_government_region';

// all columns 
const healthCols = d3.range(1, 11).map(i => 'q3_' + String(i).padStart(2, '0'));
const deviceCols = d3.range(1, 11).map(i => 'q1_' + String(i).padStart(2, '0'));
const usageCols = d3.range(1, 20).map(i => 'q2_' + String(i).padStart(2, '0'));

const incomeLabels = {
  'Up to �199 per week / Up to �10,399 per year': '£0-£10,399',
  '�200 to �299 per week / �10,400 to �15,599 per year': '£10,400-£15,599',
  '�300 to �499 per week / �15,600 to �25,999 per year': '£15,600-£25,999',
  '�500 to v699 per week / �26,000 to �36,399 per year': '£26,000-£36,399',
  '�700 to �999 per week / �36,400 to �51,999 per year': '£36,400-£51,999',
  '�1,000 and above per week / �52,000 and above per year': '£52,000+',
  "Don't know": "Don't know", "Prefer not to say": "Prefer not to say"
};

const healthLabels = {
  q3_01: 'Hearing problems', q3_02: 'Vision problems',
  q3_03: 'Mobility limitations', q3_04: 'Dexterity issues',
  q3_05: 'Breathing difficulties', q3_06: 'Mental ability issues',
  q3_07: 'Social behavior conditions', q3_08: 'Mental health conditions',
  q3_09: 'Other illnesses', q3_10: 'No impairments',
  q3_11: 'Prefer not to say', q3_12: "Don't know"
};

const deviceLabels = {
  q1_01: "Smart TV",
  q1_02: "TV",
  q1_03: "Games console",
  q1_04: "PC",
  q1_05: "Laptop",
  q1_06: "Tablet",
  q1_07: "Smartphone",
  q1_08: "Phone",
  q1_09: "Landline",
  q1_10: "None",
  q1_11: "Don't know"
};

const usageLabels = {
  q2_01: "Emails",
  q2_02: "Personal interests",
  q2_03: "Info about products",
  q2_04: "Online groceries",
  q2_05: "Online shopping",
  q2_06: "Online banking",
  q2_07: "Job hunting",
  q2_08: "Online games",
  q2_09: "Online games for money",
  q2_10: "Music/podcasts",
  q2_11: "TV/Film/Short videos",
  q2_12: "Dating",
  q2_13: "Voice/video calls",
  q2_14: "Social network",
  q2_15: "Applying for benefits",
  q2_16: "Public services",
  q2_17: "Online messaging",
  q2_18: "Other",
  q2_19: "None",
  q2_20: "Don't know"
};

function barChartDataProcessor(csvPath) {
  return d3.csv(csvPath).then(data => {
    const summary = {};

    data.forEach(row => {
      const region = row[regionCol] || 'Unknown';
      if (!summary[region]) {
        summary[region] = {
          age: {},
          income: {},
          health: {}
        };
      }

      // === Age breakdown ===
      const age = row[ageCol];
      const ageLabel = age;
      if (!summary[region].age[ageLabel]) {
        summary[region].age[ageLabel] = { total: 0, device: {}, usage: {} };
      }
      summary[region].age[ageLabel].total++;
      
      deviceCols.forEach(col => {
        if (row[col] === 'Yes') {
          const label = deviceLabels[col];
          summary[region].age[ageLabel].device[label] = (summary[region].age[ageLabel].device[label] || 0) + 1;
        }
      });

      usageCols.forEach(col => {
        if (row[col] === 'Yes') {
          const label = usageLabels[col];
          summary[region].age[ageLabel].usage[label] = (summary[region].age[ageLabel].usage[label] || 0) + 1;
        }
      });

      // === Income breakdown ===
      const rawIncome = row[incomeCol];
      const incomeLabel = incomeLabels[rawIncome];
      if (!summary[region].income[incomeLabel]) {
        summary[region].income[incomeLabel] = { total: 0, device: {}, usage: {} };
      }
      summary[region].income[incomeLabel].total++;

      deviceCols.forEach(col => {
        if (row[col] === 'Yes') {
          const label = deviceLabels[col];
          summary[region].income[incomeLabel].device[label] = (summary[region].income[incomeLabel].device[label] || 0) + 1;
        }
      });

      usageCols.forEach(col => {
        if (row[col] === 'Yes') {
          const label = usageLabels[col];
          summary[region].income[incomeLabel].usage[label] = (summary[region].income[incomeLabel].usage[label] || 0) + 1;
        }
      });

      // === Health breakdown ===
      healthCols.forEach(healthCol => {
        if (row[healthCol] === 'Yes') {
          const healthLabel = healthLabels[healthCol];
          if (!summary[region].health[healthLabel]) {
            summary[region].health[healthLabel] = { total: 0, device: {}, usage: {} };
          }
          summary[region].health[healthLabel].total++;

          deviceCols.forEach(col => {
            if (row[col] === 'Yes') {
              const label = deviceLabels[col];
              summary[region].health[healthLabel].device[label] = (summary[region].health[healthLabel].device[label] || 0) + 1;
            }
          });

          usageCols.forEach(col => {
            if (row[col] === 'Yes') {
              const label = usageLabels[col];
              summary[region].health[healthLabel].usage[label] = (summary[region].health[healthLabel].usage[label] || 0) + 1;
            }
          });
        }
      });
    });

    return summary;
  });
}
