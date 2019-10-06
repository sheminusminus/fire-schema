require('dotenv').config();
const admin = require('firebase-admin');

const {
  // createRemoteExistsValidator,
  createSchema,
  createModel,
  registerApp,
  computed,
  withRef,
} = require('../src');

const fullData = require('./data');


registerApp(
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.DB_URL,
  }),
);

const setupDb = async () => {
  await admin.database().ref().set(fullData);
};

const phoneSchema = createSchema({
  countryCode: String,
  number: String,
}, computed({
  full: values => `${values.countryCode || ''}${values.number || ''}`,
}));

const addressSchema = createSchema({
  street1: String,
  street2: String,
  city: String,
  state: String,
  zip: String,
  country: String,
}, computed({
  asString: values => `${values.street1} ${values.city}, ${values.state} ${values.zip}`,
}));

const userSchema = createSchema({
  address: addressSchema,
  age: Number,
  firstName: String,
  lastName: String,
  phone: phoneSchema,
  uid: {
    type: String,
    primaryKey: true,
  },
}, computed({
  fullName: values => `${values.firstName} ${values.lastName}`,
}), withRef('users'));

const groupSchema = createSchema({
  id: {
    primaryKey: true,
    type: String,
  },
  name: String,
  users: {
    type: [userSchema],
    defaultValue: [],
  },
});

const directorySchema = createSchema({
  groups: {
    type: [groupSchema],
    defaultValue: [],
  },
  id: {
    primaryKey: true,
    type: String,
  },
  name: String,
  users: {
    type: [userSchema],
    defaultValue: [],
  },
});

const collectionSchema = createSchema({
  directories: {
    type: [directorySchema],
    defaultValue: [],
  },
  id: {
    primaryKey: true,
    type: String,
  },
  name: String,
});

const User = createModel('User', userSchema);

const Group = createModel('Group', groupSchema)
  .hasMany(User, { as: 'users' });

const Directory = createModel('Directory', directorySchema)
  .hasMany(Group, { as: 'groups' })
  .hasMany(User, { as: 'users' });

const Collection = createModel('Collection', collectionSchema)
  .hasMany(Directory, { as: 'directories' });

describe('config', () => {
  it('runs', async () => {
    expect(await Promise.resolve(true)).toEqual(true);
  })
});
