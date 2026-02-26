/**
 * Data Visualization for Monty Hall Batch Simulation
 * Creates interactive charts showing convergence, comparison, and statistical analysis
 */

export class SimulationCharts {
  constructor() {
    this.charts = {};
    this.colors = {
      stay: '#ff6b35',      // Orange-red for stay strategy
      switch: '#4ecdc4',    // Teal for switch strategy
      theoretical: '#45b7d1', // Blue for theoretical lines
      confidence: '#95a5a6', // Gray for confidence intervals
      grid: '#ecf0f1',      // Light gray for grid
      text: '#2c3e50'       // Dark gray for text
    };
    this.animations = {
      duration: 750,
      easing: 'ease-in-out'
    };
  }

  /**
   * Create convergence chart showing win rates over time
   * @param {string} containerId - DOM element ID for chart container
   * @param {Object} data - Simulation data
   * @param {Object} options - Chart options
   */
  createConvergenceChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    const chartOptions = {
      showTheoretical: true,
      showConfidence: false,
      animated: true,
      responsive: true,
      ...options
    };

    // Clear container
    container.innerHTML = '';

    // Create SVG
    const svg = this.createSVGElement(container, chartOptions);
    const { width, height, margin } = this.getChartDimensions(container);

    // Set up scales
    const maxGames = Math.max(...data.convergenceData.map(d => d.gameNumber));
    const xScale = this.createScale('linear', [1, maxGames], [margin.left, width - margin.right]);
    const yScale = this.createScale('linear', [0, 1], [height - margin.bottom, margin.top]);

    // Create chart elements
    this.drawAxes(svg, xScale, yScale, width, height, margin);
    this.drawGrid(svg, xScale, yScale, width, height, margin);

    // Group data by strategy
    const groupedData = this.groupDataByStrategy(data.convergenceData);

    // Draw theoretical lines
    if (chartOptions.showTheoretical) {
      this.drawTheoreticalLines(svg, xScale, yScale, groupedData);
    }

    // Draw convergence lines
    this.drawConvergenceLines(svg, xScale, yScale, groupedData, chartOptions.animated);

    // Add legend
    this.addLegend(svg, width, margin, Object.keys(groupedData), chartOptions.showTheoretical);

    // Add title and labels
    this.addChartLabels(svg, width, height, margin, {
      title: 'Win Rate Convergence Over Time',
      xLabel: 'Number of Games',
      yLabel: 'Win Rate'
    });

    // Store chart reference
    this.charts[containerId] = {
      svg,
      xScale,
      yScale,
      data: groupedData,
      options: chartOptions
    };

    // Add interactivity
    this.addChartInteractivity(containerId);
  }

  /**
   * Create comparison bar chart showing final win rates vs theoretical
   * @param {string} containerId - DOM element ID for chart container
   * @param {Object} data - Statistics data
   * @param {Object} options - Chart options
   */
  createComparisonChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    const chartOptions = {
      showConfidenceIntervals: true,
      animated: true,
      responsive: true,
      ...options
    };

    container.innerHTML = '';

    const svg = this.createSVGElement(container, chartOptions);
    const { width, height, margin } = this.getChartDimensions(container);

    // Prepare comparison data
    const comparisonData = this.prepareComparisonData(data);

    // Set up scales
    const xScale = this.createScale('band',
      comparisonData.map(d => d.strategy),
      [margin.left, width - margin.right], 0.3);
    const yScale = this.createScale('linear', [0, 1], [height - margin.bottom, margin.top]);

    // Draw chart elements
    this.drawAxes(svg, xScale, yScale, width, height, margin, 'comparison');
    this.drawGrid(svg, xScale, yScale, width, height, margin);

    // Draw bars
    this.drawComparisonBars(svg, xScale, yScale, comparisonData, chartOptions);

    // Add confidence intervals if requested
    if (chartOptions.showConfidenceIntervals && data.inferential) {
      this.drawConfidenceIntervals(svg, xScale, yScale, comparisonData, data.inferential);
    }

    // Add legend and labels
    this.addComparisonLegend(svg, width, margin);
    this.addChartLabels(svg, width, height, margin, {
      title: 'Observed vs Theoretical Win Rates',
      xLabel: 'Strategy',
      yLabel: 'Win Rate'
    });

    this.charts[containerId] = { svg, xScale, yScale, data: comparisonData, options: chartOptions };
  }

  /**
   * Create confidence interval visualization
   * @param {string} containerId - DOM element ID for chart container
   * @param {Object} data - Statistical data
   * @param {Object} options - Chart options
   */
  createConfidenceChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    container.innerHTML = '';

    const svg = this.createSVGElement(container, options);
    const { width, height, margin } = this.getChartDimensions(container);

    // Create confidence interval data
    const confidenceData = this.prepareConfidenceData(data);

    // Set up scales
    const xScale = this.createScale('linear', [0, 1], [margin.left, width - margin.right]);
    const yScale = this.createScale('band',
      confidenceData.map(d => d.strategy),
      [margin.top, height - margin.bottom], 0.3);

    // Draw elements
    this.drawAxes(svg, xScale, yScale, width, height, margin, 'confidence');
    this.drawConfidenceIntervals(svg, xScale, yScale, confidenceData, data.inferential, 'horizontal');

    // Add theoretical markers
    confidenceData.forEach(item => {
      const y = yScale(item.strategy) + yScale.bandwidth() / 2;
      const x = xScale(item.theoretical);

      svg.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', yScale(item.strategy))
        .attr('y2', yScale(item.strategy) + yScale.bandwidth())
        .attr('stroke', this.colors.theoretical)
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '5,5');

      svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', this.colors.theoretical);
    });

    this.addChartLabels(svg, width, height, margin, {
      title: '95% Confidence Intervals',
      xLabel: 'Win Rate',
      yLabel: 'Strategy'
    });
  }

  /**
   * Create real-time updating chart for live simulations
   * @param {string} containerId - DOM element ID for chart container
   * @param {Object} options - Chart options
   */
  createLiveChart(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    const chartOptions = {
      maxPoints: 1000,
      updateInterval: 100,
      showTheoretical: true,
      ...options
    };

    container.innerHTML = '';

    const svg = this.createSVGElement(container, chartOptions);
    const { width, height, margin } = this.getChartDimensions(container);

    // Initialize with empty data
    const liveData = {
      stay: [],
      switch: []
    };

    // Set up scales (will be updated as data comes in)
    const xScale = this.createScale('linear', [0, 100], [margin.left, width - margin.right]);
    const yScale = this.createScale('linear', [0, 1], [height - margin.bottom, margin.top]);

    // Draw initial chart structure
    this.drawAxes(svg, xScale, yScale, width, height, margin);
    this.drawGrid(svg, xScale, yScale, width, height, margin);

    // Store chart for live updates
    this.charts[containerId] = {
      svg,
      xScale,
      yScale,
      data: liveData,
      options: chartOptions,
      paths: {},
      isLive: true
    };

    return {
      updateData: (newData) => this.updateLiveChart(containerId, newData),
      finalize: () => this.finalizeLiveChart(containerId)
    };
  }

  /**
   * Update live chart with new data point
   * @param {string} containerId - Chart container ID
   * @param {Object} newData - New data point
   */
  updateLiveChart(containerId, newData) {
    const chart = this.charts[containerId];
    if (!chart || !chart.isLive) return;

    // Add new data point
    for (const [strategy, point] of Object.entries(newData)) {
      if (chart.data[strategy]) {
        chart.data[strategy].push(point);

        // Limit data points for performance
        if (chart.data[strategy].length > chart.options.maxPoints) {
          chart.data[strategy].shift();
        }
      }
    }

    // Update scales
    const allData = Object.values(chart.data).flat();
    if (allData.length > 0) {
      const maxGames = Math.max(...allData.map(d => d.gameNumber));
      chart.xScale.domain([1, maxGames]);
    }

    // Redraw lines
    this.updateConvergenceLines(chart);
  }

  /**
   * Finalize live chart (stop live updates, add final decorations)
   * @param {string} containerId - Chart container ID
   */
  finalizeLiveChart(containerId) {
    const chart = this.charts[containerId];
    if (!chart) return;

    chart.isLive = false;

    // Add final decorations
    this.addLegend(chart.svg,
      parseInt(chart.svg.attr('width')),
      { left: 40, right: 40, top: 40, bottom: 60 },
      Object.keys(chart.data),
      chart.options.showTheoretical
    );
  }

  /**
   * Create SVG element with responsive viewBox
   * @param {Element} container - DOM container
   * @param {Object} options - Chart options
   * @returns {Object} - D3 SVG selection
   */
  createSVGElement(container, options) {
    const { width, height } = this.getChartDimensions(container);

    // Create SVG with viewBox for responsiveness
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.maxHeight = `${height}px`;

    container.appendChild(svg);

    // Return a simple wrapper with D3-like methods
    return this.createSVGWrapper(svg);
  }

  /**
   * Create simple SVG wrapper with basic D3-like methods
   * @param {Element} svgElement - Native SVG element
   * @returns {Object} - Wrapper with D3-like methods
   */
  createSVGWrapper(svgElement) {
    return {
      append: (tagName) => {
        const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        svgElement.appendChild(element);
        return this.createElementWrapper(element);
      },
      attr: (name, value) => {
        if (value === undefined) {
          return svgElement.getAttribute(name);
        }
        svgElement.setAttribute(name, value);
        return this;
      },
      style: (name, value) => {
        if (value === undefined) {
          return svgElement.style.getPropertyValue(name);
        }
        svgElement.style.setProperty(name, value);
        return this;
      },
      selectAll: (selector) => {
        const elements = svgElement.querySelectorAll(selector);
        return Array.from(elements).map(el => this.createElementWrapper(el));
      },
      node: () => svgElement
    };
  }

  /**
   * Create element wrapper with D3-like methods
   * @param {Element} element - DOM element
   * @returns {Object} - Wrapper with D3-like methods
   */
  createElementWrapper(element) {
    return {
      attr: (name, value) => {
        if (value === undefined) {
          return element.getAttribute(name);
        }
        element.setAttribute(name, value);
        return this;
      },
      style: (name, value) => {
        if (value === undefined) {
          return element.style.getPropertyValue(name);
        }
        element.style.setProperty(name, value);
        return this;
      },
      text: (value) => {
        if (value === undefined) {
          return element.textContent;
        }
        element.textContent = value;
        return this;
      },
      append: (tagName) => {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        element.appendChild(child);
        return this.createElementWrapper(child);
      },
      node: () => element,
      on: (event, handler) => {
        element.addEventListener(event, handler);
        return this;
      }
    };
  }

  /**
   * Get chart dimensions based on container size
   * @param {Element} container - DOM container
   * @returns {Object} - Width, height, and margins
   */
  getChartDimensions(container) {
    const containerRect = container.getBoundingClientRect();
    const width = Math.max(400, containerRect.width || 600);
    const height = Math.max(300, Math.min(400, width * 0.6));

    return {
      width,
      height,
      margin: { top: 40, right: 40, bottom: 60, left: 60 }
    };
  }

  /**
   * Create scale function
   * @param {string} type - 'linear' or 'band'
   * @param {Array} domain - Domain values
   * @param {Array} range - Range values
   * @param {number} padding - Padding for band scales
   * @returns {Function} - Scale function
   */
  createScale(type, domain, range, padding = 0) {
    if (type === 'linear') {
      const scale = (value) => {
        const normalized = (value - domain[0]) / (domain[1] - domain[0]);
        return range[0] + normalized * (range[1] - range[0]);
      };
      scale.domain = (newDomain) => {
        if (newDomain) {
          domain = newDomain;
          return scale;
        }
        return domain;
      };
      scale.range = () => range;
      scale.invert = (pixel) => {
        const normalized = (pixel - range[0]) / (range[1] - range[0]);
        return domain[0] + normalized * (domain[1] - domain[0]);
      };
      return scale;
    } else if (type === 'band') {
      const step = (range[1] - range[0]) / domain.length;
      const bandwidth = step * (1 - padding);
      const paddingOuter = step * padding / 2;

      const scale = (value) => {
        const index = domain.indexOf(value);
        return index >= 0 ? range[0] + paddingOuter + index * step : null;
      };
      scale.bandwidth = () => bandwidth;
      scale.domain = () => domain;
      scale.range = () => range;
      return scale;
    }
  }

  /**
   * Draw chart axes
   * @param {Object} svg - SVG wrapper
   * @param {Function} xScale - X scale function
   * @param {Function} yScale - Y scale function
   * @param {number} width - Chart width
   * @param {number} height - Chart height
   * @param {Object} margin - Chart margins
   * @param {string} type - Chart type for custom axis formatting
   */
  drawAxes(svg, xScale, yScale, width, height, margin, type = 'default') {
    // X axis
    const xAxis = svg.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`);

    // Y axis
    const yAxis = svg.append('g')
      .attr('transform', `translate(${margin.left}, 0)`);

    // Draw axis lines
    xAxis.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', this.colors.text)
      .attr('stroke-width', 1);

    yAxis.append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', this.colors.text)
      .attr('stroke-width', 1);

    // Add tick marks and labels
    this.addAxisTicks(xAxis, xScale, 'x', type);
    this.addAxisTicks(yAxis, yScale, 'y', type);
  }

  /**
   * Add axis ticks and labels
   * @param {Object} axis - Axis group
   * @param {Function} scale - Scale function
   * @param {string} orientation - 'x' or 'y'
   * @param {string} type - Chart type
   */
  addAxisTicks(axis, scale, orientation, type) {
    const domain = scale.domain();
    let tickValues;

    if (orientation === 'x') {
      if (type === 'comparison' || type === 'confidence') {
        tickValues = domain;
      } else {
        // Linear scale - create reasonable tick values
        const range = domain[1] - domain[0];
        const tickCount = Math.min(8, Math.max(3, Math.floor(range / 100)));
        tickValues = [];
        for (let i = 0; i <= tickCount; i++) {
          tickValues.push(domain[0] + (i / tickCount) * range);
        }
      }
    } else {
      // Y axis - percentage values
      if (type === 'confidence') {
        tickValues = domain;
      } else {
        tickValues = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
      }
    }

    tickValues.forEach(value => {
      const pos = scale(value);
      if (pos === null) return;

      // Create tick mark
      const tick = axis.append('g');

      if (orientation === 'x') {
        tick.append('line')
          .attr('x1', pos)
          .attr('x2', pos)
          .attr('y1', 0)
          .attr('y2', 6)
          .attr('stroke', this.colors.text);

        tick.append('text')
          .attr('x', pos)
          .attr('y', 20)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('fill', this.colors.text)
          .text(this.formatTickValue(value, orientation, type));
      } else {
        tick.append('line')
          .attr('x1', -6)
          .attr('x2', 0)
          .attr('y1', pos)
          .attr('y2', pos)
          .attr('stroke', this.colors.text);

        tick.append('text')
          .attr('x', -10)
          .attr('y', pos + 4)
          .attr('text-anchor', 'end')
          .attr('font-size', '12px')
          .attr('fill', this.colors.text)
          .text(this.formatTickValue(value, orientation, type));
      }
    });
  }

  /**
   * Format tick values for display
   * @param {*} value - Tick value
   * @param {string} orientation - 'x' or 'y'
   * @param {string} type - Chart type
   * @returns {string} - Formatted value
   */
  formatTickValue(value, orientation, type) {
    if (typeof value === 'string') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    if (orientation === 'y' && type !== 'confidence') {
      return (value * 100).toFixed(0) + '%';
    }

    if (type === 'confidence') {
      return (value * 100).toFixed(1) + '%';
    }

    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }

    return Math.round(value).toString();
  }

  /**
   * Draw grid lines
   * @param {Object} svg - SVG wrapper
   * @param {Function} xScale - X scale
   * @param {Function} yScale - Y scale
   * @param {number} width - Chart width
   * @param {number} height - Chart height
   * @param {Object} margin - Chart margins
   */
  drawGrid(svg, xScale, yScale, width, height, margin) {
    const grid = svg.append('g')
      .attr('class', 'grid')
      .style('opacity', '0.3');

    // Horizontal grid lines (for Y values)
    const yTicks = [0.2, 0.4, 0.6, 0.8];
    yTicks.forEach(value => {
      const y = yScale(value);
      grid.append('line')
        .attr('x1', margin.left)
        .attr('x2', width - margin.right)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', this.colors.grid)
        .attr('stroke-dasharray', '2,2');
    });
  }

  /**
   * Group convergence data by strategy
   * @param {Array} data - Raw convergence data
   * @returns {Object} - Data grouped by strategy
   */
  groupDataByStrategy(data) {
    const grouped = {};
    data.forEach(point => {
      if (!grouped[point.strategy]) {
        grouped[point.strategy] = [];
      }
      grouped[point.strategy].push(point);
    });
    return grouped;
  }

  /**
   * Draw theoretical probability lines
   * @param {Object} svg - SVG wrapper
   * @param {Function} xScale - X scale
   * @param {Function} yScale - Y scale
   * @param {Object} groupedData - Data grouped by strategy
   */
  drawTheoreticalLines(svg, xScale, yScale, groupedData) {
    const theoretical = {
      stay: 1/3,
      switch: 2/3
    };

    Object.keys(groupedData).forEach(strategy => {
      const y = yScale(theoretical[strategy]);
      const domain = xScale.domain();

      svg.append('line')
        .attr('x1', xScale(domain[0]))
        .attr('x2', xScale(domain[1]))
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', this.colors.theoretical)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .style('opacity', '0.7');
    });
  }

  /**
   * Draw convergence lines
   * @param {Object} svg - SVG wrapper
   * @param {Function} xScale - X scale
   * @param {Function} yScale - Y scale
   * @param {Object} groupedData - Data grouped by strategy
   * @param {boolean} animated - Whether to animate the lines
   */
  drawConvergenceLines(svg, xScale, yScale, groupedData, animated = false) {
    Object.entries(groupedData).forEach(([strategy, data], index) => {
      if (data.length === 0) return;

      const line = svg.append('path')
        .attr('fill', 'none')
        .attr('stroke', this.colors[strategy])
        .attr('stroke-width', 3)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round');

      const pathData = this.createLinePath(data, xScale, yScale);

      if (animated) {
        // Animate line drawing
        const totalLength = this.getPathLength(pathData);
        line.attr('d', pathData)
          .style('stroke-dasharray', totalLength + ' ' + totalLength)
          .style('stroke-dashoffset', totalLength)
          .style('transition', `stroke-dashoffset ${this.animations.duration}ms ${this.animations.easing}`)
          .style('stroke-dashoffset', '0');
      } else {
        line.attr('d', pathData);
      }
    });
  }

  /**
   * Create line path data
   * @param {Array} data - Data points
   * @param {Function} xScale - X scale
   * @param {Function} yScale - Y scale
   * @returns {string} - SVG path data
   */
  createLinePath(data, xScale, yScale) {
    return data.map((point, index) => {
      const x = xScale(point.gameNumber);
      const y = yScale(point.winRate);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  /**
   * Estimate path length (simplified)
   * @param {string} pathData - SVG path data
   * @returns {number} - Estimated length
   */
  getPathLength(pathData) {
    // Simple estimation based on path commands
    const commands = pathData.split(/[ML]/).filter(cmd => cmd.trim());
    return commands.length * 10; // Rough approximation
  }

  /**
   * Add chart legend
   * @param {Object} svg - SVG wrapper
   * @param {number} width - Chart width
   * @param {Object} margin - Chart margins
   * @param {Array} strategies - List of strategies
   * @param {boolean} showTheoretical - Whether to show theoretical line in legend
   */
  addLegend(svg, width, margin, strategies, showTheoretical = false) {
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - margin.right - 120}, ${margin.top})`);

    let yPos = 0;

    strategies.forEach(strategy => {
      const item = legend.append('g')
        .attr('transform', `translate(0, ${yPos})`);

      item.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', this.colors[strategy])
        .attr('stroke-width', 3);

      item.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .attr('font-size', '12px')
        .attr('fill', this.colors.text)
        .text(strategy.charAt(0).toUpperCase() + strategy.slice(1));

      yPos += 20;
    });

    if (showTheoretical) {
      const theoreticalItem = legend.append('g')
        .attr('transform', `translate(0, ${yPos})`);

      theoreticalItem.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', this.colors.theoretical)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      theoreticalItem.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .attr('font-size', '12px')
        .attr('fill', this.colors.text)
        .text('Theoretical');
    }
  }

  /**
   * Add chart title and axis labels
   * @param {Object} svg - SVG wrapper
   * @param {number} width - Chart width
   * @param {number} height - Chart height
   * @param {Object} margin - Chart margins
   * @param {Object} labels - Title and axis labels
   */
  addChartLabels(svg, width, height, margin, labels) {
    // Title
    if (labels.title) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', this.colors.text)
        .text(labels.title);
    }

    // X axis label
    if (labels.xLabel) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', this.colors.text)
        .text(labels.xLabel);
    }

    // Y axis label
    if (labels.yLabel) {
      svg.append('text')
        .attr('x', 15)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', this.colors.text)
        .attr('transform', `rotate(-90, 15, ${height / 2})`)
        .text(labels.yLabel);
    }
  }

  /**
   * Add interactivity to charts
   * @param {string} containerId - Chart container ID
   */
  addChartInteractivity(containerId) {
    const chart = this.charts[containerId];
    if (!chart) return;

    // Add tooltip functionality would go here
    // For now, we'll keep it simple with basic hover effects

    const container = document.getElementById(containerId);
    container.style.position = 'relative';
  }

  /**
   * Prepare comparison data for bar chart
   * @param {Object} data - Statistical analysis data
   * @returns {Array} - Comparison data
   */
  prepareComparisonData(data) {
    const comparison = [];

    if (data.descriptive) {
      Object.entries(data.descriptive).forEach(([strategy, stats]) => {
        if (strategy !== 'comparison') {
          comparison.push({
            strategy,
            observed: stats.observedWinRate,
            theoretical: stats.theoreticalWinRate,
            deviation: stats.absoluteDeviation
          });
        }
      });
    }

    return comparison;
  }

  /**
   * Draw comparison bars
   * @param {Object} svg - SVG wrapper
   * @param {Function} xScale - X scale
   * @param {Function} yScale - Y scale
   * @param {Array} data - Comparison data
   * @param {Object} options - Chart options
   */
  drawComparisonBars(svg, xScale, yScale, data, options) {
    const barWidth = xScale.bandwidth() / 2;

    data.forEach(item => {
      const x = xScale(item.strategy);

      // Observed bar
      svg.append('rect')
        .attr('x', x)
        .attr('y', yScale(item.observed))
        .attr('width', barWidth)
        .attr('height', yScale(0) - yScale(item.observed))
        .attr('fill', this.colors[item.strategy])
        .attr('opacity', 0.8);

      // Theoretical bar
      svg.append('rect')
        .attr('x', x + barWidth)
        .attr('y', yScale(item.theoretical))
        .attr('width', barWidth)
        .attr('height', yScale(0) - yScale(item.theoretical))
        .attr('fill', this.colors.theoretical)
        .attr('opacity', 0.6);

      // Value labels
      svg.append('text')
        .attr('x', x + barWidth / 2)
        .attr('y', yScale(item.observed) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', this.colors.text)
        .text((item.observed * 100).toFixed(1) + '%');

      svg.append('text')
        .attr('x', x + barWidth * 1.5)
        .attr('y', yScale(item.theoretical) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', this.colors.text)
        .text((item.theoretical * 100).toFixed(1) + '%');
    });
  }

  /**
   * Add comparison legend
   * @param {Object} svg - SVG wrapper
   * @param {number} width - Chart width
   * @param {Object} margin - Chart margins
   */
  addComparisonLegend(svg, width, margin) {
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - margin.right - 100}, ${margin.top})`);

    // Observed
    const observed = legend.append('g');
    observed.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', this.colors.stay)
      .attr('opacity', 0.8);
    observed.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('font-size', '12px')
      .attr('fill', this.colors.text)
      .text('Observed');

    // Theoretical
    const theoretical = legend.append('g')
      .attr('transform', 'translate(0, 20)');
    theoretical.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', this.colors.theoretical)
      .attr('opacity', 0.6);
    theoretical.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('font-size', '12px')
      .attr('fill', this.colors.text)
      .text('Theoretical');
  }

  /**
   * Prepare confidence interval data
   * @param {Object} data - Statistical data
   * @returns {Array} - Confidence data
   */
  prepareConfidenceData(data) {
    const confidence = [];

    if (data.inferential) {
      Object.entries(data.inferential).forEach(([strategy, stats]) => {
        const ci = stats.confidenceIntervals.ci95;
        confidence.push({
          strategy,
          observed: data.descriptive[strategy].observedWinRate,
          theoretical: data.descriptive[strategy].theoreticalWinRate,
          lower: ci.lower,
          upper: ci.upper,
          marginOfError: ci.marginOfError
        });
      });
    }

    return confidence;
  }

  /**
   * Clear all charts
   */
  clearAllCharts() {
    Object.keys(this.charts).forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
    });
    this.charts = {};
  }

  /**
   * Resize all charts (for responsive behavior)
   */
  resizeAllCharts() {
    // In a real implementation, you'd recalculate dimensions and redraw
    // For now, the viewBox handles basic responsiveness
  }
}

export default SimulationCharts;