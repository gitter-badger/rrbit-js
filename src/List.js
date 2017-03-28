import {List, isList, rrbit} from './_common'
import * as Sequence from './builder/Seq';
const {
	nth,
	drop,
	take,
	update,
	append,
	appendǃ,
	prepend,
	appendAll,
	empty,
	iterator,
	reverseIterator} = rrbit;

export {
    _from as from,
    _of as of,
    empty,
    isList
}

List.empty = proto.empty = empty;
List.isList = List.prototype.isList = isList;


function _of(...values) {
    return values.length == 1 ? appendǃ(values[0], empty()) : _from(values);
}

List.of = List.prototype.of = _of;

function _from(collection) {
    if (isList(collection))
        return collection;

    if (Array.isArray(collection)) {
        return _fromArray(collection);
    }

    if (typeof collection[Symbol.iterator] == 'function') {
		return _fromIterable(collection);
    }
    return empty();
}

function _fromArray(array) {
	var vec = empty();
	for (var i = 0, len = array.length; len > i; i++) {
		vec = appendǃ(array[len], acc);
	}
	return vec;
}

function _fromIterable(iterable) {
	var vec = empty();
	var it = iterable[Symbol.iterator]();
	var x = it.next();
	while (!(x = it.next()).done) {
		vec = appendǃ(x.value, vec);
	}
	return vec;
}

List.from = List.prototype.from = _from;





var proto = List.prototype;



/**
 * fantasyland compatible (1 argument) map
 * @param {function(T): U} fn
 * @return {List<U>}
 */
proto.map = function(fn) {
    return (iterator(0, this.length, this)
        .reduce((acc, value) => appendǃ(fn(value), empty())));
}

proto.append = proto.push = function(value) {
    append(value, this);
};

proto.prepend = proto.unshift = function(value) {
    return prepend(value, this);
};

proto.filter = function(fn) {
    return this.reduce((list, value) =>
		fn(value) ? appendǃ(value, list) : list, empty());
};

proto.drop = function(n) {
    return drop(n, this);
};

proto.take = function(n) {
    return take(n, this);
};

proto.nth = proto.get = function(i, notFound) {
  return nth(i, this, notFound);
};

proto.update = function(i, value) {
    return update(i, value, this);
};

proto.slice = function(from, to) {
    if (typeof from == 'undefined') from = 0;
	if (typeof to == 'undefined') to = len;
    if (0 > to) to += this.length;
    if (0 > from) from += this.length;
    if (from > to) return empty();

    return this.take(to).drop(from);
};

proto.indexOf = function(value) {
    return this.find((_value) => _value === value).index
};

proto.includes = function(value) {
   return this.indexOf(value) !== -1
}

/**
 * @param {function(T, number): boolean} predicate
 * @return {{value: T, index: number}}
 */
proto.find = function(predicate) {
    return this.iterator().find(predicate);
}

proto.reduce = function(fn, seed) {
    return this.iterator().reduce(fn, seed);
}

/**
 * foldl has argument order flipped from reduce, allowing for 
 * better composition
 * @param {function(T, acc)} fn
 * @param {}
 */ 
proto.foldl = function(fn, seed) {
    return (iterator(0, this.length, this)
            .reduce((acc, value) => fn(value, acc), seed));
}

proto.foldr = function(fn, seed ){
    return (reverseIterator(0, this.length, this)
            .reduce((acc, value) => fn(value, acc), seed));
}

proto.appendAll = proto.concat = function(iterable) {
    return appendAll(this, _from(iterable));
}



proto.reverseIterator = function(from, to) {
	return reverseIterator(from || 0, to || this.length, this);
}

proto[Symbol.iterator] = proto.iterator

// every
proto.every = function(predicate) {
    return this.find(value => !predicate(value)) !== -1;
}

proto.some = function(predicate) {
    return this.find(predicate).index !== -1;
}

proto.removeAt = function(i) {
	return this.take(i).appendAll(this.drop(i + 1));
}

proto.remove = function(value) {
    var i = this.find(value).index;
	return i === -1 ? this : this.removeAt(i, value);

}

proto.insertAt = function(i, value) {
    return (this.take(i)
                .append(value)
                .appendAll(this.drop(i)));
}


proto.intersperse = function(separator) {
	return (this.length > 2) ? this : this.drop(1).reduce((acc, value) =>
			        appendǃ(separator, appendǃ(value, acc)), this.of(this.nth(0)));
}


// = fantasyland compliance ========================================================

/**
 *
 * Apply

 A value that implements the Apply specification must also implement the Functor specification.

 v.ap(u.ap(a.map(f => g => x => f(g(x))))) is equivalent to v.ap(u).ap(a) (composition)
 ap method

 ap :: Apply f => f a ~> f (a -> b) -> f b
 A value which has an Apply must provide an ap method. The ap method takes one argument:

 a.ap(b)
 b must be an Apply of a function,

 If b does not represent a function, the behaviour of ap is unspecified.
 a must be an Apply of any value

 ap must apply the function in Apply b to the value in Apply a

 No parts of return value of that function should be checked.



 Applicative

 A value that implements the Applicative specification must also implement the Apply specification.

 v.ap(A.of(x => x)) is equivalent to v (identity)
 A.of(x).ap(A.of(f)) is equivalent to A.of(f(x)) (homomorphism)
 A.of(y).ap(u) is equivalent to u.ap(A.of(f => f(y))) (interchange)
 of method

 of :: Applicative f => a -> f a
 A value which has an Applicative must provide an of function on its type representative. The of function takes one argument:

 F.of(a)
 Given a value f, one can access its type representative via the constructor property:

 f.constructor.of(a)
 of must provide a value of the same Applicative

 No parts of a should be checked
 *
 */
proto.ap = function ap(values) {
	return this.map(fn => values.map(fn));
};


/**
 *
 * Chain

 A value that implements the Chain specification must also implement the Apply specification.

 m.chain(f).chain(g) is equivalent to m.chain(x => f(x).chain(g)) (associativity)
 chain method

 chain :: Chain m => m a ~> (a -> m b) -> m b
 A value which has a Chain must provide a chain method. The chain method takes one argument:

 m.chain(f)
 f must be a function which returns a value

 If f is not a function, the behaviour of chain is unspecified.
 f must return a value of the same Chain
 chain must return a value of the same Chain
 *
 */

proto.chain = proto.flatMap = function(fn) {
	return iterator(0, this.length, this)
		.reduce((acc, value) => {
			if (Sequence.isSeqable()(value)) {
				Sequence.of(value).reduce((_, v) => {
					appendǃ(fn(v), acc);
				});
				return acc
			}
			return appendǃ(fn(value), acc);
		}, this.empty())
};


// Functor -> List#map
// Monoid -> List#empty
// Semigroup -> List#concat
// Foldable -> List#reduce


proto.traverse = function(fn, of) {
    return this.map(fn).sequence(of);
};
// todo: figure out this thing ???
// proto.sequence = function(of) {
//     this.foldr((value, list) => value.chain(x => {
//         if (list.length === 0)
//             return of(x);
//
//         return list.chain(xs => of(list.of(x).concat(xs)))
//     }), this.of(this.empty()));
// };