import _ from 'lodash';


export const isObjNotArr = (val) => _.isObject(val) && !Array.isArray(val);

export const parseOptions = (options = {}) => {
  const requirements = [];

  const { where } = options;

  if (isObjNotArr(where)) {
    const keys = Object.keys(where);

  }
};
