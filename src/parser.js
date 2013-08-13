c3sandbox.parser = {
    CyclicalClassError: {},     // TODO
    UnknownClassError: {},

    parser: PEG.buildParser('classes = c:(class_def ws)+ { return c.map(function (el) { return el[0]; }); }\n' +
                            'class_def = "class" ws name:name bases:els { return {name: name, bases: bases} }\n' +
                            'name = first:([_a-zA-Z]) rest:([_a-zA-Z0-9])* { return first +  rest.join(""); }\n' +
                            'ws = [ \\t\\n]*\n' +
                            "els = '(' ws first:name* rest:(',' ws name)* ws ')' { " +
                            "        var head = [first];" +
                            "        rest.forEach(function (el) {" +
                            "                       head.push(el[2]);" +
                            "                    });" +
                            "        return head; }"),

    from_string: function (string) {
        var p = c3sandbox.parser,
            classes = p.parser.parse(string),
            environment = {'object': {name: 'object', bases: []}};
        classes.unshift(environment.object);

        classes.forEach(
            function (c) {
                environment[c.name] = c;
            });

        classes.forEach(function (c, idx) {
            var i, other_i, bases = c.bases;
            for (i = 0; i < bases.length; i++) {
                bases[i] = environment[bases[i]];
                if (bases[i] === c)
                    throw p.CyclicalClassError;
                else if ((other_i = classes.indexOf(bases[i]) >= idx) || other_i === -1)
                    throw p.UnknownClassError;
            }
        });

        return environment;
    }
};
