$(document).ready(function() {
    var classes = $('#classes');

    var update_input = function (linearization) {
        var btns = $('<div/>', {'class': 'btn-group',
                                'data-toggle': 'buttons'});
        linearization.forEach(function (c) {
            btns.append($('<label/>',
                          {type: 'button',
                           'class': 'btn btn-default',
                           text: c.name,
                           click: function (e) {
                               classes.data('hierarchy').linearize_from(c, {'skip': true});
                               return e;
                           }}).append($('<input type="radio"/>')));
        });

        $("#linearization").html(btns);
    };

    classes.data('hierarchy', new c3sandbox.render.RendersHierarchy(
        {svg: d3.select('#visualization').append('svg')
         .attr('width', 400)
         .attr('height', 400),
         width: 400,
         height: 400,
         after_linearization: update_input}));

    $("#class-form").submit(function (e) {
        var hierarchy = classes.data("hierarchy");
        hierarchy.render_from({environment: c3sandbox.parser.from_string(classes.val())});
        return false;
    });
});
