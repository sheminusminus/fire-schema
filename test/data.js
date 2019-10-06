module.exports = {
  collections: {
    zxcvbn: {
      directories: {
        qwerty: true,
      },
      id: 'zxcvbn',
      name: 'Main',
    },
  },
  directories: {
    qwerty: {
      groups: {
        asdf: true,
      },
      id: 'qwerty',
      name: 'Awesomeness',
      users: {
        a1: true,
        b2: true,
      },
    },
  },
  groups: {
    asdf: {
      id: 'asdf',
      name: 'Cool Group',
      users: {
        a1: true,
      },
    },
  },
  users: {
    a1: {
      address: {
        city: 'Chicago',
        country: 'USA',
        state: 'IL',
        street1: '73 W Monroe',
        street2: 'Floor 5',
        zip: '60603',
      },
      age: 30,
      firstName: 'Emily',
      gender: 'f',
      lastName: 'K',
      phone: {
        countryCode: '+1',
        number: '8888675309',
      },
      uid: 'a1',
    },
    b2: {
      address: {
        city: 'New York City',
        country: 'USA',
        state: 'NY',
        street1: '123 Sesame St',
        street2: '',
        zip: '10002',
      },
      age: 30,
      firstName: 'Shawn',
      gender: 'm',
      lastName: 'K',
      phone: {
        countryCode: '+1',
        number: '5558675309',
      },
      uid: 'b2',
    },
  },
};
