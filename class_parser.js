var CyclicalClassError;

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

function determine_rank(node) {
    if (!node.bases.length)
        return 150;
    return 50 + Math.min.apply(null, node.bases.map(determine_rank));
}

function eval_nodes(txt) {
    document.getElementById("linearization").value = '';

    O = {id: 'object', bases: []};
    node_env = {'object': O};
    nodes = class_parser.parse(txt);
    nodes.unshift(O);

    nodes.forEach(
        function (n) {
            node_env[n.id] = n;
        });

    nodes.forEach(function (n, idx) {
        var i, bases = n.bases;
        for (i = 0; i < bases.length; i++) {
            if (nodes.indexOf(bases[i]) >= idx)
                throw CyclicalClassError;
            bases[i] = node_env[bases[i]];
        }
        n.rank = determine_rank(n);
    });
    links = calculate_links(nodes);
    restart();
    return false;
}

function noop() { return false; }
