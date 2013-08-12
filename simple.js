simple = (function () {
    var self = {};
    var height = 400, width = 600;

    offset = 50;

    var env = {};
    self.env = env;
    env.O = {bases: []};
    env.F = {bases: [env.O]};
    env.E = {bases: [env.O]};
    env.D = {bases: [env.O]};
    env.C = {bases: [env.D, env.F]};
    env.B = {bases: [env.D, env.E]};
    env.A = {bases: [env.B, env.C]};
    var determine_rank = function (c) {
        if (!c.bases.length)
            return 0
        return 1 + Math.min.apply(null, c.bases.map(determine_rank));
    };

    var classes = [], edges = [], c;
    for (var key in env) {
        if (env.hasOwnProperty(key)) {
            classes.push(c = env[key]);
            c.rank = determine_rank(c);
            c.bases.forEach(function (b) {
                edges.push({source: b, target: c});
            });
        }
    }


    classes.forEach(function (c) {
        c.rank = offset + c.rank * height / classes.length
    });

    var add_arrow = function (args) {
        args.svg.append('svg:defs').append('svg:marker')
            .attr('id', args.id)
            .attr('viewBox', args.viewBox || '0 -5 10 10')
            .attr('refX', args.refX || 6)
            .attr('markerWidth', args.markerWidth || 5)
            .attr('markerHeight', args.markerHeight || 5)
            .attr('orient', args.orient || 'auto')
            .append('svg:path')
            .attr('d', args.d || 'M0,-5L10,0L0,5')
            .attr('fill', args.fill || "#000");
    };

    self.svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);
    add_arrow({svg: self.svg, id: 'end-arrow'})

    var link = self.svg.selectAll('line').data(edges);
    var circle = self.svg.selectAll('circle').data(classes);

    link.enter().append('line')
        .attr('stroke', 'black')
        .attr('stroke-width', '4');

    circle.enter().append('circle')
        .style('stroke', 'black')
        .style('fill', 'white')
        .attr('r', 10);

    self.force = d3.layout.force()
        .nodes(classes)
        .links(edges)
        .size([width, height])
        .charge(-1000)
        .linkDistance(10)
        .on('tick', function (e) {


            link.attr('x1', function(d) { return d.source.x; });
            link.attr('y1', function(d) { return d.source.y; });
            link.attr('x2', function(d) { return d.target.x; });
            link.attr('y2', function(d) { return d.target.y; });
            link.attr('marker-end', 'url(#end-arrow)');

            circle.attr('cx', function (d) { return d.x += (width / 2 - d.x) * e.alpha; });
            circle.attr('cy', function (d) { return d.y += (d.rank - d.y) * e.alpha; });
        }).start();
    return self;
})();
