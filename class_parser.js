var class_grammar = ['classes = c:(class_def ws)+ { return c.map(function (el) { return el[0]; }); }',
                     'class_def = "class" ws name:name bases:els { return {id: name, bases: bases} }',
                     'name = first:([_a-zA-Z]) rest:([_a-zA-Z0-9])* { return first +  rest.join(""); }',
                     'ws = [ \\t\\n]*',
                     "els = '(' ws first:name* rest:(',' ws name)* ws ')' {",
                     "        var head = [first];",
                     "        rest.forEach(function (el) {",
                     "                       head.push(el[2]);",
                     "                    });",
                     "        return head; }"].join("\n");

var class_parser = PEG.buildParser(class_grammar);

function eval_nodes(txt) {
    O = {id: 'O', bases: []}
    node_env = {'O': O};
    nodes = class_parser.parse(txt);
    nodes.unshift(O);

    nodes.forEach(function (n) {
        node_env[n.id] = n;
    });

    nodes.forEach(function (n) {
        var i, bases = n.bases;
        for (i = 0; i < bases.length; i++) {
            bases[i] = node_env[bases[i]];
        }
    });
    links = calculate_links(nodes);
    restart();
    return false;
}

function noop() { return false; }
