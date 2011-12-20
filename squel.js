
/*
Copyright (c) 2012 Ramesh Nair (hiddentao.com)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

(function() {
  var Expression, Select, Update, WhereOrderLimit, getObjectClassName, sanitizeAlias, sanitizeCondition, sanitizeField, sanitizeLimitOffset, sanitizeName, sanitizeTable, sanitizeValue,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Expression = (function() {
    var _toString;

    Expression.prototype.tree = null;

    Expression.prototype.current = null;

    function Expression() {
      this.toString = __bind(this.toString, this);
      this.or = __bind(this.or, this);
      this.and = __bind(this.and, this);
      this.end = __bind(this.end, this);
      this.or_begin = __bind(this.or_begin, this);
      this.and_begin = __bind(this.and_begin, this);
      var _this = this;
      this.tree = {
        parent: null,
        nodes: []
      };
      this.current = this.tree;
      this._begin = function(op) {
        var new_tree;
        new_tree = {
          type: op,
          parent: _this.current,
          nodes: []
        };
        _this.current.nodes.push(new_tree);
        _this.current = _this.current.nodes[_this.current.nodes.length - 1];
        return _this;
      };
    }

    Expression.prototype.and_begin = function() {
      return this._begin('AND');
    };

    Expression.prototype.or_begin = function() {
      return this._begin('OR');
    };

    Expression.prototype.end = function() {
      if (!this.current.parent) throw new Error("begin() needs to be called");
      this.current = this.current.parent;
      return this;
    };

    Expression.prototype.and = function(expr) {
      if (!expr || "string" !== typeof expr) {
        throw new Error("expr must be a string");
      }
      this.current.nodes.push({
        type: 'AND',
        expr: expr
      });
      return this;
    };

    Expression.prototype.or = function(expr) {
      if (!expr || "string" !== typeof expr) {
        throw new Error("expr must be a string");
      }
      this.current.nodes.push({
        type: 'OR',
        expr: expr
      });
      return this;
    };

    Expression.prototype.toString = function() {
      if (null !== this.current.parent) {
        throw new Error("end() needs to be called");
      }
      return _toString(this.tree);
    };

    _toString = function(node) {
      var child, nodeStr, str, _i, _len, _ref;
      str = "";
      _ref = node.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        if (child.expr != null) {
          nodeStr = child.expr;
        } else {
          nodeStr = _toString(child);
          if ("" !== nodeStr) nodeStr = "(" + nodeStr + ")";
        }
        if ("" !== nodeStr) {
          if ("" !== str) str += " " + child.type + " ";
          str += nodeStr;
        }
      }
      return str;
    };

    return Expression;

  })();

  getObjectClassName = function(obj) {
    var arr;
    if (obj && obj.constructor && obj.constructor.toString) {
      arr = obj.constructor.toString().match(/function\s*(\w+)/);
      if (arr && arr.length === 2) return arr[1];
    }
  };

  sanitizeCondition = function(condition) {
    var t;
    t = typeof condition;
    if ("Expression" !== getObjectClassName(condition) && "string" !== t) {
      throw new Error("condition must be a string or Expression instance");
    }
    if ("Expression" === t) condition = condition.toString();
    return condition;
  };

  sanitizeName = function(value, type) {
    if ("string" !== typeof value) {
      throw new Error("" + type + " must be a string");
    }
    return value;
  };

  sanitizeField = function(item) {
    return sanitizeName(item, "field name");
  };

  sanitizeTable = function(item) {
    return sanitizeName(item, "table name");
  };

  sanitizeAlias = function(item) {
    return sanitizeName(item, "alias");
  };

  sanitizeValue = function(item) {
    return sanitizeName(item, "value");
  };

  sanitizeLimitOffset = function(value) {
    value = parseInt(value);
    if (0 > value) throw new Error("limit/offset must be >=0");
    return value;
  };

  WhereOrderLimit = (function() {

    WhereOrderLimit.prototype.wheres = null;

    WhereOrderLimit.prototype.orders = null;

    WhereOrderLimit.prototype.limits = null;

    function WhereOrderLimit() {
      this.limitString = __bind(this.limitString, this);
      this.orderString = __bind(this.orderString, this);
      this.whereString = __bind(this.whereString, this);
      this.limit = __bind(this.limit, this);
      this.order = __bind(this.order, this);
      this.where = __bind(this.where, this);      this.wheres = [];
      this.orders = [];
    }

    WhereOrderLimit.prototype.where = function(condition) {
      condition = sanitizeCondition(condition);
      if ("" !== condition) this.wheres.push(condition);
      return this;
    };

    WhereOrderLimit.prototype.order = function(field, asc) {
      if (asc == null) asc = true;
      field = sanitizeField(field);
      this.orders.push({
        field: field,
        dir: asc ? "ASC" : "DESC"
      });
      return this;
    };

    WhereOrderLimit.prototype.limit = function(max) {
      max = sanitizeLimitOffset(max);
      this.limits = max;
      return this;
    };

    WhereOrderLimit.prototype.whereString = function() {
      if (0 < this.wheres.length) {
        return " WHERE (" + this.wheres.join(") AND (") + ")";
      } else {
        return "";
      }
    };

    WhereOrderLimit.prototype.orderString = function() {
      var o, orders, _i, _len, _ref;
      if (0 < this.orders.length) {
        orders = "";
        _ref = this.orders;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          o = _ref[_i];
          if ("" !== orders) orders += ", ";
          orders += "" + o.field + " " + o.dir;
        }
        return " ORDER BY " + orders;
      } else {
        return "";
      }
    };

    WhereOrderLimit.prototype.limitString = function() {
      if (this.limits) {
        return " LIMIT " + this.limits;
      } else {
        return "";
      }
    };

    return WhereOrderLimit;

  })();

  Select = (function(_super) {

    __extends(Select, _super);

    Select.prototype.froms = null;

    Select.prototype.fields = null;

    Select.prototype.joins = null;

    Select.prototype.groups = null;

    Select.prototype.offsets = null;

    Select.prototype.useDistinct = false;

    function Select() {
      this.toString = __bind(this.toString, this);
      this.offset = __bind(this.offset, this);
      this.group = __bind(this.group, this);
      this.outer_join = __bind(this.outer_join, this);
      this.right_join = __bind(this.right_join, this);
      this.left_join = __bind(this.left_join, this);
      this.join = __bind(this.join, this);
      this.field = __bind(this.field, this);
      this.from = __bind(this.from, this);
      this.distinct = __bind(this.distinct, this);
      var _this = this;
      Select.__super__.constructor.apply(this, arguments);
      this.froms = [];
      this.fields = [];
      this.joins = [];
      this.groups = [];
      this._join = function(type, table, alias, condition) {
        table = sanitizeTable(table);
        if (alias) alias = sanitizeAlias(alias);
        if (condition) condition = sanitizeCondition(condition);
        _this.joins.push({
          type: type,
          table: table,
          alias: alias,
          condition: condition
        });
        return _this;
      };
    }

    Select.prototype.distinct = function() {
      this.useDistinct = true;
      return this;
    };

    Select.prototype.from = function(table, alias) {
      if (alias == null) alias = null;
      table = sanitizeTable(table);
      if (alias) alias = sanitizeAlias(alias);
      this.froms.push({
        name: table,
        alias: alias
      });
      return this;
    };

    Select.prototype.field = function(field, alias) {
      if (alias == null) alias = null;
      field = sanitizeField(field);
      if (alias) alias = sanitizeAlias(alias);
      this.fields.push({
        field: field,
        alias: alias
      });
      return this;
    };

    Select.prototype.join = function(table, alias, condition) {
      if (alias == null) alias = null;
      if (condition == null) condition = null;
      return this._join('INNER', table, alias, condition);
    };

    Select.prototype.left_join = function(table, alias, condition) {
      if (alias == null) alias = null;
      if (condition == null) condition = null;
      return this._join('LEFT', table, alias, condition);
    };

    Select.prototype.right_join = function(table, alias, condition) {
      if (alias == null) alias = null;
      if (condition == null) condition = null;
      return this._join('RIGHT', table, alias, condition);
    };

    Select.prototype.outer_join = function(table, alias, condition) {
      if (alias == null) alias = null;
      if (condition == null) condition = null;
      return this._join('OUTER', table, alias, condition);
    };

    Select.prototype.group = function(field) {
      field = sanitizeField(field);
      this.groups.push(field);
      return this;
    };

    Select.prototype.offset = function(start) {
      start = sanitizeLimitOffset(start);
      this.offsets = start;
      return this;
    };

    Select.prototype.toString = function() {
      var f, field, fields, groups, j, joins, ret, table, tables, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4;
      if (0 >= this.froms.length) throw new Error("from() needs to be called");
      ret = "SELECT ";
      if (this.useDistinct) ret += "DISTINCT ";
      fields = "";
      _ref = this.fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        field = _ref[_i];
        if ("" !== fields) fields += ", ";
        fields += field.field;
        if (field.alias) fields += " AS \"" + field.alias + "\"";
      }
      ret += "" === fields ? "*" : fields;
      tables = "";
      _ref2 = this.froms;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        table = _ref2[_j];
        if ("" !== tables) tables += ", ";
        tables += table.name;
        if (table.alias) tables += " `" + table.alias + "`";
      }
      ret += " FROM " + tables;
      joins = "";
      _ref3 = this.joins;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        j = _ref3[_k];
        joins += " " + j.type + " JOIN " + j.table;
        if (j.alias) joins += " `" + j.alias + "`";
        if (j.condition) joins += " ON (" + j.condition + ")";
      }
      ret += joins;
      ret += this.whereString();
      if (0 < this.groups.length) {
        groups = "";
        _ref4 = this.groups;
        for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
          f = _ref4[_l];
          if ("" !== groups) groups += ", ";
          groups += f;
        }
        ret += " GROUP BY " + groups;
      }
      ret += this.orderString();
      ret += this.limitString();
      if (this.offsets) ret += " OFFSET " + this.offsets;
      return ret;
    };

    return Select;

  })(WhereOrderLimit);

  Update = (function(_super) {

    __extends(Update, _super);

    Update.prototype.tables = null;

    Update.prototype.fields = null;

    function Update() {
      this.toString = __bind(this.toString, this);
      this.field = __bind(this.field, this);
      this.table = __bind(this.table, this);      Update.__super__.constructor.apply(this, arguments);
      this.tables = [];
      this.fields = [];
    }

    Update.prototype.table = function(table, alias) {
      if (alias == null) alias = null;
      table = sanitizeTable(table);
      if (alias) alias = sanitizeAlias(alias);
      this.tables.push({
        name: table,
        alias: alias
      });
      return this;
    };

    Update.prototype.field = function(field, value) {
      field = sanitizeField(field);
      value = sanitizeValue(value);
      this.fields.push({
        field: field,
        value: value
      });
      return this;
    };

    Update.prototype.toString = function() {
      var field, fields, ret, table, tables, _i, _j, _len, _len2, _ref, _ref2;
      if (0 >= this.tables.length) throw new Error("table() needs to be called");
      if (0 >= this.fields.length) throw new Error("field() needs to be called");
      ret = "UPDATE ";
      tables = "";
      _ref = this.froms;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        table = _ref[_i];
        if ("" !== tables) tables += ", ";
        tables += table.name;
        if (table.alias) tables += " AS `" + table.alias + "`";
      }
      ret += tables;
      fields = "";
      _ref2 = this.fields;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        field = _ref2[_j];
        if ("" !== fields) fields += ", ";
        fields += "SET " + field.field + " = " + field.value;
      }
      ret += " " + fields;
      ret += this.whereString();
      ret += this.orderString();
      ret += this.limitString();
      return ret;
    };

    return Update;

  })(WhereOrderLimit);

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      expr: function() {
        return new Expression;
      },
      select: function() {
        return new Select;
      },
      update: function() {
        return new Update;
      },
      insert: function() {
        return new Insert;
      },
      "delete": function() {
        return new Delete;
      }
    };
  }

}).call(this);
