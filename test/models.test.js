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

const serviceAccount = JSON.parse(process.env.GOOGLE_CREDS);

registerApp(
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DB_URL,
  }),
);

const setupDb = async () => {
  await admin.database().ref().set(fullData);
};

const phoneSchema = createSchema({
  countryCode: String,
  number: String,
});

const addressSchema = createSchema({
  street1: String,
  street2: String,
  city: String,
  state: String,
  zip: String,
  country: String,
});

const userSchema = createSchema({
  address: addressSchema,
  age: Number,
  firstName: String,
  gender: String,
  lastName: String,
  phone: phoneSchema,
  uid: {
    type: String,
    primaryKey: true,
  },
});

const userComputedSchema = createSchema({
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
}));

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

const testUserValues = {
  address: {
    city: 'Spicytown',
    country: 'USA',
    state: 'IL',
    street1: '123 Burrito Ave',
    street2: 'Suite 1',
  },
  age: 92,
  firstName: 'Taco',
  gender: 'm',
  lastName: 'Bob',
  phone: {
    countryCode: '+1',
    number: '5558675309',
  },
  uid: 'a1',
};

describe('createModel', () => {
  describe('static', () => {
    it('has the correct properties', () => {
      expect(User.modelName).toEqual('User');
      expect(User.relationships).toEqual({ hasMany: {} });
      expect(User.schema).toEqual(userSchema);
      expect(User.refPath).toEqual('users');
    });

    it('has the correct getters', () => {
      expect(User.modelSingular).toEqual('user');
      expect(User.modelPlural).toEqual('users');
    });

    it('has the correct methods', () => {
      expect(typeof User.init).toEqual('function');
      expect(typeof User.findOne).toEqual('function');
      expect(typeof User.hasMany).toEqual('function');
    });
  });

  describe('instances', () => {
    it('init with data as values', async () => {
      const user = await User.init(testUserValues);
      expect(user.values).toEqual(testUserValues);
    });

    it('has the correct sub-schema methods', async () => {
      const user = await User.init(testUserValues);
      expect(typeof user.getAddress).toEqual('function');
      expect(typeof user.getPhone).toEqual('function');
    });
  });

  describe('findOne', () => {
    it('finds a specific instance from Firebase data using primary key', async () => {
      const user = await User.findOne({ where: { uid: fullData.users.a1.uid } });
      expect(user.values).toEqual(fullData.users.a1);
    });

    it('finds a specific instance from Firebase data using 1 non-primary key', async () => {
      const user = await User.findOne({ where: { firstName: fullData.users.a1.firstName } });
      expect(user.values).toEqual(fullData.users.a1);
    });

    it('finds a specific instance from Firebase data using >1 non-primary keys', async () => {
      const user = await User.findOne({
        where: {
          firstName: fullData.users.a1.firstName,
          lastName: fullData.users.a1.lastName,
        },
      });
      expect(user.values).toEqual(fullData.users.a1);
    });

    it('returns undefined if none found', async () => {
      const user = await User.findOne({ where: { firstName: 'not-exist' } });
      expect(user).toEqual(undefined);
    });
  });

  describe('findAll', () => {
    it('finds multiple instances from Firebase data using non-primary key', async () => {
      const users = await User.findAll({ where: { age: fullData.users.a1.age } });
      expect(users.length).toEqual(2);
    });

    it('finds a multiple instances from Firebase data using >1 non-primary keys', async () => {
      const users = await User.findAll({
        where: {
          age: fullData.users.a1.age,
          lastName: fullData.users.a1.lastName,
        },
      });
      expect(users.length).toEqual(2);
    });

    it('returns empty array if none found', async () => {
      const users = await User.findAll({ where: { firstName: 'not-exist' } });
      expect(users).toEqual([]);
    });
  });
});

