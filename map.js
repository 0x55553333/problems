var svg = d3.select("svg");
var svgGroup = svg.append("g");

var nodes, edges;
function strEndsWith(str, suffix) {
    return str.match(suffix+"$")==suffix;
}

function autoResize(element){
    var newheight;
    var newwidth;
    
    newheight = element.contentWindow.document.body.scrollHeight;
    newwidth = element.contentWindow.document.body.scrollWidth;
    
    element.height= (newheight) + "px";
    element.width= (newwidth) + "px";
}

function draw(nodeData, edgeData) {
  // D3 doesn't appear to like rebinding with the same id but a new object,
  // so for now we remove everything.
  svgGroup.selectAll("*").remove();

  nodes = svgGroup
    .selectAll("g .node")
    .data(nodeData, function(d) { return d.id; });

  var nodeEnter = nodes
    .enter()
    .append("g")
      .attr("class", "node")
      .attr("id", function(d) { return "node-" + d.id; })
      .each(function(d) { d.nodePadding = 10; });
  nodeEnter.append("rect");
  addLabels(nodeEnter);
  nodes.exit().remove();

  edges = svgGroup
    .selectAll("g .edge")
    .data(edgeData, function(d) { return d.id; });

  var edgeEnter = edges
    .enter()
    .append("g")
      .attr("class", "edge")
      .attr("id", function(d) { return "edge-" + d.id; })
      .each(function(d) { d.nodePadding = 0; })
  edgeEnter
    .append("path")
      .attr("marker-end", "url(#arrowhead)");
  addLabels(edgeEnter);
  edges.exit().remove();

  recalcLabels();

  // Add zoom behavior to the SVG canvas
  svgGroup.attr("transform", "translate(5, 5)");
  svg.call(d3.behavior.zoom().on("zoom", function redraw() {
    svgGroup.attr("transform",
          "translate(" + d3.event.translate + ")"
          + " scale(" + d3.event.scale + ")");
  }));

  // Run the actual layout
  var layout = dagre.layout()
    .nodes(nodeData)
    .edges(edgeData)
    .debugLevel(2)
    .run();
  
  //var tooltip = document.getElementById("edgeDescription");
  var tooltip = d3.select("body")
    .append("iframe")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .property("id", "edgeDescription")

 //   .style("background-color", "white");


 // var tooltipd3 = d3.select("edgeDescription");
  console.log(tooltip);
  nodes.on('click', function(d){set_description(d.id)});
  edges.on('click', function(d){set_description(d.id, true)});
  edges.on('mouseover', function(d){
                                    if(strEndsWith(tooltip.property("src"),deslink(d.id, true))){
                                      tooltip.style("visibility", "visible")
                                    }else{
                                      tooltip.property("src",deslink(d.id, true));
                                      tooltip.style("visibility", "visible");
                                    }
                                  })
  edges.on("mousemove", function(){return tooltip.style("top",
    (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
  edges.on("mouseout", function(){return tooltip.style("visibility", "hidden");});
  // Ensure that we have at least two points between source and target
  edges.each(function(d) { ensureTwoControlPoints(d);});

  // Re-render
  update();
}

function addLabels(selection) {
  var labelGroup = selection
    .append("g")
      .attr("class", "label");
  labelGroup.append("rect");

  var foLabel = labelGroup
    .filter(function(d) { return d.label[0] === "<"; })
    .append("foreignObject")
      .attr("class", "htmllabel");

  foLabel
    .append("xhtml:div")
      .style("float", "left");

  labelGroup
    .filter(function(d) { return d.label[0] !== "<"; })
    .append("text")
}

function recalcLabels() {
  var labelGroup = svgGroup.selectAll("g.label");

  var foLabel = labelGroup
    .selectAll(".htmllabel")
    // TODO find a better way to get the dimensions for foriegnObjects
    .attr("width", "100000");

  foLabel
    .select("div")
      .html(function(d) { return d.label; })
      .each(function(d) {
        d.width = this.clientWidth;
        d.height = this.clientHeight;
        d.nodePadding = 0;
      });

  foLabel
    .attr("width", function(d) { return d.width; })
    .attr("height", function(d) { return d.height; });

  var textLabel = labelGroup
    .filter(function(d) { return d.label[0] !== "<"; });

  textLabel
    .select("text")
      .attr("text-anchor", "left")
        .append("tspan")
        .attr("dy", "1em")
        .text(function(d) { return d.label || " "; });

  labelGroup
    .each(function(d) {
      var bbox = this.getBBox();
      d.bbox = bbox;
      d.width = bbox.width + 2 * d.nodePadding;
      d.height = bbox.height + 2 * d.nodePadding;
    });
}

function ensureTwoControlPoints(d) {
  var points = d.dagre.points;
  if (!points.length) {
    var s = d.source.dagre;
    var t = d.target.dagre;
    points.push({ x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 });
  }

  if (points.length === 1) {
    points.push({ x: points[0].x, y: points[0].y });
  }
}

function update() {
  nodes
    .attr("transform", function(d) {
      return "translate(" + d.dagre.x + "," + d.dagre.y +")"; })
    .selectAll("g.node rect")
      .attr("x", function(d) { return -(d.bbox.width / 2 + d.nodePadding); })
      .attr("y", function(d) { return -(d.bbox.height / 2 + d.nodePadding); })
      .attr("width", function(d) { return d.width; })
      .attr("height", function(d) { return d.height; });

  edges
    .selectAll("path")
    .attr("d", function(d) {
      var points = d.dagre.points.slice(0);
      var source = dagre.util.intersectRect(d.source.dagre, points[0]);
      var target = dagre.util.intersectRect(d.target.dagre, points[points.length - 1]);
      points.unshift(source);
      points.push(target);
      return d3.svg.line()
        .x(function(e) { return e.x; })
        .y(function(e) { return e.y; })
        .interpolate("linear")
        (points);
    });

  edges
    .selectAll("circle")
    .attr("r", 5)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });

  svgGroup
    .selectAll("g.label rect")
    .attr("x", function(d) { return -d.nodePadding; })
    .attr("y", function(d) { return -d.nodePadding; })
    .attr("width", function(d) { return d.width; })
    .attr("height", function(d) { return d.height; });

  nodes
    .selectAll("g.label")
    .attr("transform", function(d) { return "translate(" + (-d.bbox.width / 2) + "," + (-d.bbox.height / 2) + ")"; })

  edges
    .selectAll("g.label")
    .attr("transform", function(d) {
      var points = d.dagre.points;
      var x = (points[0].x + points[1].x) / 2;
      var y = (points[0].y + points[1].y) / 2;
      return "translate(" + (-d.bbox.width / 2 + x) + "," + (-d.bbox.height / 2 + y) + ")";
    });
}

var nodeCache = {},
    edgeCache = {};
function tryDraw(inputGraph) {
  var result;
      result = dagre.dot.toObjects(inputGraph);
      result.edges.forEach(function(e) { if (!e.label) { e.label = ""; } });

    if (result) {
      result.nodes.forEach(function(node) {
        node.inEdges = [];
        node.outEdges = [];
      });
      result.edges.forEach(function(edge) {
        edge.source.outEdges.push(edge);
        edge.target.inEdges.push(edge);
      });

      draw(result.nodes, result.edges);
    }
}
var client = new XMLHttpRequest();
client.open('GET', '/relation.dot');
client.onreadystatechange = function() {
  tryDraw(client.responseText);
}
client.send();