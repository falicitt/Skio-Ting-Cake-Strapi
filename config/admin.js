module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '57b939ffc2cbaaba8e053cc6edd9885b'),
  },
});
