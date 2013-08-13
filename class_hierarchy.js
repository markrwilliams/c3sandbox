var class_hierarchy = (function () {

    var ClassHierarchy = function () {
        var svg,
            width = 800, height = 600,
            _classes = [],
            _edges = [],
            _env = {},
            _force,             // d3 force layout object
            path,               // path along which to draw graph
            circle,             // class circle group
            radius = 25,        // radius of class circles
            darker_white = d3.rgb('white').darker().toString(),
            last_linearization = [],
            on_linearization = null,
            self = {};           // returning this


        var init = function(args) {
            width = args.width || width, height = args.height || height,
            radius = args.radius || radius;
            on_linearization = args.on_linearization || function () {};

            svg = d3.select(args.parent)
                .append('svg')
                .attr('id', args.id)
                .attr('width', width)
                .attr('height', height);

            add_arrow({svg: svg, id: 'end-arrow'});
            add_arrow({svg: svg, id: 'end-arrow-linearized',
                            markerWidth: 5,
                            markerHeight: 5,
                            fill: 'red'});

            path = svg.selectAll('path'),
            circle = svg.selectAll('circle').data(_classes);
            return self;
        };


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

        var edges = function (args) {
            if (!args)
                return _edges;

            _edges = args.classes.reduce(
                function (sofar, cls) {
                    cls.bases.forEach(
                        function(b) {
                            sofar.push({source: b, target: cls});
                        });
                    return sofar;
                },
                []);

            return _edges;
        };

        var force = function () {
            return _force || (_force = d3.layout.force()
                              .nodes(_classes)
                              .gravity(0)     // only rank attraction
                              .links(_edges)
                              .size([width, height])
                              .linkStrength(function (l) { return l.linearized ? 0 : 1; })
                              .linkDistance(20) // a very short link distance...
                              .charge(-5000)    // ...and a very negative charge...
                              .on('tick', tick)); // ..creates a
                                                  // tension that
                                                  // ensures the graph
                                                  // is horizontally
                                                  // (and predictably)
                                                  // spread/ along
                                                  // class ranks
        };

        var linearization = function (args) {
            return last_linearization;
        };

        var env = function (args) {
            if (!(args && args.env))
                return _env;
            return (_env = args.env);
        };

        var classes = function (args) {
            if (!(args && args.classes))
                return _classes;
            _classes = args.classes;
            _env = {};

            _classes.forEach(
                function (cls) {
                    _env[cls.name] = cls;
                });

            edges({classes: _classes});
            return _classes;
        };

        // graph layout code
        var tick = function (e) {
            // draw padded edge with a curve if it's linearized and
            // straight otherwise
            path.attr('d', function(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dist = Math.sqrt(dx * dx + dy * dy),
                    x = dx / dist,
                    y = dy / dist,
                    source_padding = radius,
                    target_padding = radius + 2,
                    source_x = d.source.x + (source_padding * x),
                    source_y = d.source.y + (source_padding * y),
                    target_x = d.target.x - (target_padding * x),
                    target_y = d.target.y - (target_padding * y);
                console.log(x);
                if (d.linearized)
                    return sprintf(['M%f,%f', 'A%f,%f 0 0,1 %f,%f'].join(''),
                                   source_x, source_y, dist, dist, target_x, target_y);
                return sprintf(['M%f,%f', 'L%f,%f'].join(''),
                               source_x, source_y, target_x, target_y);
            });

            // attract classes to their rank
            circle.attr('cx', function(d) { d.x += (width / 2 - d.x) * e.alpha; return d.x;});
            circle.attr('cy', function(d) { d.y += (d.rank - d.y) * e.alpha; return d.y; });
        };

        var draw_linearization = function (classes) {
            var prev = classes[0], i, cur;
            var traced = [];
            for (i = 1; i < classes.length; i++) {
                cur = classes[i];
                traced.push({source: prev, target: cur, linearized: true});
                prev = cur;
            }
            return traced;
        };


        var linearize_from = function (d) {
            var cls = _env[d.name];

            _edges = _edges.filter(function (el) { return !el.linearized; });
            _edges.push.apply(_edges, draw_linearization(last_linearization = c3.linearize(cls)));
            draw();
            on_linearization();
            return false;
        };

        // main entry point
        var draw = function (args) {
            var g, safety = 0;

            if (args && args.classes) {
                _force = null;
                classes(args);
            }

            // add edges
            path = path.data(edges());
            path.enter().append('svg:path')
                .attr('class', function (d) {
                    return d.linearized ? "linearized" : "link";
                }).style('marker-end', function(d) {
                    return sprintf('url(#end-arrow%s)',
                                   d.linearized ? '-linearized' : '');
                });

            // remove old edges
            path.exit().remove();

            // associate circles with class names
            circle = circle.data(classes(), function (c) { return c.name; });

            // update current circles
            circle.selectAll('circle')
                .style('fill', 'white');

            g = circle.enter().append('svg:g');

            g.append('svg:circle')
                .attr('class', 'node')
                .attr('r', radius)
                .style('fill', 'white')
                .style('stroke', darker_white)
                .on('mousedown', linearize_from);

            // draw class names
            g.append('svg:text')
                .attr('x', 0)
                .attr('y', 4)   //TODO -- customize offsets
                .attr('class', 'id')
                .text(function(d) { return d.name; });

            // remove old classes
            circle.exit().remove();

            // set the graph in motion, bailing if we had no luck
            force().start();
            while (force().alpha() > 0.05) {
                force().tick();
                if (safety++ > 500) {
                    break;
                }
            }

            return g;
        };

        // slots on our instance
        self.init = init;
        self.env = env;
        self.classes = classes;
        self.edges = edges;
        self.linearization = linearization;
        self.draw = draw;
        self.svg = svg;
        self.linearize_from = linearize_from;
        return self;
    };

    return {ClassHierarchy: ClassHierarchy};
})();
