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
// class Schema {
//   constructor(attributes = {}, relationships = {}) {
//     if (adminApp === undefined) {
//       throw new Error('FireSchema.registerApp must be called before creating schemas');
//     }
//
//     this.attrs = {};
//     Object.keys(attributes).forEach((attrKey) => {
//       this.addAttribute(attrKey,  attributes[attrKey]);
//     });
//
//     this.rels = {};
//     Object.keys(relationships).forEach((relKey) => {
//       const relInfo = relationships[relKey];
//       this.addRelationship(relKey, relInfo);
//     });
//   }
//
//   addAttribute(key, value) {
//     this.attrs[key] = value;
//   }
//
//   addRelationship(key, data) {
//     if (Array.isArray(data.type)) {
//       this.rels[key] = {
//         ...data,
//         type: data.type[0],
//       };
//     } else {
//       this.rels[key] = data;
//     }
//   }
// }
//
// Schema.Types = SchemaTypes;

/**
 * FireSchema
 */
class FireSchema {}

FireSchema.registerApp = (app, options = {}) => {
  adminApp = app;
};

FireSchema.models = {};
FireSchema.schemas = {};


const recurseAttributesAndProps = (attrs = {}, props = {}) => {
  const processed = {};

  Object.keys(attrs).forEach((key) => {
    const attr = attrs[key];

    if (typeof attr === 'object') {
      const { type, primaryKey, attributes } = attr;

      if (type === SchemaTypes.json) {
        processed[key] = recurseAttributesAndProps(attributes, props[key]);
      } else {
        processed[key] = props[key] || attr.defaultValue;
      }
    } else {
      processed[key] = props[key];
    }
  });

  return processed;
};

/**
 * Modeling
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
      this.initialize = this.initialize.bind(this);
    }

    async initialize(values) {
      try {
        const parsedParams = await FireSchema.models[name].schema.validate(values);

        Object.keys(parsedParams).forEach((key) => {
          const value = parsedParams[key];

          this.values[key] = value;

          // if (processedAttributes[key].primaryKey) {
          //   this.primaryKey = value;
          // } else {
          //   // magical setters (e.g. this.setAge(30))
          //   this[`set${changeCase.upperCaseFirst(key)}`] = () => {
          //     console.log('add a new', key);
          //   };
          // }
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

  // FireSchema.models[name] = class {
  //   constructor(propValues) {
  //     this.modelName = name;
  //
  //     const processedAttrs = recurseAttributesAndProps(schema.attrs, propValues);
  //
  //     Object.keys(processedAttrs).forEach((key) => {
  //       const value = processedAttrs[key];
  //       this[key] = value;
  //
  //       if (schema.attrs[key].primaryKey) {
  //         this.primaryKey = value;
  //       } else {
  //         // magical setters (e.g. this.setAge(30))
  //         this[`set${changeCase.upperCaseFirst(key)}`] = () => {
  //           console.log('add a new', key);
  //         };
  //       }
  //     });
  //
  //     if (!this.primaryKey) {
  //       throw new Error('One attribute must has primaryKey set to true');
  //     }
  //   }
  //
  //   delete() {
  //     console.log();
  //   }
  //
  //   save() {}
  //
  //   update() {}
  //
  //   getSchema() {
  //     return FireSchema.models[this.modelName].schema;
  //   }
  // };

  // Model.db = adminApp.database();
  FireSchema.models[name].modelName = name;
  FireSchema.models[name].relationships = relationships;
  FireSchema.models[name].schema = schema;
  FireSchema.models[name].refPath = changeCase.snakeCase(pluralize(name));
  FireSchema.models[name].init = async (values) => {
    const entity = new FireSchema.models[name](FireSchema.models[name].schema.primaryKey);
    console.log('blank entity', entity);
    await entity.initialize(values);
    console.log('initialized?', entity);
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


const createSchema = (params, ...groups) => {
  const s = schema(params, ...groups);

  s.primaryKey = _.find(Object.keys(params), (key) => {
    const val = params[key];

    if (_.isObject(val) && !Array.isArray(val)) {
      return val.primaryKey;
    }

    return false;
  });

  return s;
};

FireSchema.SchemaTypes = SchemaTypes;


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


/**
 * Exports
 */
module.exports.FireSchema = FireSchema;
module.exports.createSchema = createSchema;
module.exports.createModel = createModel;
module.exports.SchemaTypes = SchemaTypes;
module.exports.createRemoteExistsValidator = createRemoteExistsValidator;
module.exports.createPrimaryKeyValidator = createPrimaryKeyValidator;

