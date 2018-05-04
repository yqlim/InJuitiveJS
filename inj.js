(function(){

    'use strict';

    var proto = [],
        _slice = proto.slice,
        _splice = proto.splice,
        _push = proto.push,
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
        },

        sort: function(){
            var len,
                number,
                string,
                others,
                sortNum,
                i = 0,
                prev = this === InJ ? arguments[i++] : this,
                list = InJ.toArray(prev),
                method = arguments[i++],
                result = [];

            if (typeof method === 'function'){

                for (i = 0, len = list.length; i < len; i++)
                    result = list.sort(method);

            } else {

                number = [],
                string = [],
                others = [],
                sortNum = function(v, i, a){
                    /**
                     * If `a` is empty || given value >= current value of `a`
                     *     Adds value to result
                     * else
                     *     Moves to next iteration
                     */
                    if (i === -1 || v >= a[i])
                        a.splice(++i, 0, v);
                    else
                        return sortNum(v, --i, a);
                };

                // Categorise arguments into groups
                for (i = 0, len = list.length; i < len; i++){
                    switch (typeof list[i]){
                        case 'number': number.push(list[i]); break;
                        case 'string': string.push(list[i]); break;
                        default      : others.push(list[i]);
                    }
                }
    
                // Sorts numbers first
                for (i = 0, len = number.length; i < len; i++)
                    sortNum(number[i], result.length - 1, result);
    
                // Sorts strings
                string = string.sort();
    
                // Concat `string` and `others` to `result`
                result = result.concat(string, others);

            }

            return util.noAffectOriginal(result, prev);
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
        },

        unshift: function(){
            var x,
                len,
                i = 0,
                prev = this === InJ ? arguments[i++] : this,
                list = _slice.call(prev),
                item = _slice.call(arguments, i);

            i = 0;
            x = item.length;
            len = list.length;

            // Adds original items to new items
            for (; i < len;)
                item[x++] = list[i++];

            return util.affectOriginal(this, item);
        },

        shift: function(){
            var i = 0,
                prev = this === InJ ? arguments[i] : this,
                list = InJ.toArray(prev),
                lim = list.length - 1,  // Because the desired length is 1 unit shorter
                result = [];

            // Adds all items to `result` except the first
            for (; i < lim;)
                result[i++] = list[i];

            return util.affectOriginal(this, result);
        },

        pop: function(){
            var i = 0,
                prev = this === InJ ? arguments[i] : this,
                list = InJ.toArray(prev),
                lim = list.length - 1,  // Because the desired length is 1 unit shorter
                result = [];

            // Adds all items to `result` except the last
            for (; i < lim;)
                result[i] = list[i++];

            return util.affectOriginal(this, result);
        },

        fill: function(){
            var i = 0,
                prev = this === InJ ? arguments[i++] : this,
                list = InJ.toArray(prev),
                len = list.length,
                filler = arguments[i++],
                from = arguments[i++] || 0,
                to = arguments[i] || len;

            if (typeof from !== 'number' || typeof to !== 'number')
                throw error.invalidArgs('fill');

            from = util.parseNegativeIndex(from, len);
            to = util.parseNegativeIndex(to, len);

            // Replaces old values with filler
            for (i = from; i < to; i++)
                list[i] = filler;

            return util.affectOriginal(this, list);
        },

        concat: function(){
            var i = 0,
                prev = this === InJ ? arguments[i++] : this,
                list = InJ.toArray(prev),
                args = _slice.call(arguments, i),
                len = args.length;

            for (i = 0; i < len; i++)
                // To mimic [].concat mechanics
                if (typeof args[i].length === 'number')
                    _push.apply(list, args[i]);
                else
                    _push.call(list, args[i]);

            return util.noAffectOriginal(list, prev);
        },

        filter: function(){
            var x = 0,
                i = 0,
                prev = this === InJ ? arguments[i++] : this,
                list = InJ.toArray(prev),
                method = arguments[i++],
                ctx = arguments[i],
                len = list.length,
                result = [];

            for (i = 0; i < len; i++)
                // Push result of `method` into `result`
                if (method.call(ctx, list[i], i, list) === true)
                    result[x++] = list[i];

            return util.noAffectOriginal(result, prev);
        },

        find: function(){
            var i = 0,
                prev = this === InJ ? arguments[i++] : this,
                list = InJ.toArray(prev),
                method = arguments[i++],
                ctx = arguments[i],
                len = list.length;

            for (i = 0; i < len; i++)
                // Returns target right when it is found
                if (method.call(ctx, list[i], i, list) === true)
                    return list[i];

            return null;
        },

        findIndex: function(){
            var i = 0,
                list = this === InJ ? InJ.toArray(arguments[i++]) : this,
                method = arguments[i++],
                ctx = arguments[i],
                len = list.length;

            for (i = 0; i < len; i++)
                // Returns index of target right when the target is found
                if (method.call(ctx, list[i], i, list) === true)
                    return i;

            return -1;
        },

        every: function(){
            var i = 0,
                list = this === InJ ? InJ.toArray(arguments[i++]) : this,
                method = arguments[i++],
                ctx = arguments[i];

            for (i = list.length; i--;)
                // Return false once an iteration of `method` does not return true
                if (method.call(ctx, list[i], i, list) !== true)
                    return false;

            return true;
        },

        some: function(){
            var i = 0,
                list = this === InJ ? InJ.toArray(arguments[i++]) : this,
                method = arguments[i++],
                ctx = arguments[i];

            for (i = list.length; i--;)
                // Return true once an iteration of `method` returns true
                if (method.call(ctx, list[i], i, list) === true)
                    return true;

            return false;
        },

        // Shallow search the list for target
        includes: function(){
            var i = 0,
                list = this === InJ ? InJ.toArray(arguments[i++]) : this,
                item = arguments[i++],
                from = arguments[i] || 0,
                len = list.length;

            if (typeof from !== 'number')
                throw error.invalidArgs('includes');

            from = util.parseNegativeIndex(from, len);

            for (i = from; i < len; i++)
                if (list[i] === item)
                    return true;

            return false;
        },

        map: function(){
            var i = 0,
                prev = this === InJ ? arguments[i++] : this,
                list = InJ.toArray(prev),
                method = arguments[i++],
                ctx = arguments[i],
                len = list.length,
                result = [];

            for (i = 0; i < len; i++)
                // Add result of `method` into `result`
                result[i] = method.call(ctx, list[i], i, list);

            return util.noAffectOriginal(result, prev);
        },

        reduce: function(){
            var i = 0,
                list = this === InJ ? InJ.toArray(arguments[i++]) : this,
                len = list.length,
                method = arguments[i++],
                ctx = arguments[i],
                result = [],
                store = ctx || 0;

            for (i = 0; i < len; i++)
                // Update `store` value each time the `method` is run
                store = method.call(ctx, store, list[i], i, list);

            return store;
        }

    });


    window.$ = window.InJ = InJ;

})();