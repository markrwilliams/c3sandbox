var InvalidMRO = {};

Array.prototype.last = function () {
    return this.slice(-1)[0];
};

var rest = function (a) {
    return a.slice(1);
};

var merge = function (classes_list) {
    var merged = [], i;

    while (classes_list.length) {
        var valid = classes_list.some(
            function (classes) {
                var head = classes[0],
                    tails = classes_list.map(rest);

                if (tails.every(function (tail) { return tail.indexOf(head) < 0; })) {
                    if ((head !== undefined) && (head !== merged.last())) {
                        merged.push(head);
                    }

                    classes_list.forEach(function (classes) {
                                             var idx;

                                             if ((idx = classes.indexOf(head)) > -1)
                                                 classes.splice(idx, 1);

                                             if (!classes.length)
                                                 classes_list.splice(classes_list.indexOf(classes), 1);
                                         });
                    return true;
                }
                return false;
            });
        if (!valid)
            throw InvalidMRO;
    }

    return merged;
};

var c3 = function (cls) {
    var linearized = cls.bases.map(c3), result;

    if (cls.bases)
        linearized.push(cls.bases.slice(0));

    result = merge(linearized);
    result.unshift(cls);

    return result;
};

var O = {'name': 'O', 'bases': []};
var F = {'name': 'F', 'bases': [O]};
var E = {'name': 'E', 'bases': [O]};
var D = {'name': 'D', 'bases': [O]};
var C = {'name': 'C', 'bases': [D, F]};
var B = {'name': 'B', 'bases': [D, E]};
var A = {'name': 'A', 'bases': [B, C]};

alert(c3(A).map(function (c) { return c.name; }));
