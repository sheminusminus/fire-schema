import _ from 'lodash';
import computed from 'schm-computed';
import methods from 'schm-methods';
import pluralize from 'pluralize';
import schema from '@sheminusminus/schm';
import * as changeCase from 'change-case';

import FireSchema from './FireSchema';

import withRef from './ref';


/**
 * Create models
 * @param {string} name
 * @param {schema} _schema
 * @param {Object?} relationships
 * @return {Class}
 */
const createModel = (name, _schema, relationships = {}) => {
  if (FireSchema.admin === undefined) {
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

          const param = FireSchema.models[name].schema.params[key];
          const type = param ? param.type : undefined;
          console.log(key, type);
          if (type) {
            if (schema.isSchema(type)) {
              this[`get${changeCase.upperCaseFirst(key)}`] = this.makeGetterSingular(key);
            }

            if (Array.isArray(type)) {
              if (type.length > 0 && schema.isSchema(type[0].type)) {
                this[`get${changeCase.upperCaseFirst(pluralize(key))}`] = this.makeGetterMulti(key);
              }
            }
          }
        });

        return this;
      } catch (e) {
        console.log('error on initialize', e);
        return undefined;
      }
    }

    async findOne(options = {}) {
      try {
        const parsedParams = await FireSchema.models[name].schema.validate(values);

        Object.keys(parsedParams).forEach((key) => {
          this.values[key] = parsedParams[key];

          const param = FireSchema.models[name].schema.params[key];
          const type = param ? param.type : undefined;
          console.log(key, type);
          if (type) {
            if (schema.isSchema(type)) {
              this[`get${changeCase.upperCaseFirst(key)}`] = this.makeGetterSingular(key);
            }

            if (Array.isArray(type)) {
              if (type.length > 0 && schema.isSchema(type[0].type)) {
                this[`get${changeCase.upperCaseFirst(pluralize(key))}`] = this.makeGetterMulti(key);
              }
            }
          }
        });

        return this;
      } catch (e) {
        console.log('error on initialize', e);
        return undefined;
      }
    }

    makeGetterSingular(key) {
      return () => {
        console.log('get single', key, this.values[key]);
      };
    }

    makeGetterMulti(key) {
      return () => {
        console.log('get multi', key, this.values[key]);
      };
    }

    /* eslint-disable */
    delete() {
      console.log();
    }

    save() {
      const { values } = this;
      FireSchema.db.ref()
    }

    update() {}
    /* eslint-enable */

    get schemaParams() {
      return FireSchema.models[this.modelName].schema.params;
    }
  };

  // Model.db = adminApp.database();
  FireSchema.models[name].modelName = name;
  FireSchema.models[name].relationships = relationships;
  FireSchema.models[name].schema = _schema;
  FireSchema.models[name].refPath = changeCase.snakeCase(pluralize(name));
  FireSchema.models[name].init = async (values) => {
    const entity = new FireSchema.models[name](FireSchema.models[name].schema.primaryKey);
    await entity.initialize(values);
    return entity;
  };

  FireSchema.models[name].findByChildren = () => new FireSchema.models[name]({});

  FireSchema.models[name].findByKey = () => new FireSchema.models[name]({});

  FireSchema.models[name].findByValue = () => [];

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
const createRemoteExistsValidator = (ref) => async (
  value,
  option,
  paramPath,
  options,
  values,
  sch,
) => {
  if (paramPath === sch.primaryKey) {
    const snapshot = await FireSchema.admin
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
 * @return {Function}
 */
const createPrimaryKeyValidator = () => async (
  value,
  option,
  paramPath,
  options,
  values,
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
module.exports.computed = computed;
module.exports.createModel = createModel;
module.exports.createPrimaryKeyValidator = createPrimaryKeyValidator;
module.exports.createRemoteExistsValidator = createRemoteExistsValidator;
module.exports.createSchema = createSchema;
module.exports.method = methods;
module.exports.registerApp = registerApp;
module.exports.withRef = withRef;
