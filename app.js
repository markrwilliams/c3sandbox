// set up SVG for D3
var width  = 640,
height = 480;


var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.


function draw_path(nodes) {
    var prev = nodes[0], i;
    var edges = [];
    for (i = 1; i < nodes.length; i++) {
        cur = nodes[i];
        edges.push({source: prev, target: cur, left: false, right: true,
                    linearized: true});
        prev = cur;
    }
    return edges;
}

function calculate_links(classes) {
    return nodes.reduce(function (edges, cls) {
        cls.bases.forEach(function(b) {
            edges.push({source: b, target: cls, left: false, right: true});
        });
        return edges;
    }, []);
}


var nodes = [], links = [], node_env = {}, force;


// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow-linearized')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 2)
    .attr('markerHeight', 2)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', 'red');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow-linearized')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'red');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
circle = svg.append('svg:g').selectAll('g');

// update force layout (called automatically each iteration)
function tick(e) {
    //  draw directed edges with proper padding from node centers
    path.attr('d', function(d) {
        var deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = d.left ? 22 : 20,
        targetPadding = d.right ? 22 : 20,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);
        if (d.linearized)
            return 'M' + sourceX + ',' + sourceY + 'A' + dist + "," + dist + " 0 0,1 " + targetX + ',' + targetY;
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });


    circle.attr('transform', function(d) {
        d.y += (d.rank - d.y) * e.alpha;
        d.x += ((width / 2) - d.x) * e.alpha;
        // console.log(d.y);
        return 'translate(' + d.x + ',' + d.y + ')';
    });

}

// update graph (called when needed)
function restart() {
    force = d3.layout.force()
        .nodes(nodes)
        .gravity(0)
        .links(links)
        .size([width, height])
        .linkStrength(function (l) { return l.linearized ? 0 : 1; })
        .linkDistance(20)
        .charge(-5000)
        .on('tick', tick);

    // path (link) group
    path = path.data(links);

    // add new links
    path.enter().append('svg:path')
        .attr('class', function(d) {
            return d.linearized ? "linearized" : "link";
        })
        .style('marker-start', function(d) {
            var linearization = d.linearized ? '-linearized' : '';
            return d.left ? 'url(#start-arrow' + linearization + ')' : '';
        }).style('marker-end', function(d) {
            var linearization = d.linearized ? '-linearized' : '';
            return d.right ? 'url(#end-arrow' + linearization + ')' : '';
        });

    // remove old links
    path.exit().remove();


    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes, function(d) { return d.id; });

    // update existing nodes
    circle.selectAll('circle')
        .style('fill', 'white');


    // add new nodes
    var g = circle.enter().append('svg:g');

    g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', 20)
        .style('fill', function(d) { return 'white'; })
        .style('stroke', function(d) { return d3.rgb('white').darker().toString(); })
        .on("mousedown", function (d) {
            var cls = node_env[d.id];
            var linearization = c3(cls);

            links = calculate_links(nodes);

            document.getElementById("linearization").value = linearization.map(function (c) {
                return c.id;
            }).join(' -> ');

            links.push.apply(links, draw_path(linearization));
            restart();
            return false;
        });

    // show node IDs
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'id')
        .text(function(d) { return d.id; });

    // remove old nodes
    circle.exit().remove();

    var safety = 0;

    // set the graph in motion
    force.start();
    while (force.alpha() > 0.05) {
        force.tick();
        if (safety++ > 500) {
            break;
        }
    }

}
function linearize_from(cls) {
    links = calculate_links(nodes);
    links.push.apply(links, draw_path(linearization));
    restart();
}
