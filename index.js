let adminApp;


/**
 * FireSchema
 */
class FireSchema {
  constructor() {
    this.models = {};
  }
}

FireSchema.registerApp = (app, options = {}) => {
  adminApp = app;
};


/**
 * Shared instance
 */
const instance = new FireSchema();


/**
 * SchemaType
 */
const SchemaTypes = {
  any: 'any',
  array: 'array',
  uid: 'uid',
  number: 'number',
  object: 'object',
  reference: 'reference',
  string: 'string',
};


/**
 * Schema
 */
class Schema {
  constructor(attributes) {
    Object.keys(attributes).forEach((attr) => {
      this[attr] = attributes[attr];
    });
  }
}

Schema.Types = SchemaTypes;
Schema.fireSchema = instance;


/**
 * Model
 */
class Model {
  constructor(name, schema) {
    this.name = name;
    this.schema = schema;
  }
}

Model.fireSchema = instance;


/**
 * Exports
 */
module.exports.FireSchema = FireSchema;
module.exports.Model = Model;
module.exports.Schema = Schema;

