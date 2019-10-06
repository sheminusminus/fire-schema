/**
 * FireSchema
 */
class FireSchema {}

FireSchema.models = {};

FireSchema.registerApp = (app) => {
  FireSchema.admin = app;
  FireSchema.db = app.database();
};

export default FireSchema;
