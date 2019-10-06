require('dotenv').config();
const admin = require('firebase-admin');

const {
  // createRemoteExistsValidator,
  createSchema,
  createModel,
  registerApp,
  computed,
  withRef,
} = require('./src');


registerApp(
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.DB_URL,
  }),
);

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

// const existingUserSchema = createSchema({
//   id: {
//     primaryKey: true,
//     type: String,
//   },
//   name: String,
//   age: Number,
//   address: addressSchema,
// }, previous => previous.merge({
//   validators: {
//     remoteExists: createRemoteExistsValidator('users'),
//   },
// }));

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

process.nextTick(async () => {
  const user = await User.init({ firstName: 'Emily', lastName: 'Kolar', age: 30, uid: 'dkHmklw3CfM8BCXwpqgqHO6ZZUn2' });
  const dir = await Directory.init({ name: 'Awesome Church', id: 'zxcvbn12345', users: [user] });

  // dir.getUsers();
  // console.log(user, dir);
  //
  // Directory.hasMany(Group, { as: 'groups' });
  // Directory.hasMany(User, { as: 'users' });

  const getGroupData = async (id = '') => {
    const result = await Group.findOne({
      where: {
        id,
      },
      include: [{
        model: User,
      }],
    });
  };

  const getDirData = async (id = '') => {
    const result = await Directory.findOne({
      where: { id },
      include: [{
        model: User,
      }, {
        model: Group,
        include: [{
          model: User,
        }],
      }],
    });
  };

  const getCollData = async (id = '') => {
    const result = await Collection.findOne({
      where: { id },
      include: [{
        model: Directory,
        include: [{
          model: Group,
          include: [{
            model: User,
          }]
        }, {
          model: User,
        }]
      }],
    });
  };

  const getUserData = async (id = '', dirId = '') => {
    // User.belongsTo(Directory);
    // Group.hasMany(User, { as: 'users' }); // db key for dir user is member

    const result = await User.findOne({
      where: {
        uid: 'a1',
      },
    });

    // User.findOne({ whereComputes: { fullName: 'Emily Kolar' } });
    // Directory.findOne({
    //   where: { id: dirId },
    //   // returns an array of 'members' since "hasMany"
    //   // aliased to "member" in the db
    //   include: { model: User, as: 'members' },
    // });
    //
    // User.findOne({
    //   where: { id: 'asdf' },
    //   // returns a single directory since "belongsTo"
    //   include: { model: Directory },
    // });

    // const user = await User.findOne({ where: { id }});
    // const dir = await Directory.findOne({ where: { id: dirId }});
    //
    // const userEventually = await User.findOrCreate({ where: { id }});
    //
    // const newUser = await User.create({ name: 'Ellen' });
    //
    // const directoryUsers = await User.findAll({
    //   where: {
    //     profiles: {
    //       contains: dirId,
    //     },
    //   },
    // });
    //
    // const directoryAdmins = await Directory.findOne({
    //   where: {
    //     id: dirId,
    //   },
    //   include: [
    //     { model: User },
    //   ],
    // });
    //
    // const usersJsonDump = await User.findAll({ raw: true });
  };

  await getUserData();
});

