###
Tests for the SQL query expression builder.
###

vows = require "vows"
assert = require "assert"
kSqlExpression = (require "../ksql").expression


suite = vows.describe("SQL expression builder")


funcAssertObjInstance = (obj) ->
    assert.instanceOf obj, kSqlExpression

contextAssertObjInstance = (topic) ->
    topic: topic
    'the object instance is returned': funcAssertObjInstance

contextAssertStringEqual = (expectedStr) ->
    ret = { topic: (obj) -> obj.toString() }
    ret["the string matches: #{expectedStr}"] = (str) ->
        assert.strictEqual str, expectedStr
    ret


suite.addBatch
    'when the builder is initialized':
        topic: new kSqlExpression()
        'calling toString() gives an empty string': (builder) ->
            assert.isEmpty builder.toString()
        'calling end() throws an error': (builder) ->
            assert.throws builder.end, Error
    'when begin() gets called':
        topic: new kSqlExpression().begin()
        'the object instance is returned': funcAssertObjInstance
        'calling toString() throws an error':  (obj) ->
            assert.throws obj.toString, Error
    'when begin() gets called followed by end()':
        topic: new kSqlExpression().begin().end()
        'the object instance is returned': funcAssertObjInstance
        'calling toString() gives an empty string': (obj) ->
            assert.isEmpty obj.toString()



contextBadArgError = (func, arg) ->
    topic: ->
        try
            switch func
                when 'and' then new kSqlExpression().and(arg)
                when 'or' then new kSqlExpression().or(arg)
                else throw new Error "Unrecognized func: #{func}"
        catch err
            return err
    'an error gets thrown': (err) ->
        assert.strictEqual err.toString(), "Error: expr must be a string"


suite.addBatch
    'when calling and() without an argument': contextBadArgError('and', undefined)
    'when calling and() with an array argument': contextBadArgError('and',  [])
    'when calling and() with an object argument': contextBadArgError('and',  {a:'a'})
    'when calling and() with a function argument': contextBadArgError('and',  () -> return 'a')
    'when calling and() with a string argument': contextAssertObjInstance new kSqlExpression().and("test")



suite.addBatch
    'when calling or() without an argument': contextBadArgError('or', undefined)
    'when calling or() with an array argument': contextBadArgError('or', [])
    'when calling or() with an object argument': contextBadArgError('or', {a:'a'})
    'when calling or() with a function argument': contextBadArgError('or', () -> return 'a')
    'when calling or() with a string argument': contextAssertObjInstance new kSqlExpression().or("test")





suite.addBatch
    'when and("test = 3") is called':
        topic: new kSqlExpression().and("test = 3")
        'then when toString() is called': contextAssertStringEqual("test = 3")
        'then when and("flight = \'4\'") is called':
            topic: (obj) -> obj.and("flight = '4'")
            'the object instance is returned': funcAssertObjInstance
            'then when toString() is called': contextAssertStringEqual "test = 3 AND flight = '4'"
            'then when or("dummy in (1,2,3)") is called':
                topic: (obj) -> obj.or("dummy in (1,2,3)")
                'the object instance is returned': funcAssertObjInstance
                'then when toString() is called': contextAssertStringEqual "test = 3 AND flight = '4' OR dummy in (1,2,3)"


suite.addBatch
    'when or("test = 3") is called':
        topic: new kSqlExpression().or("test = 3")
        'then when toString() is called': contextAssertStringEqual "test = 3"
        'then when or("flight = \'4\'") is called':
            topic: (obj) -> obj.or("flight = '4'")
            'the object instance is returned': funcAssertObjInstance
            'then when toString() is called': contextAssertStringEqual "test = 3 OR flight = '4'"
            'then when and("dummy in (1,2,3)") is called':
                topic: (obj) -> obj.and("dummy in (1,2,3)")
                'the object instance is returned': funcAssertObjInstance
                'then when toString() is called': contextAssertStringEqual "test = 3 OR flight = '4' AND dummy in (1,2,3)"



suite.export(module)

