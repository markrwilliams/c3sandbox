$(document).ready(function() {
    var classes = $('#classes');

    var update_input = function (e) {
        $("#linearization").val(
            classes.data('hierarchy').linearization().map(function (c) { return c.name; }));
    };

    classes.data('hierarchy', class_hierarchy.ClassHierarchy().init(
        {parent: $("#visualization")[0],
         id: "visualization-svg",
         width: 800,
         height: 600,
         on_linearization: update_input}));

    $("#class-form").submit(function (e) {
        var hierarchy = classes.data("hierarchy");
        hierarchy.draw({classes: class_parser.from_string(classes.val())});
        update_input();
        return false;
    });
});
