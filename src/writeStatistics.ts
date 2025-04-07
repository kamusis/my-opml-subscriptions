import { OPMLData } from "./parseOPML.ts";
// SVG generation utilities
function generatePieChart(data: { name: string; value: number; color: string }[], size = 200): string {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  const paths: string[] = [];
  const legend: string[] = [];
  
  data.forEach((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const endAngle = currentAngle + angle;
    
    // Convert angles to radians and calculate path
    const startRad = (currentAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    const x1 = size/2 + size/3 * Math.cos(startRad);
    const y1 = size/2 + size/3 * Math.sin(startRad);
    const x2 = size/2 + size/3 * Math.cos(endRad);
    const y2 = size/2 + size/3 * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    paths.push(`<path d="M${size/2},${size/2} L${x1},${y1} A${size/3},${size/3} 0 ${largeArc},1 ${x2},${y2} Z" fill="${item.color}"/>`)
    
    // Add legend
    legend.push(`<g transform="translate(0,${20 * index + size + 10})">
      <rect width="10" height="10" fill="${item.color}"/>
      <text x="15" y="10">${item.name} (${Math.round(percentage * 100)}%)</text>
    </g>`);
    
    currentAngle = endAngle;
  });
  
  return `<svg width="${size}" height="${size + 80}" xmlns="http://www.w3.org/2000/svg">
    <g>${paths.join('')}</g>
    <g>${legend.join('')}</g>
  </svg>`;
}

function generateBarChart(data: { name: string; value: number }[], color = "#2196F3", size = { width: 400, height: 300 }): string {
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = size.width - margin.left - margin.right;
  const chartHeight = size.height - margin.top - margin.bottom;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = chartWidth / data.length * 0.8;
  
  const bars = data.map((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight;
    const x = margin.left + (chartWidth / data.length) * index + (chartWidth / data.length - barWidth) / 2;
    const y = margin.top + chartHeight - barHeight;
    
    return `
      <g>
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}"/>
        <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle">${item.value}</text>
        <text x="${x + barWidth/2}" y="${size.height - margin.bottom/2}" text-anchor="middle" transform="rotate(-45,${x + barWidth/2},${size.height - margin.bottom/2})">${item.name}</text>
      </g>`;
  });
  
  return `<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">
    ${bars.join('')}
  </svg>`;
}

interface Statistics {
  totalFeeds: number;
  deadFeeds: number;
  inactiveFeeds: number;
  activeFeeds: number;
  topCategories: {name: string; count: number}[];
  mostUpdatedFeeds: {title: string; updates: number}[];
}

export async function generateStatistics(
  opmlData: OPMLData,
  outputDir: string,
  inputFileName: string
): Promise<void> {
  // Calculate statistics
  const stats = calculateStatistics(opmlData);
  
  // Generate charts
  await generateCharts(stats, outputDir);
  
  // Generate markdown file
  await generateMarkdown(stats, outputDir, inputFileName);
}

function calculateStatistics(opmlData: OPMLData): Statistics {
  // Flatten all feeds from categories
  const allFeeds = Object.values(opmlData.categories).flat();
  const totalFeeds = allFeeds.length;
  const deadFeeds = allFeeds.filter(f => f.status === "dead").length;
  const inactiveFeeds = allFeeds.filter(f => f.status === "inactive").length;
  const activeFeeds = allFeeds.filter(f => f.status === "active").length;
  
  // Calculate top categories
  const categoryCounts = new Map<string, number>();
  Object.entries(opmlData.categories).forEach(([category, feeds]) => {
    const activeCount = feeds.filter(f => f.status === "active").length;
    if (activeCount > 0) {
      categoryCounts.set(category, activeCount);
    }
  });
  
  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
  
  // Get most updated feeds (assuming feedData has lastUpdated field)
  const mostUpdatedFeeds = allFeeds
    .filter(f => f.status === "active")
    .sort((a, b) => (b.updatesInLast3Months || 0) - (a.updatesInLast3Months || 0))
    .slice(0, 5)
    .map(f => ({ 
      title: f.url, 
      updates: f.updatesInLast3Months || 0 
    }));
  
  return {
    totalFeeds,
    deadFeeds,
    inactiveFeeds,
    activeFeeds,
    topCategories,
    mostUpdatedFeeds
  };
}

async function generateCharts(stats: Statistics, outputDir: string) {
  // Generate pie chart for feed status
  const pieChartData = [
    { name: "Active", value: stats.activeFeeds, color: "#4CAF50" },
    { name: "Inactive", value: stats.inactiveFeeds, color: "#FFC107" },
    { name: "Dead", value: stats.deadFeeds, color: "#F44336" }
  ];
  const pieChartSvg = generatePieChart(pieChartData);
  
  // Generate bar chart for top categories
  const barChartData = stats.topCategories.map(c => ({
    name: c.name,
    value: c.count
  }));
  const barChartSvg = generateBarChart(barChartData);
  
  // Save charts
  await Deno.writeTextFile(
    `${outputDir}/feed_status_pie_chart.svg`,
    pieChartSvg
  );
  
  await Deno.writeTextFile(
    `${outputDir}/active_feeds_bar_chart.svg`,
    barChartSvg
  );
}

async function generateMarkdown(stats: Statistics, outputDir: string, inputFileName: string) {
  const markdownContent = `# Processing Statistics

## Summary
- **Total Feeds Processed**: ${stats.totalFeeds}
- **Dead Feeds**: ${stats.deadFeeds} (${((stats.deadFeeds / stats.totalFeeds) * 100).toFixed(1)}%)
- **Inactive Feeds**: ${stats.inactiveFeeds} (${((stats.inactiveFeeds / stats.totalFeeds) * 100).toFixed(1)}%)
- **Active Feeds**: ${stats.activeFeeds} (${((stats.activeFeeds / stats.totalFeeds) * 100).toFixed(1)}%)

## Top Categories
${
  stats.topCategories.map((c, i) => 
    `${i + 1}. **${c.name}**: ${c.count} active feeds`
  ).join("\n")
}

## Most Frequently Updated Feeds
${
  stats.mostUpdatedFeeds.map((f, i) => 
    `${i + 1}. ${f.title} - ${f.updates} updates in the last 3 months`
  ).join("\n")
}

## Visualizations
![Feed Status Distribution](${outputDir}/feed_status_pie_chart.svg)
![Active Feeds by Category](${outputDir}/active_feeds_bar_chart.svg)
`;

  await Deno.writeTextFile(`${outputDir}/processing_statistics_${inputFileName}.md`, markdownContent);
}
