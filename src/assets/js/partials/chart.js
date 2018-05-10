/*
 * Copyright (c) 2018 Elias Häußler <mail@elias-haeussler.de> (www.elias-haeussler.de).
 */

/**
 * Chart visualization
 * Contains all relevant information and functions in relation to the chart visualization with the D3 framework.
 */
export class Chart
{
  constructor()
  {
    /**
     * Chart object
     * @type {{}}
     * @private
     */
    this._chart = {};

    /**
     * Total width
     * @type {number}
     * @private
     */
    this._w = 700;

    /**
     * Total height
     * @type {number}
     * @private
     */
    this._h = 500;

    /**
     * Margins
     * @type {{top: number, right: number, bottom: number, left: number}}
     * @private
     */
    this._margin = {
      top: 50,
      right: 30,
      bottom: 120,
      left: 80
    };

    /**
     * Chart width
     * @type {number}
     * @private
     */
    this._width = this._w - this._margin.left - this._margin.right;

    /**
     * Chart height
     * @type {number}
     * @private
     */
    this._height = this._h - this._margin.top - this._margin.bottom;

    /**
     * Data from source
     * @type {Array}
     * @private
     */
    this._data = [];

    /**
     * Currently selected x key
     * @type {null}
     * @private
     */
    this._key_x = null;

    /**
     * Currently selected y key
     * @type {null}
     * @private
     */
    this._key_y = null;

    /**
     * Reference to svg element
     * @type {null}
     * @private
     */
    this._svg = null;

    /**
     * Chart title of current selected data (contains the name of the current selected state)
     * @type {string}
     * @private
     */
    this._title = null;

    /**
     * Chart subtitle (contains the name of the current selected keys)
     * @type {string}
     * @private
     */
    this._subtitle = null;

    // Chart path and line
    this._path = null;
    this._line = null;

    /**
     * Graphics element of chart
     * @type {null}
     * @private
     */
    this._g = null;

    /**
     * Graphics element of x axis
     * @type {null}
     * @private
     */
    this._gX = null;

    /**
     * Graphics element of y axis
     * @type {null}
     * @private
     */
    this._gY = null;

    /**
     * x points of data
     * @type {null}
     * @private
     */
    this._x = null;

    /**
     * y points of data
     * @type {null}
     * @private
     */
    this._y = null;

    /**
     * x axis
     * @type {null}
     * @private
     */
    this._xAxis = null;

    /**
     * y axis
     * @type {null}
     * @private
     */
    this._yAxis = null;
  }

  /**
   * Define chart projection settings
   * Creates the line generator for the chart and appends the path to the main graphics element.
   */
  defineSettings()
  {
    // Chart line generator
    if (!this._line)
      this._line = d3.line()
        .x(d => { return this._x(d.x); })
        .y(d => { return this._y(d.y); });

    // Chart path element
    if (!this._path) {
      this._path = this._g.append("path");
    }
  }

  /**
   * Read data and render chart.
   * Reads the given CSV renders the chart, based on the given datasets. Also defines the listener on user interactions.
   * @param value
   */
  render(value)
  {
    d3.csv(this._data).then(data => {

      // Set title
      this._title.text(value);

      // Set subtitle
      this._subtitle.text(this._key_x.replace(" ", " | "));

      // Get and save values
      let _d = [], i = 0;
      data.forEach(d => {
        if (d.state === value) {
          _d.push([]);
          _d[i].x = d[""];
          _d[i++].y = +d[this._key_x];
        }
      });

      // Scale the range of the data
      this._x = d3.scalePoint()
        .range([0, this._width]);
      this._y = d3.scaleLinear()
        .domain([d3.min(data, d => { return +d[this._key_x]; }),
          d3.max(data, d => { return +d[this._key_x]; })])
        .rangeRound([this._height, 0]);

      // Chart X axis
      if (!this._xAxis) {
        this._xAxis = d3.axisBottom(this._x);
      }

      // Chart Y axis
      if (!this._yAxis) {
        this._yAxis = d3.axisLeft()
          .ticks(6);
      }

      // Set axes domains
      this._x.domain(_d.map(d => d.x));

      // Render x axis
      this._gX.call(this._xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attrs({
          "class": d => "chart__text" + (d === this._key_y ? " chart__text--active" : ""),
          "dx": "-1.4em",
          "dy": ".3em",
          "transform": "rotate(-70)"
        });

      // Render y axis
      this._yAxis.scale(this._y);
      this._gY.call(this._yAxis)
        .selectAll("text")
        .attr("class", "chart__text");

      // Add line to chart
      this._g.selectAll("path")
        .transition()
        .attrs({
          "class": "chart__line",
          "d": this._line(_d)
        });

      // Add grid lines
      d3.selectAll("g.chart__axis--y g.tick")
        .selectAll(".chart__line--grid")
        .data([{}])
        .enter()
        .append("line")
        .attrs({
          "class": "chart__line--grid",
          "x1": 0,
          "y1": 0,
          "x2": this._width,
          "y2": 0
        });

      // Edit data
      let tmp = [];
      data.forEach(d => {
        if (d.state === value) {
          tmp.push({
            x: this._x(d[""]),
            y: this._y(d[this._key_x]),
            active: d[""] === this._key_y
          });
        }
      });

      // Render dots
      this._g.selectAll("circle")
        .data(tmp)
        .enter()
        .append("circle");

      this._g.selectAll("circle")
        .data(tmp)
        .transition()
        .attrs({
          "cx": d => d.x,
          "cy": d => d.y,
          "r": 4.5,
          "class": d => "chart__dot" + (d.active ? " chart__dot--active" : "")
        });
    });
  }

  /**
   * Define settings and render chart
   * Creates the svg element and the graphics elements if they do not exist, create the chart title element and defines the map projection settings.
   */
  init()
  {
    // Create svg chart element
    if (this._svg == null) {
      this._svg = d3.select(Global.CHART_SELECTOR)
        .append("svg")
        .attrs({
          "width": this._width + this._margin.left + this._margin.right,
          "height": this._height + this._margin.top + this._margin.bottom
        })
        .style("visibility", "hidden");
    }

    // Create svg chart axis graphics element
    if (this._gX == null) {
      this._gX = this._svg.append("g")
        .attrs({
          "class": "chart__axis chart__axis--x",
          "transform": "translate(" + this._margin.left + ", " + (this._height + this._margin.top) + ")"
        });
    }

    if (this._gY == null) {
      this._gY = this._svg.append("g")
        .attrs({
          "class": "chart__axis chart__axis--y",
          "transform": "translate(" + this._margin.left + ", " + this._margin.top + ")"
        });
    }

    // Create svg chart graphics element
    if (this._g == null) {
      this._g = this._svg.append("g")
        .attr("transform", "translate(" + this._margin.left + "," + this._margin.top + ")");
    }

    // Create title text
    if (this._title == null) {
      this._title = this._svg.append("text")
        .attrs({
          "x": this._margin.left + this._width / 2,
          "y": 15,
          "class": "chart__title"
        });
    }

    // Create subtitle text
    if (this._subtitle == null) {
      this._subtitle = this._svg.append("text")
        .attrs({
          "x": this._margin.left + this._width / 2,
          "y": 40,
          "class": "chart__subtitle"
        });
    }

    // Define Settings
    this.defineSettings();

    return this;
  }

  /**
   * Get or set data
   * @param d
   * @returns {*}
   */
  data(d)
  {
    if (!arguments.length) return this._data;
    this._data = d;
    return this;
  }

  /**
   * Get or set x key
   * @param k
   * @returns {*}
   */
  key_x(k)
  {
    if (!arguments.length) return this._key_x;
    this._key_x = k;
    return this;
  }

  /**
   * Get or set y key
   * @param k
   * @returns {*}
   */
  key_y(k)
  {
    if (!arguments.length) return this._key_y;
    this._key_y = k;
    return this;
  }

  /**
   * Set style
   * @param setting
   * @param value
   * @returns {*}
   */
  style(setting, value)
  {
    if (arguments.length === 1) return this._svg.style(setting);
    this._svg.style(setting, value);
    return this;
  }
}
