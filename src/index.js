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

        await Object.keys(parsedParams).forEach(async (key) => {
          this.values[key] = parsedParams[key];

          const param = FireSchema.models[name].schema.params[key];
          const type = param ? param.type : undefined;
          let defaultVal = param ? param.defaultValue : undefined;

          if (type) {
            if (schema.isSchema(type)) {
              const data = values[key] || defaultVal;
              this.values[key] = await type.validate(data);
              this[`get${changeCase.upperCaseFirst(key)}`] = this.makeGetterSingular(key);
            }

            if (Array.isArray(type)) {
              if (type.length > 0 && schema.isSchema(type[0].type)) {
                const t = type[0].type;

                defaultVal = t.defaultValue;

                const data = values[key];

                this.values[key] = await Promise.all(
                  await _.map(data, async (d) => (t.validate(d))) || defaultVal,
                );

                this[`get${changeCase.upperCaseFirst(pluralize(key))}`] = this.makeGetterMulti(key);
              }
            }
          }
        });

        return this;
      } catch (e) {
        console.log('error on initialize', e);
        throw e;
      }
    }

    static get modelPlural() {
      return changeCase.snakeCase(pluralize(this.modelName)).toLowerCase();
    }

    static get modelSingular() {
      return changeCase.snakeCase(this.modelName).toLowerCase();
    }

    static async getIncluded(data = {}, model = undefined, as = undefined) {
      if (model) {
        if (as) {
          const includedData = _.get(data, as);

          if (includedData) {
            if (pluralize(as) === as) {
              return _.map(includedData, (d) => model.init(d));
            }

            return model.init(includedData);
          }
        } else {
          let includedData = _.get(data, model.modelSingular);

          if (includedData) {
            return model.init(includedData);
          }

          includedData = _.get(data, model.modelPlural);

          if (includedData) {
            return _.map(includedData, (d) => model.init(d));
          }
        }
      }

      return undefined;
    }

    /**
     * @param {{ where: *, include: * }} options
     * @return {Promise<?Object>}
     */
    static async findOne(options = {}) {
      try {
        const { where = {}, include = {} } = options;

        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where);
        const includeKeys = Object.keys(include); // eslint-disable-line

        if (whereKeys.length > 0) {
          if (whereKeys.includes(this.schema.primaryKey)) {
            const pkVal = where[this.schema.primaryKey];
            const snapshot = await FireSchema
              .admin
              .database()
              .ref(this.modelPlural)
              .orderByChild(this.schema.primaryKey)
              .equalTo(pkVal)
              .once('value');

            const data = snapshot.val() || {};
            const resultsObj = _.toPlainObject(data);
            const items = _.map(resultsObj, (d) => d);

            if (items.length > 0) {
              return this.init(items[0]);
            }
          } else {
            const initialSearchKey = whereKeys[0];
            const restKeys = whereKeys.slice(1);
            const initialSearchVal = whereValues[0];
            const restValues = whereValues.slice(1);

            const snapshot = await FireSchema
              .admin
              .database()
              .ref(this.modelPlural)
              .orderByChild(initialSearchKey)
              .equalTo(initialSearchVal)
              .once('value');

            const data = snapshot.val() || {};
            const resultsObj = _.toPlainObject(data);
            const items = _.map(resultsObj, (d) => d);

            const result = _.reduce(restKeys, (searchItems, currentKey, idx) => {
              const currentValue = restValues[idx];

              return searchItems.filter((item) => (
                _.get(item, currentKey) === currentValue
              ));
            }, items);

            if (result.length > 0) {
              return this.init(result[0]);
            }
          }
        }

        return undefined;
      } catch (e) {
        console.log('error on findOne', e);
        throw e;
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
