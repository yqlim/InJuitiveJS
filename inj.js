(function(){

    'use strict';

    var proto = [],
        _slice = proto.slice,
        _splice = proto.splice,
        _push = proto.indexOf,
        _join = proto.join,
        _bind = Function.prototype.bind;

    var error = {
        noArgs: function(name){
            console.error('InJ.' + name + ' is called without argument.');
        },
        insufficientArgs: function(name, needed, given){
            console.error('InJ.' + name + ' is called with insufficient arguments.' + needed + ' is needed, only ' + given + ' given.');
        },
        invalidArgs: function(name, value, index){
            if (value.constructor !== Array)
                if (value === undefined)
                    value = ['undefined'];
                else if (value === null)
                    value = ['null'];
                else
                    value = [value];

            if (index.constructor !== Array)
                index = [index];

            value = value.join(', ');
            index = value.join(', ');

            console.error('InJ.' + name + ' is supplied with invalid argument(s): ' + value + ' at index(es) ' + index + '.');
        },
        chained: function(name){
            console.error('InJ.' + name + ' cannot be chained from a non-empty InJ instance.');
        },
        empty: function(name){
            console.error('InJ.' + name + ' is supplied with an empty list.');
        }
    };

    var util = {
        prevOrArgs: function(inst, args){
            // If `this` is not InJ instance, return args, else this.prev
            return inst === InJ
                ? args
                : inst.prev;
        },
        return: function(inst, prev){
            // If `this` is not InJ instance, return new InJ instance, else the instance
            return inst === InJ
                ? InJ(prev)
                : prev;
        },
        parseNegativeIndex: function(from, len){
            // Adjust index if `from` is negative
            if (from < 0)
                if ((from += len) < 0)
                    // If `from` is still negative after adjusting
                    from = 0;

            return from;
        }
    }


    var InJ = function InJ(value, origin){
        var len = arguments.length;
        return len < 1
            ? new InJ.init()
            : value instanceof InJ.init
                ? len > 1
                    ? value.toStack(value, origin)
                    : value
                : len > 1
                    ? new InJ.init(value, origin)
                    : new InJ.init(value)
    }

    InJ.init = function(){
        var len;

        // If invoked without keyword 'new'
        if (this === InJ)
            return InJ.apply(null, arguments);

        len = arguments.length;
        InJ.define(this, {
            prev: {
                value: len > 0 ? arguments[0] : null,
                writable: true
            },
            length: {
                value: 0,
                writable: true
            }
        });

        return len > 0
            ? InJ.toStack.apply(this, arguments)
            : this;
    };

    InJ.define = function(rootObj, descriptor){
        var k,
            i,
            obj,
            temp,
            len = arguments.length;

        if (!rootObj)
            return error.invalidArgs('define', rootObj, 0);

        // Extends InJ and its prototype if only 1 argument present
        if (len === 1){

            obj = rootObj;
            for (k in obj){
                temp = {
                    value: obj[k]
                };
                Object.defineProperty(InJ.init.prototype, k, temp);
                Object.defineProperty(InJ, k, temp);
            }

        } else if (rootObj.constructor !== Array){

            define(rootObj);

        } else {

            for (i = rootObj.length; i--;)
                define(rootObj[i]);
            
        }

        return rootObj;

        function define(obj){
            for (k in descriptor)
                Object.defineProperty(obj, k, descriptor[k]);
        }
    };


    // BASIC INFO
    InJ.define({
        constructor: InJ,
        version: '0.0.1'
    });


    // INTERNAL USE METHODS
    InJ.define({

        toStack: function(){
            var valLen, prevLen,
                i = 0,
                inst = this === InJ ? arguments[i++] : this,
                vals = InJ.toArray(arguments[i++]),
                prev = arguments[i];

            if (!(inst instanceof InJ.init))
                inst = InJ(inst);

            // Only set inst.origin if orig is explicitly supplied
            if (arguments.length > i)
                inst.prev = prev;

            prevLen = inst.length;
            valLen = vals.length;

            // Replacing inst[] values with vals[]
            for (i = 0; i < valLen; i++)
                inst[i] = vals[i];

            // Removes unwanted items from list
            _slice.call(inst, i);

            // Sets new length for inst
            inst.length = i;

            return inst;
        }

    })


    // UTILITY METHODS
    InJ.define({

        isArguments: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !val
                ? false
                : Object.prototype.toString.call(val) === '[object Arguments]';
        },

        isArray: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !val
                ? false
                : val.constructor === Array;
        },

        isObject: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !val
                ? false
                : val.constructor === Object;
        },

        isFunction: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return typeof val === 'function';
        },

        isNumber: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return typeof val === 'number';
        },

        isString: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return typeof val === 'string';
        },

        isBoolean: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return typeof val === 'boolean';
        },

        isHTMLCollection: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !val
                ? false
                : val.constructor === HTMLCollection;
        },

        isNodeList: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !val
                ? false
                : val.constructor === NodeList;
        },

        isElement: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !val
                ? false
                : /HTML\w*Element/.test(val.constructor);
        },

        isNode: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !!val.nodeType;
        },

        isDOMContent: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !val
                ? false
                : /(HTML\w*(Element|Collection|Document))|Window|(DOMToken|Node)List/.test(val.constructor);
        },

        isFalsy: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !val;
        },

        isNOU: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return val === undefined || val === null;
        },

        isNull: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return val === null;
        },

        isUndefined: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return val === undefined;
        },

        isNaN: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return window.isNaN(val);
        },

        isArrayLike: function(){
            var c, i, x, l, keys,
                val = util.prevOrArgs(this, arguments[0]);

            if (val === undefined || val === null)
                return false;

            c = val.constructor;

            if (c === Array || c === String)
                return true;

            i = val.length;

            // Returns false if without .length property or with invalid .length value
            if (typeof i !== 'number' || i < 0)
                return false;

            // Get all numeric keys of val
            keys = Object.keys(val).filter(function(v){
                return $.isNumeric(v);
            });
            
            l = keys.length;

            // Check if keys.length is same with val.length
            if (i !== l)
                return false;

            x = 0;

            /**
             * Check if:
             * 1. All keys are in proper sequence
             * 2. Keys are not float or double
             */
            for (; x < l;)
                // Use unstrict equality comparison because keys[x] can be string
                if (x == keys[x])
                    x++;
                else
                    return false;
                    
            return true;
        },

        isNumeric: function(){
            var i, c,
                val = util.prevOrArgs(this, arguments[0]);

            if (typeof val === 'number')
                return true;

            if (typeof val !== 'string')
                return false;

            i = val.length;

            // Use charCode instead of RegExp
            // for better performace in modern browser
            for (; i--;){
                c = val.charCodeAt(i);
                if (!(c > 47 && c < 58)) // 0-9
                    return false;
            }

            return true;
        },

        isAlphabet: function(){
            var i, c,
                val = util.prevOrArgs(this, arguments[0]);

            if (typeof val !== 'string')
                return false;

            i = val.length;

            // Use charCode instead of RegExp
            // for better performance in modern browser
            for (; i--;){
                c = val.charCodeAt(i);
                if (!(c > 64 && c < 91) &&  // A-Z
                    !(c > 96 && c < 123))   // a-z
                    return false;
            }

            return true;
        },

        isAlphaNumeric: function(){
            var i, c,
                val = util.prevOrArgs(this, arguments[0]);

            if (typeof val === 'number' && !window.isNaN(val))
                return true;

            if (typeof val !== 'string')
                return false;

            i = val.length;

            // Use charCode instead of RegExp
            // for better performance in modern browser
            for (; i--;){
                c = val.charCodeAt(i);
                if (!(c > 47 && c < 58) &&  // 0-9
                    !(c > 64 && c < 91) &&  // A-Z
                    !(c > 96 && c < 123))   // a-z
                    return false;
            }

            return true;
        },

        isInJ: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !val
                ? false
                : val.constructor === InJ
        },

        isEmpty: function(){
            var val = util.prevOrArgs(this, arguments[0]);

            switch (InJ.constructorOf(val)){
                case 'String':
                    return val === '';
                case 'Object':
                    return JSON.stringify(val) === JSON.stringify({});
                default:
                    return InJ.isArrayLike(val)
                        ? val.length === 0
                        : InJ.isNOU(val);
            }
        },

        isOdd: function(){
            var val = util.prevOrArgs(this, arguments[0]);

            if (typeof val !== 'number')
                return error.invalidArgs('idOdd', val);

            return !!(val & 1);
        },

        isEven: function(){
            var val = util.prevOrArgs(this, arguments[0]);

            if (typeof val !== 'number')
                return error.invalidArgs('idOdd', val);

            return !(val & 1);
        },

        constructorOf: function(){
            var subject = this.origin || arguments[0];

            if (arguments.length === 0)
                return error.emptyList('constructorOf');

            if (subject === undefined || subject === null)
                return false;

            return subject.constructor;
        },

        toArray: function(){
            var key,
                val,
                ret,
                i = 0,
                item = this === InJ ? arguments[i++] : this;

            /* Use long if-elseif-else to sequentially eliminate possibilities */
            /* Sequence must remain for it to work properly */
            /* Do not alter the sequence */

            if (isUnparsable())
                contain();

            else if (item.constructor === Array)
                populate();

            else if (InJ.isDOMContent(item))
                if (isSelectOrFormElement() || typeof item.length !== 'number')
                    contain();
                else
                    populate();

            else if (InJ.isArrayLike(item))
                populate();

            else if (typeof item === 'object')
                contain();

            else
                return error.unexpected('toArray', arguments);

            return ret;

            function populate(){
                i = item.length;
                ret = [];
                for (; i--;)
                    ret[i] = item[i];
            }

            function contain(){
                ret = [item];
            }

            function isUnparsable(){
                var type = typeof item;
                return item === null
                    || item === document
                    || item === window
                    || type === 'undefined'
                    || type === 'number'
                    || type === 'function'
                    || type === 'string'
                    || type === 'boolean'
                    || type === 'symbol';
            }

            function isSelectOrFormElement(){
                var c = item.constructor;
                return c === HTMLSelectElement || c === HTMLFormElement
            }
        }

    });


    // InJ METHODS FOR ARRAY-LIKE OBJECTS
    InJ.define({

        // Deep copy
        copy: function(){
            var i = 0,
                x = 0,
                copy = [],
                list = this === InJ
                    ? arguments[i] instanceof InJ.init
                        ? arguments[i++]
                        : InJ.toArray(arguments[i++])
                    : this,
                len = list.length,
                iStart = arguments[i++] || 0,
                iEnd = arguments[i] || len,
                deepCopy = function(val){
                    var copy, i;

                    // If is not array-like, no need to go deep
                    if (!InJ.isArrayLike(val))
                        return val;

                    i = val.length;
                    copy = [];

                    // If val is iterable (except string), copy it
                    for (; i--;)
                        copy[i] = deepCopy(val[i]);

                    return copy;
                };

            iStart = util.parseNegativeIndex(iStart, len);
            iEnd = util.parseNegativeIndex(iEnd, len);

            for (i = iStart; i < iEnd; i++, x++)
                copy[x] = deepCopy(list[i]);

            copy = InJ(copy);
            if (list instanceof InJ.init)
                copy.prev = list.prev;

            return copy;
        }

    });


    // InJ VERSION OF ARRAY METHODS
    InJ.define({

        // Shallow copy
        slice: function(){
            var i = 0,
                x = 0,
                list = this === InJ ? InJ.toArray(arguments[i++]) : this,
                len = list.length,
                iStart = arguments[i++] || 0,
                iEnd = arguments[i++] || len,
                res = [];

            iStart = util.parseNegativeIndex(iStart, len);
            iEnd = util.parseNegativeIndex(iEnd, len);

            for (i = iStart; i < iEnd; i++, x++)
                res[x] = list[i];

            return InJ(res, list);
        },

        forEach: function(){
            var len,
                list,
                i = 0,
                prev = this === InJ ? arguments[i++] : this,
                callback = arguments[i++],
                ctx = arguments[i];

            i = 0;
            list = InJ.toArray(prev);
            len = list.length;

            for (; i < len; i++)
                callback.call(ctx, list[i], i, list);

            return util.return(this, prev);
        }

    });


    window.$ = window.InJ = InJ;

})();