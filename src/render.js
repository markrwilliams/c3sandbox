c3sandbox.render = {
    Arrow: function (args) {
        this.marker_width = args.marker_width || 5, this.marker_height = args.marker_height || 5;
        this.url = sprintf('url(#%s)', args.id);

        args.svg.append('svg:defs').append('svg:marker')
            .attr('id', args.id)
            .attr('viewBox', args.view_box || '0 -5 10 10')
            .attr('refX', args.ref_x || 6)
            .attr('markerWidth', this.marker_width)
            .attr('markerHeight', this.marker_height)
            .attr('orient', args.orient || 'auto')
            .append('svg:path')
            .attr('d', args.d || 'M0,-5L10,0L0,5')
            .attr('fill', args.fill || "#000");
    },

    RendersHierarchy: function (args) {
        var render = c3sandbox.render;

        this.svg = args.svg;
        var height = args.height, width = args.width;
        this.after_linearization = args.after_linearization || function () {};

        var normal_arrow = new render.Arrow({svg: this.svg,
                                             id: 'end-arrow'}),
            linearized_arrow = new render.Arrow({svg: this.svg,
                                                 id: 'end-arrow-linearized',
                                                 fill: 'red'});

        var rank_fuzz = args.rank_fuzz || 10, offset = rank_fuzz * 15;
        var radius = 22;

        var determine_rank = function (c) {
            if (!c.bases.length)
                return 0;
            return 1 + Math.max.apply(null, c.bases.map(determine_rank));
        };

        var classes, edges;

        this.update = function (args) {
            this.environment = args.environment;

            classes = [], edges = [];

            var key, c, ranks = {}, num_ranks = rank_fuzz;

            for (key in this.environment) {
                if (!this.environment.hasOwnProperty(key))
                    continue;

                classes.push(c = this.environment[key]);
                ranks[c.rank = determine_rank(c)] = true;
                c.bases.forEach(function (b) {
                    edges.push({source: b, target: c});
                });
            }

            for (key in ranks) {
                if (!ranks.hasOwnProperty(key))
                    continue;

                ++num_ranks;
            }

            classes.forEach(function (c) {
                c.rank = offset + c.rank * height / num_ranks;
            });

            this.force = d3.layout.force()
                .nodes(classes)
                .links(edges)
                .size([width, height])
                .charge(-5000)
                .linkDistance(10);
        };


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
            var perimeter_point = radius + fuzz;
            return b + (perimeter_point * (a - b) / hypotenuse);
        };

        var create_link_d = function (d) {
            var h = hypotenuse(d.source, d.target);
            var fuzz = (d.linearized ? linearized_arrow.marker_width : normal_arrow.marker_width),
                from_x = d.source.x - (radius * (d.source.x - d.target.x) / h),
                from_y = d.source.y - (radius * (d.source.y - d.target.y) / h),
                to_x = d.target.x + ((radius + fuzz) * (d.source.x - d.target.x) / h),
                to_y = d.target.y + ((radius + fuzz) * (d.source.y - d.target.y) / h);
            if (d.linearized)
                return sprintf(['M%f,%f', 'A%f,%f 0 0,1 %f,%f'].join(''),
                               from_x, from_y, h / 2, h / 2, to_x, to_y);
            return sprintf(['M%f,%f', 'L%f,%f'].join(''),
                           from_x, from_y, to_x, to_y);
        };


        var link = this.svg.append('g')
                .attr('class', 'links-group')
                .selectAll('path');

        var class_node = this.svg.append('g')
                .attr('class', 'class-nodes')
                .selectAll('g');

        this.linearize_from = function (d, arg) {
            e = edges;
            edges = edges.filter(function (el) { return !el.linearized; });

            var linearized = c3.linearize(d), prev = linearized[0], i, cur;
            for (i = 1; i < linearized.length; i++) {
                cur = linearized[i];
                edges.push({source: prev, target: cur, linearized: true});
                prev = cur;
            }

            for (var c in this.environment) {
                if (!this.environment.hasOwnProperty(c))
                    continue;
                this.environment[c].selected = false;
            }

            d.selected = true;

            this.render();

            if (arg && arg.skip !== true) this.after_linearization(linearized);

            return false;
        }.bind(this);

        this.render = function () {
            link = link.data(edges, function (d) { return d.source.name + '-' + d.target.name; });
            class_node = class_node.data(classes, function (d) { return d.name + '-' + d.selected; });

            link.enter().append('path')
                .attr('class', choose_link_class)
                .style('marker-end', choose_link_arrow);

            link.exit().remove();

            class_node.selectAll('circle').attr('class',
                                                function (d) {
                                                    return d.selected ? 'class-node-circle node-selected' : 'class-node-circle';
                                                });

            var class_node_group = class_node.enter().append('g');
            class_node_group.append('circle')
                .attr('class', function (d) { return d.selected ? 'class-node-circle-selected' : 'class-node-circle'; })
                .attr('r', radius)
                .on('mousedown', this.linearize_from);

            class_node_group.append('text')
                .attr('x', 0)
                .attr('y', 4)
                .attr('class', 'node-text')
                .text(function (d) { return d.name; });
            class_node.exit().remove();

            this.force.on('tick', function (e) {
                    link.attr('d', create_link_d);
                    class_node.attr('transform', function (d) {
                        return sprintf('translate(%f, %f)',
                                       d.x += (width / 2 - d.x) * e.alpha,
                                       d.y += (d.rank - d.y) * e.alpha
                                      );
                    });
            }).start();

            var safety = 0;
            while (this.force.alpha() > 0.03) {
                this.force.tick();
                ++safety;
                if (safety > 500)
                    break;
            }

        };

        this.render_from = function (args) {
            this.update(args);
            this.render();
        };
    }
};
