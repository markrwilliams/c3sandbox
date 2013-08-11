class_parser = (function () {
    var CyclicalClassError = {}, UnknownClassError = {};

    var grammar = 'classes = c:(class_def ws)+ { return c.map(function (el) { return el[0]; }); }\n' +
            'class_def = "class" ws name:name bases:els { return {name: name, bases: bases} }\n' +
            'name = first:([_a-zA-Z]) rest:([_a-zA-Z0-9])* { return first +  rest.join(""); }\n' +
            'ws = [ \\t\\n]*\n' +
            "els = '(' ws first:name* rest:(',' ws name)* ws ')' { " +
            "        var head = [first];" +
            "        rest.forEach(function (el) {" +
            "                       head.push(el[2]);" +
            "                    });" +
            "        return head; }";

    var parser = PEG.buildParser(grammar);

    var determine_rank = function (cls) {
        if (!cls.bases.length)
            return 150;
        return 50 + Math.min.apply(null, cls.bases.map(determine_rank));
    };

    var from_string = function (txt) {
        var classes = parser.parse(txt),
            env = {'object': {name: 'object', bases: []}};
        classes.unshift(env.object);

        classes.forEach(
            function (c) {
                env[c.name] = c;
            });

        classes.forEach(function (c, idx) {
            var i, other_i, bases = c.bases;
            for (i = 0; i < bases.length; i++) {
                bases[i] = env[bases[i]];
                if (bases[i] === c)
                    throw CyclicalClassError;
                else if ((other_i = classes.indexOf(bases[i]) >= idx) || other_i === -1)
                    throw UnknownClassError;
            }
            c.rank = determine_rank(c);
        });

        return classes;
    };

    return {from_string: from_string,
            CyclicalClassError: CyclicalClassError,
            UnknownClassError: UnknownClassError};
})();
