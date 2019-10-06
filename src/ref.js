/**
 * Add Firebase ref path to schm.
 */
const withRef = (refString) => (previous) => previous.merge({
  parse(...args) {
    const parsed = previous.parse(...args);
    parsed.$ref = refString;
    return parsed;
  },
});

export default withRef;
