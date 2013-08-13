c3sandbox.render = {
    bind: function (instance, f) {
        return function () {
            return f.apply(instance, arguments);
        };
    },

    Arrow: function (args) {
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

        this.url = sprintf('url(#%s)', args.id);
    },

    RendersHierarchy: function (args) {
        var render = c3sandbox.render;
        var height = args.height, width = args.width;

        this.svg = d3.select('body').append('svg')
            .attr('width', width)
            .attr('height', height);

        var normal_arrow = new render.Arrow({svg: this.svg,
                                             id: 'end-arrow'}),
            linearized_arrow = new render.Arrow({svg: this.svg,
                                                 id: 'end-arrow-linearized',
                                                 fill: 'red'});

        var offset = args.offset || 100;
        var radius = 20;

        // replace me
        this.env = {};
        this.env.O = {name: 'O', bases: []};
        this.env.F = {name: 'F', bases: [this.env.O]};
        this.env.E = {name: 'E', bases: [this.env.O]};
        this.env.D = {name: 'D', bases: [this.env.O]};
        this.env.C = {name: 'C', bases: [this.env.D, this.env.F]};
        this.env.B = {name: 'B', bases: [this.env.D, this.env.E]};
        this.env.A = {name: 'A', bases: [this.env.B, this.env.C]};

        var determine_rank = function (c) {
            if (!c.bases.length)
                return 0;
            return 1 + Math.min.apply(null, c.bases.map(determine_rank));
        };

        var classes = [], edges = [], key, c;
        for (key in this.env) {
            if (this.env.hasOwnProperty(key)) {
                classes.push(c = this.env[key]);
                c.rank = determine_rank(c);
                c.bases.forEach(function (b) {
                    edges.push({source: b, target: c});
                });
            }
        }

        classes.forEach(function (c) {
            c.rank = offset + c.rank * height / classes.length;
        });

        var choose_link_arrow = function (d) {
            return d.linearized ? linearized_arrow.url : normal_arrow.url;
        };

        var choose_link_class = function (d) {
            return d.linearized? "linearized-edge" : "link-edge";
        };

        var hypotenuse = function (point_a, point_b) {
            var leg1 = point_a.x - point_b.x, leg2 = point_a.y - point_b.y;
            return Math.sqrt(leg1 * leg1 + leg2 * leg2);
        };

        var translate = function (a, b, hypotenuse, fuzz) {
            var perimeter_point = radius + (fuzz || 6);
            return b + (perimeter_point * (a - b) / hypotenuse);
        };

        var create_link_d = function (d) {
            if (d.source.name === 'O')
                console.log(sprintf("%s -> %s", d.source.name, d.target.name));
            var h = hypotenuse(d.source, d.target);
            var from_x = d.source.x,
                from_y = d.source.y,
                to_x = translate(d.source.x, d.target.x, h),
                to_y = translate(d.source.y, d.target.y, h);
            if (d.linearized)
                return sprintf(['M%f,%f', 'A%f,%f 0 0,1 %f,%f'].join(''),
                               from_x, from_y, h, h, to_x, to_y);
            return sprintf(['M%f,%f', 'L%f,%f'].join(''),
                           from_x, from_y, to_x, to_y);
        };

        var link = this.svg.append('g')
                .attr('class', 'links-group')
                .selectAll('path').data(edges);

        var class_node = this.svg.append('g')
                .attr('class', 'class-nodes')
                .selectAll('g').data(classes);

        this.draw = render.bind(this, function () {
            link.enter().append('path')
                .attr('class', choose_link_class)
                .style('marker-end', choose_link_arrow);

            link.exit().remove();

            class_node.selectAll('circle');

            var class_node_group = class_node.enter().append('g');
            class_node_group.append('circle')
                .attr('class', 'class-node-circle')
                .attr('r', radius);

            class_node_group.append('text')
                .attr('x', -6)
                .attr('y', 3)
                .text(function (d) { return d.name; });
            class_node.exit().remove();

            this.force = d3.layout.force()
                .nodes(classes)
                .links(edges)
                .size([width, height])
                .charge(-5000)
                .linkDistance(30)
                .on('tick', function (e) {
                    link.attr('d', create_link_d);
                    class_node.attr('transform', function (d) {
                        return sprintf('translate(%f, %f)',
                                       d.x += (width / 2 - d.x) * e.alpha,
                                       d.y += (d.rank - d.y) * e.alpha
                                      );
                    });
                }).start();
        });
    }
};
