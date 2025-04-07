/**
 * Module for generating statistics and visualizations for OPML feed analysis
 * Creates SVG charts and markdown reports for feed status distribution
 */
import { OPMLData } from "./parseOPML.ts";

/**
 * Generates a pie chart SVG showing the distribution of feed statuses
 * @param data Array of items with name, value, and color for each segment
 * @param size Diameter of the pie chart in pixels
 * @returns SVG markup as a string
 */
function generatePieChart(data: { name: string; value: number; color: string }[], size = 200): string {
  // Calculate total for percentage calculations
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  const paths: string[] = [];
  const legend: string[] = [];
  
  data.forEach((item, index) => {
    // Calculate segment angles and percentages
    const percentage = item.value / total;
    const angle = percentage * 360;
    const endAngle = currentAngle + angle;
    
    // Convert angles to radians and calculate SVG path coordinates
    const startRad = (currentAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    const x1 = size/2 + size/3 * Math.cos(startRad);
    const y1 = size/2 + size/3 * Math.sin(startRad);
    const x2 = size/2 + size/3 * Math.cos(endRad);
    const y2 = size/2 + size/3 * Math.sin(endRad);
    
    // Determine if arc should be drawn the long way around
    const largeArc = angle > 180 ? 1 : 0;
    paths.push(`<path d="M${size/2},${size/2} L${x1},${y1} A${size/3},${size/3} 0 ${largeArc},1 ${x2},${y2} Z" fill="${item.color}"/>`)
    
    // Create legend entry with color box and percentage
    legend.push(`<g transform="translate(0,${20 * index + size + 10})">
      <rect width="10" height="10" fill="${item.color}"/>
      <text x="15" y="10">${item.name} (${Math.round(percentage * 100)}%)</text>
    </g>`);
    
    currentAngle = endAngle;
  });
  
  // Combine paths and legend into final SVG
  return `<svg width="${size}" height="${size + 80}" xmlns="http://www.w3.org/2000/svg">
    <g>${paths.join('')}</g>
    <g>${legend.join('')}</g>
  </svg>`;
}

/**
 * Generates a bar chart SVG showing category or feed statistics
 * @param data Array of items with name and value for each bar
 * @param color Fill color for bars
 * @param size Width and height of the chart
 * @returns SVG markup as a string
 */
function generateBarChart(data: { name: string; value: number }[], color = "#2196F3", size = { width: 400, height: 300 }): string {
  // Chart margins and dimensions
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = size.width - margin.left - margin.right;
  const chartHeight = size.height - margin.top - margin.bottom;
  
  // Calculate bar dimensions
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = chartWidth / data.length * 0.8;
  
  // Generate SVG elements for each bar
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

/**
 * Statistics gathered from OPML feed analysis
 */
interface Statistics {
  /** Total number of feeds processed */
  totalFeeds: number;
  /** Number of inaccessible feeds */
  deadFeeds: number;
  /** Number of feeds not updated recently */
  inactiveFeeds: number;
  /** Number of active feeds */
  activeFeeds: number;
  /** Top categories by number of active feeds */
  topCategories: {name: string; count: number}[];
  /** Most frequently updated feeds */
  mostUpdatedFeeds: {title: string; updates: number}[];
}

/**
 * Main function to generate statistics and visualizations
 * @param opmlData Processed OPML data
 * @param outputDir Directory for output files
 * @param inputFileName Name of input file for statistics filename
 */
export async function generateStatistics(
  opmlData: OPMLData,
  outputDir: string,
  inputFileName: string
): Promise<void> {
  // Calculate statistics from OPML data
  const stats = calculateStatistics(opmlData);
  
  // Generate and save markdown report
  await generateMarkdown(stats, outputDir, inputFileName);
}

/**
 * Calculate statistics from OPML data
 * @param opmlData Processed OPML data
 * @returns Calculated statistics
 */
function calculateStatistics(opmlData: OPMLData): Statistics {
  // Get all feeds and count by status
  const allFeeds = Object.values(opmlData.categories).flat();
  const totalFeeds = allFeeds.length;
  const deadFeeds = allFeeds.filter(f => f.status === "dead").length;
  const inactiveFeeds = allFeeds.filter(f => f.status === "inactive").length;
  const activeFeeds = allFeeds.filter(f => f.status === "active").length;
  
  // Find categories with most active feeds
  const categoryCounts = new Map<string, number>();
  Object.entries(opmlData.categories).forEach(([category, feeds]) => {
    const activeCount = feeds.filter(f => f.status === "active").length;
    if (activeCount > 0) {
      categoryCounts.set(category, activeCount);
    }
  });
  
  // Get top 3 categories
  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
  
  // Get top 5 most frequently updated feeds
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

/**
 * Generate visualization charts from statistics
 * @param stats Calculated statistics
 * @param outputDir Directory for output files
 * @returns Object containing the generated chart filenames
 */
async function generateCharts(stats: Statistics, outputDir: string): Promise<{pieChartFile: string; barChartFile: string}> {
  // Generate timestamp for unique filenames
  const timestamp = Date.now();
  
  // Generate pie chart showing feed status distribution
  const pieChartData = [
    { name: "Active", value: stats.activeFeeds, color: "#4CAF50" },
    { name: "Inactive", value: stats.inactiveFeeds, color: "#FFC107" },
    { name: "Dead", value: stats.deadFeeds, color: "#F44336" }
  ];
  const pieChartSvg = generatePieChart(pieChartData);
  
  // Generate bar chart showing top categories
  const barChartData = stats.topCategories.map(c => ({
    name: c.name,
    value: c.count
  }));
  const barChartSvg = generateBarChart(barChartData);
  
  // Create filenames with timestamp
  const pieChartFile = `feed_status_pie_chart_${timestamp}.svg`;
  const barChartFile = `active_feeds_bar_chart_${timestamp}.svg`;
  
  // Save generated charts
  await Deno.writeTextFile(
    `${outputDir}/${pieChartFile}`,
    pieChartSvg
  );
  
  await Deno.writeTextFile(
    `${outputDir}/${barChartFile}`,
    barChartSvg
  );

  return { pieChartFile, barChartFile };
}

/**
 * Generate markdown report from statistics
 * @param stats Calculated statistics
 * @param outputDir Directory for output files
 * @param inputFileName Name of input file for statistics filename
 */
async function generateMarkdown(stats: Statistics, outputDir: string, inputFileName: string) {
  // Generate charts first to get the filenames
  const { pieChartFile, barChartFile } = await generateCharts(stats, outputDir);

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
![Feed Status Distribution](${pieChartFile})
![Active Feeds by Category](${barChartFile})
`;

  await Deno.writeTextFile(`${outputDir}/processing_statistics_${inputFileName}.md`, markdownContent);
}
