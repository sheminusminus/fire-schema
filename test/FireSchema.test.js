require('dotenv').config();

const { createModel, createSchema } = require('../src');

describe('FireSchema', () => {
  it('throws if called before registerApp is called', async () => {
    const throwing = () => createModel('Throws', createSchema({ id: String }));
    expect(throwing).toThrow();
  });
});
