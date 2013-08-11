var c3 = (function () {
              var InvalidMRO = {};

              var last = function(a) {
                  return a.slice(-1)[0];
              };

              var rest = function(a) {
                  return a.slice(1);
              };

              var merge = function(classes_array) {
                  var merged = [],
                  valid = false;

                  while (classes_array.length) {
                      valid = classes_array.some(
                          function (classes) {
                              var head = classes[0],
                                  tails = classes_array.map(rest);

                              if (tails.every(function (tail) { return tail.indexOf(head) < 0; })) {
                                  if ((head !== undefined) && (head !== last(merged)))
                                      merged.push(head);

                                  classes_array.forEach(function (classes) {
                                                           var idx;

                                                           if ((idx = classes.indexOf(head)) > -1)
                                                               classes.splice(idx, 1);

                                                           if (!classes.length)
                                                               classes_array.splice(classes_array.indexOf(classes), 1);
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
    var linearize = function (cls) {
        var linearized = cls.bases.map(linearize), result;

        if (cls.bases)
            linearized.push(cls.bases.slice(0));

        result = merge(linearized);
        result.unshift(cls);

        return result;
    };

    return {linearize: linearize,
           InvalidMRO: InvalidMRO};
})();
