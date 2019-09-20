const changeCase = require('change-case');
const computed = require('schm-computed');
const methods = require('schm-methods');
const pluralize = require('pluralize');
const schema = require('@sheminusminus/schm');
const _ = require('lodash');


/**
 * User's firebase-admin app - value is set in FireSchema.registerApp
 */
let adminApp;


/**
 * FireSchema
 */
class FireSchema {}

FireSchema.models = {};

FireSchema.registerApp = (app, options = {}) => {
  adminApp = app;
};


/**
 * Create models
 * @param {string} name
 * @param {schema} schema
 * @param {Object?} relationships
 * @return {Class}
 */
const createModel = (name, schema, relationships = {}) => {
  if (adminApp === undefined) {
    throw new Error('FireSchema.registerApp must be called before creating models');
  }

  FireSchema.models[name] = class {
    constructor(pk) {
      this.modelName = name;
      this.values = {};
      this.primaryKey = pk;
    }

    async initialize(values) {
      try {
        const parsedParams = await FireSchema.models[name].schema.validate(values);

        Object.keys(parsedParams).forEach((key) => {
          this.values[key] = parsedParams[key];
        });
      } catch (e) {
        console.log('error on initialize', e);
        return undefined;
      }
    }

    delete() {
      console.log();
    }

    save() {}

    update() {}

    get schemaParams() {
      return FireSchema.models[this.modelName].schema.params;
    }
  };

  // Model.db = adminApp.database();
  FireSchema.models[name].modelName = name;
  FireSchema.models[name].relationships = relationships;
  FireSchema.models[name].schema = schema;
  FireSchema.models[name].refPath = changeCase.snakeCase(pluralize(name));
  FireSchema.models[name].init = async (values) => {
    const entity = new FireSchema.models[name](FireSchema.models[name].schema.primaryKey);
    await entity.initialize(values);
    return entity;
  };

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


/**
 * Create schemas
 * @param {Object} params
 * @param {*} groups
 * @return {schema}
 */
const createSchema = (params, ...groups) => {
  const createdSchema = schema(params, ...groups);

  createdSchema.primaryKey = _.find(Object.keys(params), (key) => {
    const val = params[key];

    if (_.isObject(val) && !Array.isArray(val)) {
      return val.primaryKey;
    }

    return false;
  });

  return createdSchema;
};


/**
 * Validate this entity exists in the database; lookup by primary key
 * @param {string} ref
 * @return {Function}
 */
const createRemoteExistsValidator = ref => async (
  value,
  option,
  paramPath,
  options,
  values,
  schema
) => {
  if (paramPath === schema.primaryKey) {
    const snapshot = await adminApp
      .database()
      .ref(ref)
      .orderByChild(paramPath)
      .equalTo(value)
      .once('value');

    return {
      valid: snapshot.exists(),
    };
  }
  return {
    valid: true,
  };
};

/**
 * Validate this entity was created with a value for its primary key
 * @param {string} primaryKeyParam
 * @return {Function}
 */
const createPrimaryKeyValidator = primaryKeyParam => async (
  value,
  option,
  paramPath,
  options,
  values,
  schema
) => ({
  valid: !!_.get(paramPath, values),
});


const registerApp = (app, options) => {
  FireSchema.registerApp(app, options);
  return app;
};


/**
 * Exports
 */
module.exports.registerApp = registerApp;
module.exports.createSchema = createSchema;
module.exports.createModel = createModel;
module.exports.createRemoteExistsValidator = createRemoteExistsValidator;
module.exports.createPrimaryKeyValidator = createPrimaryKeyValidator;

