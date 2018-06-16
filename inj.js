(function(){

    'use strict';

    var proto = [],
        _slice = proto.slice,
        _splice = proto.splice,
        _push = proto.push;

    var polyfill = {
        CustomEvent: function(event, param){
            var ev = document.createEvent('CustomEvent');
            param = param || {
                bubbles: false,
                cancalable: false,
                detail: undefined
            };
            ev.initCustomEvent(event, param.bubbles, param.cancalable, param.detail);
            return ev;
        }
    }

    var error = {
        noArgs: function(name){
            return new TypeError(util.method(name) + ' is called without argument.');
        },
        insufficientArgs: function(name, needed, given){
            return new TypeError(util.method(name) + ' is called with insufficient arguments.' + needed + ' is needed, only ' + given + ' given.');
        },
        invalidArgs: function(name){
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
                value: typeof method !== 'function'
                    ? method
                    : function(){
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


    InJ.init.constructor = InJ;
    InJ.init.prototype.constructor = InJ;


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


    // INTERNAL USE METHODS
    InJ.define({

        toStack: function(){
            var prev,
                i = 0,
                inst = this,
                vals = InJ.toArray(arguments[i++]),
                updatePrev = arguments[i],
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
        },

        bindApply: function(){
            var len,
                i = 0,
                item = this === InJ ? arguments[i++] : this.prev,
                func = arguments[i++],
                bind = arguments[i++],
                apply = InJ.toArray(arguments[i]);

            // First loop to bind know length of arguments
            i = 0;
            len = bind.length;
            for (; i < len;)
                func = func.bind(item, bind[i++]);

            // Second loop to apply following unpredictable length of arguments
            i = 0;
            len = item ? item.length || 1 : 1;
            for (; i < len; i++)
                func.apply(item ? item[i] || item : item, apply);

            return this;
        }

    });


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
                return null;

            return subject.constructor;
        },

        toArray: function(){
            var ret,
                i = 0,
                item = this === InJ ? arguments[i++] : this,
                flatten = arguments[i];

            /* Use long if-elseif-else to sequentially eliminate possibilities */
            /* Sequence must remain for it to work properly */
            /* Do not alter the sequence */

            if (item !== this && arguments.length < 1)
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

            return flatten === true
                ? InJ.flatten(ret, true)
                : ret;

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
        },

        flatten: function(){
            var i = 0,
                prev = this === InJ ? arguments[i++] : this,
                toArray = arguments[i],
                list = InJ.toArray(prev),
                len = list.length,
                result = [],
                flatten = function(val){
                    var x, l;

                    // Only runs on array-like object except String, HTMLSelectElement and HTMLFormElement
                    if (InJ.isArrayLike(val) && val.constructor !== String && val.constructor !== HTMLSelectElement && val.constructor !== HTMLFormElement)
                        for (x = 0, l = val.length; x < l; x++)
                            flatten(val[x]);
                    else
                        result.push(val);
                };

            for (i = 0; i < len; i++)
                flatten(list[i]);

            return toArray === true
                ? result
                : util.noAffectOriginal(result, prev);
        },

        loop: function(){
            var i = 0,
                len = arguments[i++],
                callback = arguments[i++],
                ctx = arguments[i],
                result = [];

            if (this !== InJ)
                throw error.chained('loop');

            for (i = 0; i < len; i++)
                result[i] = callback.call(ctx, i);

            return InJ(result);
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

            return util.affectOriginal(this, result);
        },

        // Deep search the list for target
        contains: function(){
            var i = 0,
                list = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                item = arguments[i++],
                from = arguments[i] || 0,
                len = list.length;

            if (typeof from !== 'number')
                throw error.invalidArgs('contains');

            from = util.parseNegativeIndex(from, len);

            for (i = from; i < len; i++)
                if (list[i] === item)
                    return true;

            return false;
        },

        first: function(){
            var i = 0,
                prev = this === InJ ? arguments[i++] : this,
                elem = InJ.toArray(prev),
                result = elem[0];
            return util.noAffectOriginal(result, prev);
        },

        last: function(){
            var i = 0,
                prev = this === InJ ? arguments[i++] : this,
                elem = InJ.toArray(prev),
                result = elem[elem.length - 1];
            return util.noAffectOriginal(result, prev);
        },

        unique: function(){
            var i = 0,
                prev = this === InJ ? arguments[i] : this,
                list = InJ.toArray(prev),
                result = [],
                len = list.length;

            for (; i < len; i++)
                if (list.indexOf(list[i]) === i)
                    result.push(list[i]);

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
                    return util.noAffectOriginal(list[i], prev);

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
                store = ctx || 0;

            for (i = 0; i < len; i++)
                // Update `store` value each time the `method` is run
                store = method.call(ctx, store, list[i], i, list);

            return store;
        }

    });


    // InJ METHODS FOR DOM
    InJ.define({

        ready: function(){
            var i = 0,
                elem = document,
                callback = arguments[i++],
                args = _slice.call(arguments, i);

            if (typeof callback !== 'function')
                throw error.invalidArgs('ready');

            // To supply `elem` as `this` to `callback`
            args.unshift(elem);

            callback = callback.bind.apply(callback, args);

            if (elem.readyState !== 'loading')
                callback();
            else
                InJ.once(elem, 'DOMContentLoaded', callback);

            return util.noReturn(this, elem);
        },

        once: function(){
            var el,
                action,
                remove,
                args,
                x,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                event = InJ.toArray(arguments[i++], true),
                callback = arguments[i++],
                options = _slice.call(arguments, i),
                l = event.length;

            for (i = elem.length; i--;){
                el = elem[i];
                for (x = l; x--;){
                    action = event[x];

                    // To remove event listener after `callback` is called
                    remove = function(e){
                        callback(e);
                        InJ.bindApply(el, el.removeEventListener, args, options);
                    };
                    args = [action, remove];

                    InJ.bindApply(el, el.addEventListener, args, options);
                }
            }

            return util.noReturn(this, elem);
        },

        on: function(){
            var l,
                x,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                event = InJ.toArray(arguments[i++], true),
                callback = arguments[i++],
                options = _slice.call(arguments, i),
                l = event.length;

            for (i = elem.length; i--;)
                for (x = l; x--;)
                    InJ.bindApply(elem[i], elem[i].addEventListener, [event[x], callback], options);

            return util.noReturn(this, elem);
        },

        off: function(){
            var l,
                x,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                event = InJ.toArray(arguments[i++], true),
                callback = arguments[i++],
                options = _slice.call(arguments, i),
                l = event.length;

            for (i = elem.length; i--;)
                for (x = l; x--;)
                    InJ.bindApply(elem[i], elem[i].removeEventListener, [event[x], callback], options);

            return util.noReturn(this, elem);
        },

        dispatch: function(){
            var CustomEvent,
                init,
                x,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                event = InJ.toArray(arguments[i++], true),
                options = _slice.call(arguments, i),
                len = elem.length,
                l = event.length;

            if (InJ.isObject(options[0]))
                init = options[0];
            else
                init = {
                    bubbles: options[0] || undefined,
                    cancalable: options[1] || undefined,
                    composed: options[2] || undefined,
                    scoped: options[2] || undefined
                };

            CustomEvent = typeof window.CustomEvent !== 'function'
                ? polyfill.CustomEvent
                : window.CustomEvent;

            for (i = 0; i < len; i++)
                for (x = 0; x < l; x++)
                    // CustomEvent also works with native Event types
                    elem[i].dispatchEvent(new CustomEvent(event[x], init));

            return util.noReturn(this, elem);
        },

        select: function(){
            var list,
                x,
                l,
                i = 0,
                prev = this === InJ
                    ? !InJ.isDOMContent(arguments[i]) && !(arguments[i] instanceof InJ.init)
                        ? document      // Defaults to `document` if no anchor is provided
                        : arguments[i++]
                    : this,
                elem = this === InJ ? InJ.toArray(prev, true) : this,
                selector = arguments[i],
                len = elem.length,
                result = [];

            for (i = 0; i < len; i++){
                list = elem[i].querySelectorAll(selector);
                l = list.length;
                for (x = 0; x < l; x++)
                    // Prevent duplicate
                    if (result.indexOf(list[x]) < 0)
                        result.push(list[x]);
            }

            return util.noAffectOriginal(result, prev);
        },

        byId: function(){
            var result, args, i;

            if ((this instanceof InJ.init) && !$.isEmpty(this))
                throw error.chained('byId');

            // Handle any type of arguments for the for-loop below
            args = InJ.toArray(arguments, true);
            result = [];
            i = args.length;

            for (; i--;)
                result[i] = document.getElementById(args[i]);

            return util.noAffectOriginal(result, document);
        },

        byClass: function(){
            var list,
                x,
                g,
                n,
                cls,
                i = 0,
                prev = this === InJ
                    ? !InJ.isDOMContent(arguments[i]) && !(arguments[i] instanceof InJ.init)
                        ? document      // Defaults to `document` if no anchor is provided
                        : arguments[i++]
                    : this,
                elem = this === InJ ? InJ.toArray(prev, true) : this,
                className = _slice.call(arguments, i),
                len = elem.length,
                l = className.length,
                result = [];

            for (i = 0; i < len; i++){
                for (x = 0; x < l; x++){
                    cls = className[x];

                    if (typeof cls !== 'string')
                        throw error.invalidArgs('byClass');

                    list = elem[i].getElementsByClassName(cls);
                    g = list.length;

                    for (n = 0; n < g; n++)
                        //Prevent duplication
                        if (result.indexOf(list[n]) < 0)
                            result.push(list[n]);
                }
            }

            return util.noAffectOriginal(result, prev);
        },

        byTag: function(){
            var list,
                x,
                g,
                n,
                tag,
                i = 0,
                prev = this === InJ
                       ? !InJ.isDOMContent(arguments[i]) && !(arguments[i] instanceof InJ.init)
                         ? document         // Defaults to `document` if no anchor is provided
                         : arguments[i++]
                       : this,
                elem = this === InJ ? InJ.toArray(prev, true) : this,
                tagName = _slice.call(arguments, i),
                len = elem.length,
                l = tagName.length,
                result = [];
                
            for (i = 0; i < len; i++){

                for (x = 0; x < l; x++){

                    tag = tagName[x];

                    if (typeof tag !== 'string')
                        continue;

                    list = elem[i].getElementsByTagName(tag);
                    g = list.length;

                    for (n = 0; n < g; n++)
                        // Prevent duplication
                        if (result.indexOf(list[n]) < 0)
                            result.push(list[n]);

                }

            }

            return util.noAffectOriginal(result, prev);
        },

        byName: function(){
            var list,
                x,
                g,
                n,
                nm,
                i = 0,
                prev = this === InJ
                       ? !InJ.isDOMContent(arguments[i]) && !(arguments[i] instanceof InJ.init)
                         ? document         // Defaults to `document` if no anchor is provided
                         : arguments[i++]
                       : this,
                elem = this === InJ ? InJ.toArray(prev, true) : this,
                name = _slice.call(arguments, i),
                len = elem.length,
                l = name.length,
                result = [];
                
            for (i = 0; i < len; i++){

                for (x = 0; x < l; x++){

                    nm = name[x];

                    if (typeof nm !== 'string')
                        continue;

                    list = elem[i].getElementsByName(nm);
                    g = list.length;

                    for (n = 0; n < g; n++)
                        // Prevent duplication
                        if (result.indexOf(list[n]) < 0)
                            result.push(list[n]);

                }

            }

            return util.noAffectOriginal(result, prev);
        },

        setAttr: function(){
            var el,
                x,
                l,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                attr = arguments[i++],
                val = arguments[i++];

            i = elem.length;

            switch (InJ.constructorOf(attr)){
                case String:
                    for (; i--;)
                        elem[i].setAttribute(attr, val);
                    break;

                case Object:
                    for (; i--;){
                        el = elem[i];
                        for (x in attr)
                            el.setAttribute(x, attr[x]);
                    }
                    break;

                case Array:
                    for (l = attr.length; i--;){
                        el = elem[i];
                        for (x = l; x--;)
                            el.setAttribute(attr[x], val[x]);
                    }
                    break;

                default:
                    throw error.invalidArgs('setAttr');
            }

            return util.noReturn(this, elem);
        },

        removeAttr: function(){
            var x,
                l,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                attr = _slice.call(arguments, i);

            attr = InJ.flatten(attr, true);
            l = attr.length;
            i = elem.length;

            for (; i--;)
                for (x = l; x--;)
                    elem[i].removeAttribute(attr[x]);

            return util.noReturn(this, elem);
        },

        getAttr: function(){
            var i = 0,
                prev = this === InJ ? arguments[i++] : this,
                elem = this === InJ ? InJ.toArray(prev, true) : this,
                attr = arguments[i],
                result = [];

            for (i = elem.length; i--;)
                result[i] = elem[i].getAttribute(attr);

            return util.noAffectOriginal(result, prev);
        },

        hasAttr: function(){
            var x,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                attr = _slice.call(arguments, i),
                l = attr.length;

            i = elem.length;

            if (!i)
                return false;

            for (; i--;)
                for (x = l; x--;)
                    // If any `elem` is lacking any `attr`, return false right away
                    if (elem[i].getAttribute(attr[x]) === null)
                        return false;

            return true;
        },

        addClass: function(){
            var el,
                className,
                cls,
                x,
                ind,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                classes = InJ.flatten(_slice.call(arguments, i), true);

            className = classes.join(' ');

            for (i = elem.length; i--;){
                el = elem[i];

                // Retrieves existing classes
                cls = el.getAttribute('class');
                cls = cls ? cls + ' ' : '';

                // Adds new classes to existing classes
                cls += className;

                // Removes duplicating classes
                cls = cls.split(' ');
                for (x = cls.length; x--;){
                    // Get the index of the first occurrance
                    ind = cls.indexOf(cls[x]);

                    // Get the index of the next occurrance
                    ind = cls.indexOf(cls[x], ind + 1);

                    // If there is a next occurrance, remove it
                    if (ind >= 0)
                        cls.splice(ind, 1);
                }
                cls = cls.join(' ');

                el.setAttribute('class', cls);
            }

            return util.noReturn(this, elem);
        },

        removeClass: function(){
            var x,
                l,
                el,
                regexp,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                className = InJ.flatten(_slice.call(arguments, i), true),
                l = className.length;

            i = elem.length;

            if (elem[i - 1].classList){

                for (; i--;){
                    el = elem[i];
                    for (x = 0; x < l; x++)
                        el.classList.remove(className[x]);
                }

            } else {

                // Dynamic RegExp from `className`
                regexp = new RegExp('(^|\\b)' + className.join('|') + '(\\b|$)', 'gi');
                for (; i--;){
                    el = elem[i];
                    el.className = el.className.replace(regexp, ' ');
                }

            }

            return util.noReturn(this, elem);
        },

        toggleClass: function(){
            var el,
                elCls,
                cls,
                x,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                className = InJ.flatten(_slice.call(arguments, i), true),
                l = className.length;

            for (i = elem.length; i--;){

                el = elem[i];
                elCls = el.className.split(' ');

                for (x = 0; x < l; x++){

                    cls = className[x];

                    if (elCls.indexOf(cls) >= 0)
                        InJ.removeClass(el, cls);
                    else
                        InJ.addClass(el, cls);

                }

            }

            return util.noReturn(this, elem);
        },

        hasClass: function(){
            var x,
                el,
                elCls,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                className = InJ.flatten(_slice.call(arguments, i), true),
                l = className.length;

            i = elem.length;

            if (!i)
                return false;

            for (; i--;){
                el = elem[i];
                elCls = InJ.toArray(el.classList || el.className, true);

                for (x = l; x--;)
                    // If any `className` is absent in any `elem`, returns false right away
                    if (elCls.indexOf(className[x]) < 0)
                        return false;
            }

            return true;
        },

        create: function(){
            var i = 0,
                elem = arguments[i++],
                number = $.isNOU(arguments[i]) ? i : arguments[i],
                created = [];

            if ((this instanceof InJ.init) && this.length > 0)
                throw error.chained('create');

            if (typeof elem !== 'string' || (typeof number !== 'number' || number < 1))
                throw error.invalidArgs('create');

            for (i = number; i--;)
                created[i] = document.createElement(elem);

            return InJ(created);
        },

        clone: function(){
            var clone = [],
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                deep = arguments[i] || false,
                len = elem.length;

            // If `elem` is not array-like
            if (!len)
                clone[i] = elem.cloneNode(deep);
            else
                for (; i < len; i++)
                    clone[i] = elem[i].cloneNode(deep);

            return util.noAffectOriginal(clone, elem);
        },

        // PARENT.append(CHILDREN)
        append: function(){
            var len,
                x,
                i = 0,
                parent = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                children = InJ.flatten(_slice.call(arguments, i), true),
                fragment = document.createDocumentFragment(),
                len = parent.length,
                l = children.length;

            // Append child elements to fragment
            for (x = 0; x < l; x++)
                fragment.appendChild(children[x]);

            // Append fragment to parents
            for (i = 0; i < len; i++){
                /**
                 * If is not last iteration
                 *  append the cloned `fragment`
                 * else
                 *  append the `fragment`
                 */
                parent[i].appendChild(
                    len !== (i + 1)
                        ? fragment.cloneNode(true)
                        : fragment
                );
            }

            return util.noReturn(this, parent);
        },

        // CHILDREN.appendTo(PARENT)
        appendTo: function(){
            var x,
                i = 0,
                children = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                parent = InJ.flatten(_slice.call(arguments, i), true),
                fragment = document.createDocumentFragment(),
                len = parent.length,
                l = children.length;

            for (i = 0; i < len; i++){

                for (x = 0; x < l; x++){
                    /**
                     * If is not last iteration
                     *  append cloned `children` to `fragment`
                     * else
                     *  append `children` to `fragment`
                     */
                    fragment.appendChild(
                        len !== (i + 1)
                            ? children[x].cloneNode(true)
                            : children[x]
                    );
                }

                parent[i].appendChild(fragment);

            }

            return util.noReturn(this, children);
        },

        // PARENT.prepend(CHILDREN)
        prepend: function(){
            var x,
                par,
                i = 0,
                parent = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                children = InJ.flatten(_slice.call(arguments, i), true),
                fragment = docment.createDocumentFragment(),
                len = parent.length,
                l = children.length;

            // Append child elements to `fragment`
            for (x = 0; x < l; x++)
                fragment.appendChild(children[x]);

            // Append fragment to parents
            for (i = 0; i < len; i++){
                par = parent[i];

                /**
                 * If is not last iteration
                 *  prepend the cloend `fragment`
                 * else
                 *  prepend the `fragment`
                 */
                par.insertBefore(
                    len !== (i + 1) ? fragment.cloneNode(true) : fragment,
                    par.children[0]
                )
            }

            return util.noReturn(this, parent);
        },

        // CHILDREN.prependTo(PARENT)
        prependTo: function(){
            var x,
                par,
                i = 0,
                children = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                parent = InJ.flatten(_slice.call(arguments, i), true),
                fragment = document.createDocumentFragment(),
                len = parent.length,
                l = children.length;

            for (i = 0; i < len; i++){
                par = parent[i];

                for (x = 0; x < l; x++){
                    /**
                     * If is not last iteration
                     *  prepend cloned `children` to `fragment
                     * else
                     *  prepend `children` to `fragment`
                     */
                    fragment.appendChild(
                        len !== (i + 1)
                            ? children[x].cloneNode(true)
                            : children[x]
                    );
                }

                par.insertBefore(fragment, par.children[0]);
            }

            return util.noReturn(this, children);
        },

        // PARENT.insert(CHILDREN, afterThisIndex)
        insert: function(){
            var siblings,
                x,
                l,
                par,
                i = 0,
                parent = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                children = InJ.toArray(arguments[i++], true),
                index = arguments[i],
                len = parent.length,
                l = children.length,
                fragment = document.createDocumentFragment();

            // Append `children` to `fragment`
            for (x = 0; x < l; x++)
                fragment.appendChild(children[x]);

            for (i = 0; i < len; i++){
                par = parent[i];
                siblings = par.children;

                /**
                 * If is not last iteration
                 *  insert the cloned `fragment`
                 * else
                 *  insert the `fragment`
                 */
                par.insertBefore(
                    len !== (i + 1) ? fragment.cloneNode(true) : fragment,
                    siblings[index + 1]
                )
            }

            return util.noReturn(this, parent);
        },

        // PARENT.insert(CHILDREN, beforeThisIndex)
        insertBefore: function(){
            var siblings,
                x,
                l,
                par,
                i = 0,
                parent = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                children = InJ.toArray(arguments[i++], true),
                index = arguments[i],
                l = children.length,
                fragment = document.createDocumentFragment();

            // Append `children` to `fragment`
            for (x = 0; x < l; x++)
                fragment.appendChild(children[x]);

            for (i = parent.length; i--;){
                par = parent[i];
                siblings = par.children;

                /**
                 * If is not last iteration
                 *  insert the cloned `fragment`
                 * else
                 *  insert the `fragment`
                 */
                par.insertBefore(
                    len !== (i + 1) ? fragment.cloneNode(true) : fragment,
                    siblings[index]
                );
            }

            return util.noReturn(this, parent);
        },

        remove: function(){
            var i,
                trash = this === InJ ? InJ.toArray(arguments[0], true) : this,
                bin = [];

            // Collect removed items into bin
            for (i = trash.length; i--;)
                bin[i] = trash[i].parentElement.removeChild(trash[i]);

            // Returns removed items
            return util.noAffectOriginal(bin, trash);
        },

        empty: function(){
            var x,
                par,
                child,
                i = 0,
                parent = this === InJ ? InJ.toArray(arguments[0], true) : this;

            for (i = parent.length; i--;){
                par = parent[i];
                child = par.children;

                // Removes all children from `parent`
                for(x = child.length; x--;)
                    par.removeChild(child[x]);
            }

            // Returns `parent`
            return util.noReturn(this, parent);
        },

        css: function(){
            var el,
                len,
                key,
                i = 0,
                elem = this === InJ ? InJ.toArray(arguments[i++], true) : this,
                prop = arguments[i++],
                val = arguments[i],
                obj = {};

            // Turns settings into object
            switch (InJ.constructorOf(prop)){
                case Object:
                    obj = prop;
                    break;

                case String:
                    obj[prop] = val;
                    break;

                case Array:
                    len = prop.length;
                    for (i = 0; i < len; i++)
                        obj[prop[i]] = val[i];
                    break;

                default:
                    throw invalidArgs('css');
            }

            // Set style
            for (i = elem.length; i--;){
                el = elem[i];
                for (key in obj)
                    el.style[key] = obj[key];
            }

            return util.noReturn(this, elem);
        },

        html: function(){
            var html,
                prev,
                elem,
                string,
                len,
                i = 0;

            if (this === InJ){
                prev = arguments[i++];
                elem = InJ.toArray(prev, true);
            } else {
                prev = this;
                elem = this;
            }

            string = String(arguments[i]);
            len = elem.length;

            /**
             * If value is not provided in argument
             *  get elem's innerHTML
             * else
             *  set elem's innerHTML
             */
            if (arguments.length === i){

                html = [];

                for (i = 0; i < len; i++)
                    html[i] = elem[i].innerHTML;

                return util.noAffectOriginal(html, prev);

            }

            for (i = 0; i < len; i++)
                elem[i].innerHTML = string;

            return util.noReturn(this, elem);
        },

        text: function(){
            var text,
                prev,
                elem,
                string,
                len,
                i = 0;

            if (this === InJ){
                prev = arguments[i++];
                elem = InJ.toArray(prev, true);
            } else {
                prev = this;
                elem = this;
            }

            string = String(arguments[i]);
            len = elem.length;

            /**
             * If value is not provided in argument
             *  get elem's innerText
             * else
             *  set elem's innerText
             */
            if (arguments.length === i){

                text = [];

                for (i = 0; i < len; i++)
                    text[i] = elem[i].innerText;

                return util.noAffectOriginal(text, prev);

            }

            for (i = 0; i < len; i++)
                elem[i].innerText = string;

            return util.noReturn(this, elem);
        },

        previous: function(){
            var sib,
                prev,
                elem,
                len,
                i = 0,
                result = [];

            if (this === InJ){
                prev = arguments[i];
                elem = InJ.toArray(prev, true);
            } else {
                prev = this;
                elem = this;
            }

            for (len = elem.length; i < len; i++)
                // Only push to `result` if there is a previous sibling
                if (sib = elem[i].previousElementSibling)
                    // Prevent duplication
                    if (result.indexOf(sib) < 0)
                        result.push(sib);

            return util.noAffectOriginal(result, prev);
        },

        next: function(){
            var sib,
                prev,
                elem,
                len,
                i = 0,
                result = [];

            if (this === InJ){
                prev = arguments[i];
                elem = InJ.toArray(prev, true);
            } else {
                prev = this;
                elem = this;
            }

            for (len = elem.length; i < len; i++)
                // Only push to `result` if there is a next sibling
                if (sib = elem[i].nextElementSibling)
                    // Prevent duplication
                    if (result.indexOf(sib) < 0)
                        result.push(sib);

            return util.noAffectOriginal(result, prev);
        },

        parent: function(){
            var par,
                prev,
                elem,
                len,
                i = 0,
                result = [];

            if (this === InJ){
                prev = arguments[i];
                elem = InJ.toArray(prev, true);
            } else {
                prev = this;
                elem = this;
            }

            for (len = elem.length; i < len; i++)
                // Only push to `result` if there is a parent
                if (par = elem[i].parentElement)
                    // Prevent duplication
                    if (result.indexOf(par) < 0)
                        result.push(par);

            return util.noAffectOriginal(result, prev);
        },

        children: function(){
            var x,
                l,
                child,
                prev,
                elem,
                len,
                i = 0,
                result = [];

            if (this === InJ){
                prev = arguments[i++];
                elem = this;
            } else {
                prev = this;
                elem = this;
            }

            for (i = 0, len = elem.length; i < len; i++){
                child = elem[i].children;
                l = child.length;

                // Push children of each `elem` to `result`
                for (x = 0; x < l; x++)
                    // Prevent duplication
                    if (result.indexOf(child[x]) < 0)
                        result.push(child[x]);
            }

            return util.noAffectOriginal(result, prev);
        },

        siblings: function(){
            var prev,
                elem,
                inclusive,
                len,
                i = 0,
                result = [];

            if (this === InJ){
                prev = arguments[i++];
                elem = InJ.toArray(prev, true);
            } else {
                prev = this;
                elem = this;
            }

            inclusive = arguments[i];
            len = elem.length;

            for (i = 0; i < len; i++){
                // Turns children into array so that it can be spliced
                result[i] = InJ.toArray(elem[i].parentElement.children);

                // Removes `elem` from `result` if is not inclusive
                if (inclusive !== true)
                    result[i].splice(result[i].indexOf(elem[i]), 1);
            }

            result = InJ.flatten(result, true);
            
            // Deduplication
            result = result.filter(function(v, i, a){
                return a.indexOf(v) === i;
            });

            return util.noAffectOriginal(result, prev);
        },

        hasChildren: function(){
            var elem = this === InJ ? InJ.toArray(arguments[0], true) : this,
                i = elem.length;

            for (; i--;)
                if (elem[i].children.length > 1)
                    return true;

            return false;
        },

        hasSiblings: function(){
            var elem = this === InJ ? InJ.toArray(arguments[0], true) : this,
                i = elem.length;

            for (; i--;)
                if (elem[i].parentElement.children.length > 1)
                    return true;

            return false;
        },

        ancestors: function(){
            var prev,
                elem,
                until,
                i = 0,
                result = [];

            if (this === InJ){
                prev = arguments[i++];
                elem = InJ.toArray(prev, true);
            } else {
                prev = this;
                elem = this;
            }

            until = arguments[i] || document.body.parentElement;

            if (typeof until === 'number')
                (function loop(elem, count){

                    var par,
                        parent = [],
                        len = elem.length,
                        i = 0;

                    for (; i < len; i++){

                        // Skip the loop if `elem[i]` has no parent
                        if (!(par = elem[i].parentElement))
                            continue;

                        // Record parent
                        parent.push(par);

                        // Prevent duplication
                        if (result.indexOf(par) < 0)
                            result.push(par);

                    }

                    // If count > 0 && parent.length > 0, continue the loop
                    if (count > 0 && parent.length > 0)
                        return loop(parent, --count);

                })(elem, --until);
            else
                (function traverse(elem, until){

                    var par,
                        parent = [],
                        len = elem.length,
                        i = 0;

                    for (; i < len; i++){

                        // Break the loop if the traversion reaches `until`
                        if (elem[i] === until)
                            break;

                        // Skip the loop if `elem[i]` has no parent
                        if (!(par = elem[i].parentElement))
                            continue;

                        // Record parent
                        parent.push(par);

                        // Prevent duplication of result
                        if (result.indexOf(par) < 0)
                            result.push(par);
                    }

                    // If there are recorded parents, traverse the parents
                    if (parent.length > 0)
                        return traverse(parent, until);

                })(elem, until);

            return util.noAffectOriginal(result, prev);
        },

        descendants: function(){
            var prev,
                elem,
                until,
                len,
                i = 0,
                result = [];

            if (this === InJ){
                prev = arguments[i++];
                elem = InJ.toArray(prev, true);
            } else {
                prev = this;
                elem = this;
            }

            until = arguments[i];
            len = elem.length;

            for (i = len; i--;)
                // Get all child eements of elem[i]
                result.push(elem[i].getElementsByTagName('*'));

            result = InJ.flatten(result, true);

            if (until && InJ.includes(result, until))
                // Removes the chuck of elements after the `until` limiter
                result.splice(result.indexOf(until));

            return util.noAffectOriginal(result, prev);
        },

        checked: function(){
            var b,
                prev,
                box,
                len,
                i = 0,
                result = [];

            if (this === InJ){
                prev = arguments[i];
                box = InJ.toArray(prev, true);
            } else {
                prev = this;
                box = this;
            }

            for (len = box.length; i < len; i++){
                b = box[i];
                if (b.checked === true && result.indexOf(b) < 0)
                    result.push(b);
            }

            return util.noAffectOriginal(result, prev);
        },

        isChecked: function(){
            var el,
                type,
                i = 0,
                box = this === InJ ? InJ.toArray(arguments[i], true) : this,
                result = [];

            i = box.length;

            if (!i)
                throw error.empty('isChecked');

            for (i = box.length; i--;){
                el = box[i];

                // Check if `el` is <input>
                if ($.constructorOf(el) !== HTMLInputElement)
                    throw error.invalidArgs('isChecked');

                type = el.getAttribute('type');

                // Check if `el` is <input type="checkbox|radio">
                if (type !== 'checkbox' && type !== 'radio')
                    throw error.invalidArgs('isChecked');

                result[i] = el.checked;
            }

            return result.length === 1
                ? result[0]
                : !InJ.includes(result, false);
        },

        ajax: function(){
            var ajax = new XMLHttpRequest(),
                defaults = {
                    type: 'POST',
                    url: '',
                    data: {},
                    success: function(){},
                    fail: function(){},
                    mime: 'application/x-www-form-urlencoded',
                    charset: 'UTF-8',
                    async: true
                },
                parse = function(s){
                    // If is object, parse
                    return /^(\u007b)(((.)+(\u007d)$)|(\u007d)$)/g.test(s)
                        ? JSON.parse(s)
                        : s;
                },
                querify = function(obj){
                    var val,
                        key,
                        qs = '';

                    for (key in obj){
                        if(obj.hasOwnProperty(key)){
                            val = obj[key];

                            // Stringify if is not string
                            if (!InJ.toString(val))
                                val = JSON.stringify(val);
                                
                            val = encodeURIComponent(val);
                            key = encodeURIComponent(key);

                            if (!qs)
                                qs = key + '=' + val;
                            else
                                qs += '&' + key + '=' + val;
                        }
                    }

                    return qs;
                },
                config = InJ.extend({}, defaults, arguments[0]);

            if (!$.isObject(arguments[0]))
                throw error.invalidArgs('ajax');

            config.type = config.type.toUpperCase();
            config.charset = config.charset.toUpperCase();

            // Querify data if needed
            if (typeof config.data !== 'string' && (config.type === 'GET' || config.mime === 'application/x-www-form-urlencoded')){
                config.data = querify(config.data);
                if (config.type === 'GET' || config.type === 'DELETE')
                    config.url += (/\u003F(\S){1,}\u003D(\S){1,}/ig.test(config.url) ? '&' : '?') + config.data;
            }

            ajax.addEventListener('readystatechange', function(){
                if (this.readyState !== 4) return;
                if (this.status === 200)
                    config.success(parse(this.response), this.status, this.statusText);
                else
                    config.fail(parse(this.response), this.status, this.statusText);
            });

            ajax.open(config.type, config.url, config.async);
            switch (config.type){
                case 'GET':
                    ajax.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=' + config.charset);
                    ajax.send();
                    break;
                case 'POST':
                case 'PUT':
                    ajax.setRequestHeader('Content-Type', config.mime + '; charset=' + config.charset);
                    ajax.send(config.data);
                    break;
                case 'DELETE':
                    ajax.setRequestHeader('Content-Type', config.mime + '; charset=' + config.charset);
                    ajax.send(typeof config.data === 'string' ? null : config.data);
                    break;
                default:
                    throw new TypeError('Invalid HTTP request method: ' + config.type);
            }

            return ajax;
        }

    });


    // InJ METHODS FOR OBJECT
    InJ.define({

        keys: function(){
            var k,
                obj,
                i = 0,
                list = this === InJ ? InJ.toArray(arguments) : this,
                len = list.length,
                result = [];

            for (; i < len; i++){
                obj = list[i];
                for (k in obj)
                    if (obj.hasOwnProperty(k))
                        result.push(k);
            }

            return util.noAffectOriginal(result, list);
        },

        values: function(){
            var k,
                obj,
                i = 0,
                list = this === InJ ? InJ.toArray(arguments) : this,
                len = list.length,
                result = [];

            for (; i < len; i++){
                obj = list[i];
                for (k in obj)
                    if (obj.hasOwnProperty(k))
                        result.push(obj[k]);
            }

            return util.noAffectOriginal(result, list);
        },

        entries: function(){
            var k,
                obj,
                i = 0,
                list = this === InJ ? InJ.toArray(arguments) : this,
                len = list.length,
                result = [];

            for (; i < len; i++){
                obj = list[i];
                for (k in obj)
                    if (obj.hasOwnProperty(k))
                        result.push([k, obj[k]]);
            }

            return util.noAffectOriginal(result, list);
        },

        extend: function(){
            var key,
                target,
                i = 0,
                len = arguments.length;

            if (!len)
                throw error.empty('extend');

            target = arguments[i++];

            for (; i < len; i++)
                for (key in arguments[i])
                    // Shallow copy and overwrite key/value into target
                    target[key] = arguments[i][key];

            return target;
        },

        deepExtend: function(){
            var key,
                obj,
                val,
                i = 0,
                result = arguments[i++],
                len = arguments.length;

            result = result = {};

            for (; i < len; i++){
                obj = arguments[i];
                if (!obj)
                    continue;

                for (key in obj){
                    if (!obj.hasOwnProperty(key))
                        continue;

                    switch (InJ.constructorOf(obj[key])){
                        case Object:
                            // Deep extend descending objects
                            val = InJ.deepExtend(result[key], obj[key]);
                            break;

                        case Array:
                        case InJ:
                            // Deep copy arrays and InJ instance
                            val = InJ.copy(obj[key]);
                            break;

                        default:
                            if (InJ.isDOMContent(obj[key]))
                                if (InJ.isArrayLike(obj[key]))
                                    val = obj[key];
                                else
                                    val = obj[key].cloneNode(true);
                            else
                                val = obj[key];
                    }

                    result[key] = val;
                }
            }

            return result;
        }

    });


    window.$ = window.InJ = InJ;

})();