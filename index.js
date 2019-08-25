const changeCase = require('change-case');
const pluralize = require('pluralize');


/**
 * User's firebase-admin app - value is set in FireSchema.registerApp
 */
let adminApp;


/**
 * Shared instance
 */
// const instance = new FireSchema();


/**
 * SchemaType
 */
const SchemaTypes = {
  any: 'any',
  array: 'array',
  date: 'date',
  uid: 'uid',
  number: 'number',
  json: 'json',
  reference: 'reference',
  string: 'string',
};


/**
 * Schema
 */
class Schema {
  constructor(attributes = {}, relationships = {}) {
    if (adminApp === undefined) {
      throw new Error('FireSchema.registerApp must be called before creating schemas');
    }

    this.attrs = {};
    Object.keys(attributes).forEach((attrKey) => {
      this.addAttribute(attrKey,  attributes[attrKey]);
    });

    this.rels = {};
    Object.keys(relationships).forEach((relKey) => {
      const relInfo = relationships[relKey];
      this.addRelationship(relKey, relInfo);
    });
  }

  addAttribute(key, value) {
    this.attrs[key] = value;
  }

  addRelationship(key, data) {
    if (Array.isArray(data.type)) {
      this.rels[key] = {
        ...data,
        type: data.type[0],
      };
    } else {
      this.rels[key] = data;
    }
  }
}

Schema.Types = SchemaTypes;


/**
 * FireSchema
 */
class FireSchema {}

FireSchema.registerApp = (app, options = {}) => {
  adminApp = app;
};

FireSchema.models = {};


/**
 * Modeling
 */
const createModel = (name, schema, relationships = {}) => {
  if (adminApp === undefined) {
    throw new Error('FireSchema.registerApp must be called before creating models');
  }

  FireSchema.models[name] = class {
    constructor(propValues) {
      this.properties = propValues;
      this.modelName = name;
    }

    delete() {}

    save() {}

    update() {}
  };

  // Model.db = adminApp.database();
  FireSchema.models[name].modelName = name;
  FireSchema.models[name].relationships = relationships;
  FireSchema.models[name].schema = schema;
  FireSchema.models[name].refPath = changeCase.snakeCase(pluralize(name));

  FireSchema.models[name].findByChildren = (childPath, where = {}) => {
    return new FireSchema.models[name]({});
  };

  FireSchema.models[name].findByKey = (keyPath, where = {}) => {
    return new FireSchema.models[name]({});
  };

  FireSchema.models[name].findByValue = (valuePath, where = {}) => {
    return [];
  };

  return FireSchema.models[name];
};


FireSchema.Schema = Schema;
FireSchema.createModel = createModel;
FireSchema.SchemaTypes = SchemaTypes;


/**
 * Exports
 */
module.exports.FireSchema = FireSchema;
module.exports.model = createModel;
module.exports.Schema = Schema;
module.exports.SchemaTypes = SchemaTypes;

