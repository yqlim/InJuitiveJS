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
            return new TypeError(util.method(name) + ' is called without argument.');
        },
        insufficientArgs: function(name, needed, given){
            return new TypeError(util.method(name) + ' is called with insufficient arguments.' + needed + ' is needed, only ' + given + ' given.');
        },
        invalidArgs: function(name, value, index){
            return new TypeError(util.method(name) + ' is supplied with invalid argument(s).');
        },
        chained: function(name){
            return new SyntaxError(util.method(name) + ' cannot be chained from a non-empty InJ instance.');
        },
        notChained: function(name){
            return new SyntaxError(util.method(name) + ' must be chained from a InJuitive instance.');
        },
        empty: function(name){
            return new TypeError(util.method(name) + ' is supplied with an empty list.');
        },
        unexpected: function(name){
            return new Error(util.method(name) + ': unexpected error.');
        }
    };

    var util = {
        wrapper: function(name, method){
            return {
                value: function(){
                    if (this === InJ && arguments.length < 1)
                        throw error.noArgs(name);
                    return method.apply(this, arguments);
                }
            }
        },
        method: function(name){
            return 'InJ.' + name;
        },
        prevOrArgs: function(inst, args){
            // If `this` is not InJ instance, return args, else this.prev
            return inst === InJ
                ? args
                : inst.prev;
        },
        parseNegativeIndex: function(from, len){
            // Adjust index if `from` is negative
            if (from < 0)
                if ((from += len) < 0)
                    // If `from` is still negative after adjusting
                    from = 0;

            return from;
        },
        noReturn: function(inst, list){
            return inst === InJ // If `inst` is not InJ instance
                ? InJ(list)     // returns new InJ instance using `inst`
                : list;         // else returns `inst`
        },
        affectOriginal: function(inst, value){
            var ret;
            if (inst === InJ){
                ret = InJ(value);
                ret.prev = inst;
            } else {
                ret = inst.toStack(value);
            }
            return ret;
        },
        noAffectOriginal: function(value, prev){
            var ret = InJ(value);
            ret.prev = prev;
            return ret;
        }
    }


    var InJ = function InJ(value){
        var len = arguments.length;
        return len < 1
            ? new InJ.init()
            : value instanceof InJ.init
                ? len > 1
                    ? value.toStack(value)
                    : value
                : len > 1
                    ? new InJ.init(value)
                    : new InJ.init(value);
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
            ? this.toStack(arguments[0], false)
            : this;
    };

    InJ.define = function(rootObj, descriptor){
        var k,
            i,
            obj,
            temp,
            len = arguments.length;

        if (!rootObj)
            throw error.invalidArgs('define');

        // Extends InJ and its prototype if only 1 argument present
        if (len === 1){

            obj = rootObj;
            for (k in obj){
                temp = util.wrapper(k, obj[k]);
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
            var prev,
                i = 0,
                inst = this,
                vals = InJ.toArray(arguments[i++]),
                updatePrev = arguments[i],
                instLen = inst.length,
                valLen = vals.length;

            if (!(inst instanceof InJ.init))
                throw error.notChained('toStack');

            if (updatePrev !== false){
                // Shallow copy inst[] into prev[]
                prev = inst.slice();
    
                // Update inst.prev
                inst.prev = prev;
            }

            // Replacing inst[] with vals[]
            for (i = 0; i < valLen; i++)
                inst[i] = vals[i];

            // Removes balance items from list
            _splice.call(inst, i);

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
            return !val
                ? false
                : !!val.nodeType;
        },

        isDOMContent: function(){
            var val = util.prevOrArgs(this, arguments[0]);
            return !val
                ? false
                : /(HTML\w*(Element|Collection|Document))|Window|(DOMToken|Node)List/.test(val.constructor) || !!val.nodeType;
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

            if (val === undefined || val === null || typeof val === 'function')
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

            // Negative number, Infinity and NaN are not numeric
            if (typeof val === 'number')
                return val >= 0
                    && Math.abs(val) !== Infinity
                    && !window.isNaN(val);

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

        isAlphabetical: function(){
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
                : val instanceof InJ.init;
        },

        isEmpty: function(){
            var val = util.prevOrArgs(this, arguments[0]);

            switch (InJ.constructorOf(val)){
                case String:
                    return val === '';
                case Object:
                    return JSON.stringify(val) === JSON.stringify({});
                default:
                    return InJ.isArrayLike(val)
                        ? val.length === 0
                        : InJ.isNOU(val);
            }
        },

        isOdd: function(){
            var val = util.prevOrArgs(this, arguments[0]);

            if (typeof val !== 'number' || window.isNaN(val) || Math.abs(val) === Infinity)
                throw error.invalidArgs('isOdd');

            return !!(val & 1);
        },

        isEven: function(){
            var val = util.prevOrArgs(this, arguments[0]);

            if (typeof val !== 'number' || window.isNaN(val) || Math.abs(val) === Infinity)
                throw error.invalidArgs('isEven');

            return !(val & 1);
        },

        constructorOf: function(){
            var subject = util.prevOrArgs(this, arguments[0]);

            if (arguments.length === 0)
                throw error.empty('constructorOf');

            if (subject === undefined || subject === null)
                return undefined;

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

            if (arguments.length < 1)
                ret = [];

            else if (isUnparsable())
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
                throw error.unexpected('toArray', arguments);

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
                copy.prev = list;

            return copy;
        }

    });


    // InJ VERSION OF ARRAY METHODS
    InJ.define({

        /**
         * Shallow copy
         * 
         * COPIES selected items from original list
         * Returns COPIED list
         * 
         * Does not affect original list
         */
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

            return util.noAffectOriginal(res, list);
        },

        /**
         * REMOVES selected items from original list
         * Returns REMOVED list
         * 
         * Affects original list
         */
        splice: function(){
            var fake,
                spliced,
                i = 0,
                list = this === InJ ? arguments[i++] : this,
                args = _slice.call(arguments, i);

            // This is needed to splice DOM Content
            if (InJ.isDOMContent(list))
                fake = InJ.toArray(list);

            spliced = _splice.apply(fake || list, args);
            spliced = InJ(spliced);
            spliced.prev = list;
            
            return spliced;
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

            return util.noReturn(this, prev);
        },

        indexOf: function(){
            var i = 0,
                list = this === InJ ? InJ.toArray(arguments[i++]) : this,
                item = arguments[i++],
                from = arguments[i] || 0,
                len = list.length;

            if (typeof from !== 'number')
                throw error.invalidArgs('indexOf', from, i);

            from = util.parseNegativeIndex(from, len);

            // Returns index right when target is found
            for (i = from; i < len; i++)
                if (item === list[i])
                    return i;

            return -1;
        },

        // Does not affect original list
        reverse: function(){
            var x = 0,
                i = 0,
                prev = this === InJ ? arguments[i] : this,
                list = InJ.toArray(prev),
                result = [];

            // Add items to `result` from behind
            for (i = list.length; i--; x++)
                result[x] = list[i];

            return util.noAffectOriginal(result, prev);
        },

        // Affects original list
        push: function(){
            var x,
                len,
                i = 0,
                prev = this === InJ ? arguments[i++] : this,
                item = _slice.call(arguments, i),
                list = InJ.toArray(prev);

            i = 0;
            x = list.length;
            len = item.length;

            // Add new items to `list`
            for (; i < len;)
                list[x++] = item[i++];

            return util.affectOriginal(this, list);
        }

    });


    window.$ = window.InJ = InJ;

})();