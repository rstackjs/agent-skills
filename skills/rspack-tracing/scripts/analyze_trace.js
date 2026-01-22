#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse duration string (e.g., "1.23ms", "456.78µs", "0.12s") to milliseconds
function parseDuration(durationStr) {
  if (!durationStr) return 0;
  
  const match = durationStr.match(/^([\d.]+)(ms|µs|s|ns)$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'ms': return value;
    case 'µs': return value / 1000;
    case 'ns': return value / 1000000;
    default: return value;
  }
}

// Get trace file path
const tracePath = process.argv[2] || path.join(__dirname, 'trace.json');

if (!fs.existsSync(tracePath)) {
  console.error(`Error: Trace file not found at ${tracePath}`);
  console.error('Usage: node analyze_trace.js <path-to-trace.json>');
  process.exit(1);
}

console.log(`Analyzing trace file: ${tracePath}\n`);

try {
  const fileContent = fs.readFileSync(tracePath, 'utf8');
  
  // Parse line-delimited JSON
  const events = fileContent.trim().split('\n')
    .map(line => {
      try { return JSON.parse(line); } 
      catch(err) { return null; }
    })
    .filter(Boolean);

  if (!events.length) {
    console.error("No valid trace events found.");
    process.exit(1);
  }

  console.log("=== Rspack Build Performance Analysis ===\n");
  console.log(`Total events: ${events.length}\n`);
  
  // Categorize events by target
  const pluginStats = new Map();
  const loaderStats = new Map();
  
  events.forEach(event => {
    const target = event.target;
    const timeField = event.fields?.['time.busy'];
    
    if (!timeField) return;
    
    const duration = parseDuration(timeField);
    
    if (target === 'Plugin Analysis') {
      // Plugin performance
      const pluginName = event.span?.name;
      if (!pluginName) return;
      
      if (!pluginStats.has(pluginName)) {
        pluginStats.set(pluginName, { 
          count: 0, 
          total: 0, 
          max: 0,
          min: Infinity
        });
      }
      
      const stat = pluginStats.get(pluginName);
      stat.count++;
      stat.total += duration;
      stat.max = Math.max(stat.max, duration);
      stat.min = Math.min(stat.min, duration);
      
    } else if (target === 'Loader Analysis') {
      // Loader performance
      let loaderName = event.span?.name;
      
      // For pitch phase (span.name is null), use resource path
      if (!loaderName) {
        const resource = event.fields?.resource;
        if (resource) {
          // Extract filename from resource path
          const cleanResource = resource.replace(/^"|"$/g, ''); // Remove quotes
          const filename = cleanResource.split('/').pop();
          loaderName = `Loader pitch for ${filename}`;
        } else {
          loaderName = 'Loader pitch (unknown resource)';
        }
      }
      
      if (!loaderStats.has(loaderName)) {
        loaderStats.set(loaderName, { 
          count: 0, 
          total: 0, 
          max: 0,
          min: Infinity
        });
      }
      
      const stat = loaderStats.get(loaderName);
      stat.count++;
      stat.total += duration;
      stat.max = Math.max(stat.max, duration);
      stat.min = Math.min(stat.min, duration);
    }
  });

  // Display Plugin Analysis
  if (pluginStats.size > 0) {
    console.log("🔌 Plugin Analysis (by name):");
    console.log("─".repeat(80));
    
    const sortedPlugins = [...pluginStats.entries()]
      .sort((a, b) => b[1].total - a[1].total);
    
    sortedPlugins.forEach(([name, stat]) => {
      const avg = stat.total / stat.count;
      console.log(`${name}`);
      console.log(`  Total: ${stat.total.toFixed(2)}ms | Count: ${stat.count} | ` +
                  `Avg: ${avg.toFixed(2)}ms | Max: ${stat.max.toFixed(2)}ms | Min: ${stat.min.toFixed(2)}ms`);
      console.log("");
    });
    
    const totalPluginTime = [...pluginStats.values()]
      .reduce((sum, stat) => sum + stat.total, 0);
    console.log(`Total Plugin Time: ${totalPluginTime.toFixed(2)}ms\n`);
  }

  // Display Loader Analysis
  if (loaderStats.size > 0) {
    console.log("\n🔧 Loader Analysis (by name):");
    console.log("─".repeat(80));
    
    const sortedLoaders = [...loaderStats.entries()]
      .sort((a, b) => b[1].total - a[1].total);
    
    sortedLoaders.forEach(([name, stat]) => {
      const avg = stat.total / stat.count;
      console.log(`${name}`);
      console.log(`  Total: ${stat.total.toFixed(2)}ms | Count: ${stat.count} | ` +
                  `Avg: ${avg.toFixed(2)}ms | Max: ${stat.max.toFixed(2)}ms | Min: ${stat.min.toFixed(2)}ms`);
      console.log("");
    });
    
    const totalLoaderTime = [...loaderStats.values()]
      .reduce((sum, stat) => sum + stat.total, 0);
    console.log(`Total Loader Time: ${totalLoaderTime.toFixed(2)}ms\n`);
  }
} catch (err) {
  console.error("Error processing trace file:", err);
  process.exit(1);
}
