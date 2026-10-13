const fs = require('fs');

function loadAnalyticsEngine() {
  const html = fs.readFileSync('echt-analytics.html', 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) throw new Error('Script tag not found in echt-analytics.html');
  const scriptContent = scriptMatch[1];

  // Mock DOM elements/localStorage if accessed
  const dummyEl = {
    addEventListener: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {} },
    getContext: () => ({ drawImage: () => {}, fillRect: () => {} }),
  };

  const sandbox = {
    TOTAL_SLOTS: 96,
    CATEGORIES: [
      { id: 'bread', name: 'Brot' },
      { id: 'pastry', name: 'Gebäck' },
      { id: 'custom', name: 'Sonstiges' },
    ],
    DATA: { tasks: [], ovenBlocks: [] },
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      getElementById: () => dummyEl,
      querySelector: () => dummyEl,
      querySelectorAll: () => [],
      addEventListener: () => {},
    },
    window: { addEventListener: () => {} },
    Chart: function() { return { destroy: () => {}, update: () => {} }; },
  };

  const contextFunc = new Function('sandbox', `
    with (sandbox) {
      ${scriptContent}
      return { computeAll, DATA, blocksOverlap };
    }
  `);

  return contextFunc(sandbox);
}

// Generate realistic dataset with many tasks and oven blocks
function generateData(numTasks = 1000, numOven = 500) {
  const tasks = [];
  const ovenBlocks = [];

  for (let i = 0; i < numTasks; i++) {
    const day = i % 7;
    const startSlot = (i * 3) % 80;
    const endSlot = startSlot + 1 + (i % 8);
    tasks.push({
      id: `task_${i}`,
      day,
      startSlot,
      endSlot,
      passive: i % 3 === 0,
      category: i % 2 === 0 ? 'bread' : 'pastry',
    });
  }

  for (let i = 0; i < numOven; i++) {
    const day = i % 7;
    const startSlot = (i * 5) % 80;
    const endSlot = startSlot + 2 + (i % 6);
    ovenBlocks.push({
      id: `oven_${i}`,
      day,
      startSlot,
      endSlot,
      category: 'bread',
    });
  }

  return { tasks, ovenBlocks };
}

function runBenchmark() {
  const { computeAll, DATA } = loadAnalyticsEngine();

  // Test data
  const testData = generateData(2000, 1000);
  DATA.tasks = testData.tasks;
  DATA.ovenBlocks = testData.ovenBlocks;

  // Warmup
  for (let i = 0; i < 50; i++) {
    computeAll();
  }

  // Benchmark timing
  const iterations = 500;
  const start = process.hrtime.bigint();
  let lastResult = null;
  for (let i = 0; i < iterations; i++) {
    lastResult = computeAll();
  }
  const end = process.hrtime.bigint();

  const totalMs = Number(end - start) / 1e6;
  const avgMs = totalMs / iterations;

  console.log(`Benchmark completed: ${iterations} iterations`);
  console.log(`Total time: ${totalMs.toFixed(2)} ms`);
  console.log(`Average time per run: ${avgMs.toFixed(4)} ms`);

  return { avgMs, result: lastResult };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { loadAnalyticsEngine, generateData, runBenchmark };
