$(document).ready(function() {
    var classes = $('#classes');

    var update_input = function (linearization) {
        var btns = $(document.createElement('div'))
                .attr('class', 'btn-group')
                .attr('data-toggle', 'buttons');
        var make_glyph = function() {
            return $(document.createElement('span'))
                .attr('class', 'glyphicon glyphicon-chevron-right');
        };

        var new_button = function (c) {
            return $(document.createElement('label'))
                .attr('type', 'button')
                .attr('class', 'btn btn-xs')
                .text(c.name)
                .click(function (e) {
                    classes.data('hierarchy').linearize_from(c, {'skip': true});
                    return e;
                })
                .append($(document.createElement('input')).attr('type', 'radio'));
        };

        btns.append(new_button(linearization.pop()));

        var btn;
        linearization.reverse().forEach(function (c) {
            btns.prepend((btn = new_button(c)).append(make_glyph()));
        });

        btn.button('toggle');

        $("#linearization").html(btns);
    };

    classes.data('hierarchy', new c3sandbox.render.RendersHierarchy(
        {svg: d3.select('#visualization').append('svg')
         .attr('width', 400)
         .attr('height', 450),
         width: 400,
         height: 450,
         after_linearization: update_input}));

    $("#class-form").submit(function (e) {
        var hierarchy = classes.data("hierarchy");
        $("#linearization").html('Click a class in the graph to see its linearization.');
        hierarchy.render_from({environment: c3sandbox.parser.from_string(classes.val())});
        return false;
    });
});
